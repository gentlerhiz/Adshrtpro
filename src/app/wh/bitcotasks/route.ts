import { NextResponse } from "next/server";
import { createHash } from "crypto";
import * as storage from "@/lib/storage";

// BitcoTasks S2S postback handler
// Docs: https://bitcotasks.com/documentations (#ow_postback)
//
// BitcoTasks POSTs here whenever a user completes an offer. The endpoint must
// respond with exactly "ok" (lowercase, no whitespace) within 60s or the
// postback is marked failed and has to be resent manually from their dashboard.
//
// Set the Postback URL in the BitcoTasks dashboard to:
//   https://adshrtpro.com/wh/bitcotasks

// Share of the USD payout credited to the user; the rest is the platform's cut.
const USER_REVENUE_SHARE = 0.7;

// BitcoTasks sends postbacks from these IPs. Enforced only when
// BITCOTASKS_ALLOWED_IPS is set, so adding an IP on their side can't silently
// break crediting.
const DEFAULT_ALLOWED_IPS = ["45.14.135.48"];

const OK = () =>
  new NextResponse("ok", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });

const FAIL = (message: string, status = 200) =>
  new NextResponse(message, {
    status,
    headers: { "Content-Type": "text/plain" },
  });

function sourceIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "";
}

// PHP's $_REQUEST merges query and body, and BitcoTasks documents POST but
// their dashboard test tool sends GET. Accept both, plus a JSON body.
async function readParams(req: Request): Promise<Record<string, string>> {
  const params: Record<string, string> = {};

  new URL(req.url).searchParams.forEach((value, key) => {
    params[key] = value;
  });

  if (req.method === "POST") {
    const contentType = req.headers.get("content-type") || "";
    try {
      if (contentType.includes("application/json")) {
        const body = await req.json();
        for (const [key, value] of Object.entries(body ?? {})) {
          if (value !== null && value !== undefined) params[key] = String(value);
        }
      } else {
        const form = await req.formData();
        form.forEach((value, key) => {
          params[key] = String(value);
        });
      }
    } catch {
      // No parseable body - fall back to whatever came in on the query string.
    }
  }

  return params;
}

async function handle(req: Request): Promise<NextResponse> {
  const params = await readParams(req);

  const subId = params.subId;
  const transId = params.transId;
  const reward = params.reward;
  const payout = params.payout;
  const status = params.status;
  const signature = params.signature;
  const offerName = params.offer_name || "Offer";
  const offerType = params.offer_type || "";
  const country = params.country || "";
  const isDebug = params.debug === "1";
  const userIp = params.userIp || "0.0.0.0";

  console.log("BitcoTasks postback:", {
    subId,
    transId,
    reward,
    payout,
    status,
    offerName,
    offerType,
    country,
    debug: params.debug,
  });

  const setting = await storage.getOfferwallSetting("bitcotasks");
  if (!setting?.isEnabled) {
    console.log("BitcoTasks postback: network disabled");
    return FAIL("ERROR: Network disabled");
  }

  const secret = setting.secretKey;
  if (!secret) {
    console.error("BitcoTasks postback: no secret key configured");
    return FAIL("ERROR: Not configured");
  }

  // Optional source-IP allowlist.
  const allowlist = process.env.BITCOTASKS_ALLOWED_IPS
    ? process.env.BITCOTASKS_ALLOWED_IPS.split(",").map((ip) => ip.trim()).filter(Boolean)
    : null;
  if (allowlist && allowlist.length > 0) {
    const ip = sourceIp(req);
    const permitted = allowlist.length ? allowlist : DEFAULT_ALLOWED_IPS;
    if (!permitted.includes(ip)) {
      console.warn("BitcoTasks postback: rejected source IP", ip);
      return FAIL("ERROR: Invalid source");
    }
  }

  if (!subId || !transId || reward === undefined || reward === null) {
    return FAIL("ERROR: Missing parameters");
  }

  // Signature is md5(subId + transId + reward + secretKey), computed over the
  // raw reward string exactly as sent - do not parse or reformat it first.
  const expected = createHash("md5")
    .update(`${subId}${transId}${reward}${secret}`)
    .digest("hex");

  if (!signature || signature.toLowerCase() !== expected) {
    console.warn("BitcoTasks postback: signature mismatch", { subId, transId });
    return FAIL("ERROR: Signature doesn't match");
  }

  // Test postbacks are signed like real ones but must not move real money.
  if (isDebug) {
    console.log("BitcoTasks postback: debug postback verified, not crediting");
    return OK();
  }

  const user = await storage.getUser(subId);
  if (!user) {
    console.warn("BitcoTasks postback: unknown user", subId);
    return FAIL("ERROR: Unknown user");
  }

  // reward is virtual currency; payout is the USD value. Balances are in USD.
  const payoutUsd = parseFloat(payout || "0");
  if (!Number.isFinite(payoutUsd) || payoutUsd <= 0) {
    console.warn("BitcoTasks postback: invalid payout", payout);
    return FAIL("ERROR: Invalid payout");
  }

  // reward and payout are always absolute; status decides the direction.
  // 1 = credit, 2 = chargeback.
  const userAmount = (payoutUsd * USER_REVENUE_SHARE).toFixed(6);

  if (status === "2") {
    const debited = await storage.debitBalance(
      subId,
      userAmount,
      "offerwall_chargeback",
      `BitcoTasks chargeback: ${offerName} (${transId})`,
    );

    if (!debited) {
      // Insufficient balance - the user already spent it. Acknowledge anyway so
      // BitcoTasks stops retrying, and log it for manual reconciliation.
      console.error("BitcoTasks chargeback could not be applied:", {
        subId,
        transId,
        userAmount,
      });
    } else {
      console.log("BitcoTasks chargeback applied:", { subId, transId, userAmount });
    }

    return OK();
  }

  // Dedupe on transId, which BitcoTasks guarantees unique per conversion.
  const alreadyCredited = await storage.checkOfferwallTransaction("bitcotasks", transId);
  if (alreadyCredited) {
    console.log("Duplicate BitcoTasks completion:", { subId, transId });
    return OK();
  }

  await storage.recordOfferwallCompletion(
    subId,
    "bitcotasks",
    transId,
    transId,
    payoutUsd.toFixed(6),
    userIp,
  );

  await storage.creditBalance(
    subId,
    userAmount,
    "offerwall",
    `BitcoTasks ${offerType || "offer"}: ${offerName}`,
    "bitcotasks",
    transId,
    userIp,
  );

  console.log("BitcoTasks credited (70:30 split):", {
    subId,
    transId,
    payoutUsd,
    userAmount,
  });

  return OK();
}

export async function POST(req: Request) {
  try {
    return await handle(req);
  } catch (error) {
    console.error("BitcoTasks postback error:", error);
    return FAIL("ERROR: Server error");
  }
}

export async function GET(req: Request) {
  try {
    return await handle(req);
  } catch (error) {
    console.error("BitcoTasks postback error:", error);
    return FAIL("ERROR: Server error");
  }
}
