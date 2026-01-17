import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAdmin } from "@/lib/server/auth";

// Admin: Get all withdrawals
export async function GET(req: Request) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const withdrawals = await storage.getAllWithdrawalRequests();
  // Enrich with user info including username and FaucetPay email
  const enriched = await Promise.all(withdrawals.map(async (w) => {
    const user = await storage.getUser(w.userId);
    return {
      ...w,
      userName: user?.email?.split("@")[0] || "Unknown",
      userEmail: user?.email || "No email",
      userFaucetPayEmail: w.faucetpayEmail || "Not set",
    };
  }));
  return NextResponse.json(enriched);
}
