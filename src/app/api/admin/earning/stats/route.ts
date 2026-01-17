import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAdmin } from "@/lib/server/auth";

// Get all earning stats
export async function GET(req: Request) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const transactions = await storage.getAllTransactions();
  const withdrawals = await storage.getAllWithdrawalRequests();
  const taskSubmissions = await storage.getAllTaskSubmissions();
  const referrals = await storage.getAllReferrals();

  const totalEarnings = transactions
    .filter(t => parseFloat(t.amount) > 0)
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const totalWithdrawn = withdrawals
    .filter(w => w.status === "paid")
    .reduce((sum, w) => sum + parseFloat(w.amountUsd), 0);

  return NextResponse.json({
    totalEarnings: totalEarnings.toFixed(2),
    totalWithdrawn: totalWithdrawn.toFixed(2),
    pendingWithdrawals: withdrawals.filter(w => w.status === "pending").length,
    pendingTasks: taskSubmissions.filter(t => t.status === "pending").length,
    totalReferrals: referrals.length,
    validReferrals: referrals.filter(r => r.status === "credited").length,
  });
}
