import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";

// AdBlueMedia postback handler
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const user_id = searchParams.get("user_id");
  const offer_id = searchParams.get("offer_id");
  const payout = searchParams.get("payout");
  const transaction_id = searchParams.get("transaction_id");
  const ip = searchParams.get("ip");
  const secret = searchParams.get("secret");
  
  console.log("AdBlueMedia postback:", { user_id, offer_id, payout, transaction_id, ip });

  // Check if offerwall is enabled and validate secret
  const setting = await storage.getOfferwallSetting("adbluemedia");
  if (!setting?.isEnabled) {
    return new NextResponse("0", { status: 400 });
  }

  // Security: Validate secret key matches configured API key
  if (setting.apiKey && secret !== setting.apiKey) {
    console.log("AdBlueMedia postback: Invalid secret key");
    return new NextResponse("0", { status: 403 });
  }

  if (!user_id || !offer_id || !payout) {
    return new NextResponse("0", { status: 400 });
  }

  const userId = user_id;
  const offerId = offer_id;
  const payoutAmount = payout;
  const txId = transaction_id || "";
  const clientIp = ip || "";

  // Check for duplicate
  const isDuplicate = await storage.checkOfferwallCompletion(userId, "adbluemedia", offerId);
  if (isDuplicate) {
    console.log("Duplicate AdBlueMedia completion:", { userId, offerId });
    return new NextResponse("1", { status: 200 });
  }

  // Verify user exists
  const user = await storage.getUser(userId);
  if (!user) {
    return new NextResponse("0", { status: 400 });
  }

  // Apply 50:50 revenue split
  const netPayout = parseFloat(payoutAmount);
  const userReward = (netPayout * 0.5).toFixed(6); // 50% to user

  // Record completion with original payout and credit user with 50%
  await storage.recordOfferwallCompletion(userId, "adbluemedia", offerId, txId, payoutAmount, clientIp);
  await storage.creditBalance(userId, userReward, "offerwall", `AdBlueMedia offer: ${offerId}`, "adbluemedia", offerId, clientIp);

  console.log("AdBlueMedia credited (50:50 split):", { userId, offerId, netPayout: payoutAmount, userReward });
  return new NextResponse("1", { status: 200 });
}
