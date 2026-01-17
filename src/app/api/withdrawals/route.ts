import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAuth } from "@/lib/server/auth";

// Get user's withdrawal requests
export async function GET(req: Request) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  const requests = await storage.getWithdrawalRequestsByUser(user.id);
  return NextResponse.json(requests);
}

// Create withdrawal request
export async function POST(req: Request) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  const { amountUsd, coinType } = await req.json();

  if (!amountUsd || !coinType) {
    return NextResponse.json({ message: "Amount and coin type required" }, { status: 400 });
  }

  // Get user balance
  const balance = await storage.getUserBalance(user.id);
  if (!balance) {
    return NextResponse.json({ message: "No balance found" }, { status: 400 });
  }

  // Check FaucetPay email
  if (!balance.faucetpayEmail) {
    return NextResponse.json({ message: "Please set your FaucetPay email first" }, { status: 400 });
  }

  // Check minimum withdrawal
  const settings = await storage.getAllEarningSettings();
  const minWithdrawal = parseFloat(settings.minWithdrawal || "1.00");
  const amount = parseFloat(amountUsd);

  if (amount < minWithdrawal) {
    return NextResponse.json({ message: `Minimum withdrawal is $${minWithdrawal}` }, { status: 400 });
  }

  // Check balance
  const currentBalance = parseFloat(balance.balanceUsd || "0");
  if (currentBalance < amount) {
    return NextResponse.json({ message: "Insufficient balance" }, { status: 400 });
  }

  // Check supported coins
  const supportedCoins = (settings.supportedCoins || "BTC,ETH,DOGE,LTC,USDT,TRX").split(",");
  if (!supportedCoins.includes(coinType)) {
    return NextResponse.json({ message: "Unsupported coin type" }, { status: 400 });
  }

  // Check for pending withdrawal
  const pending = await storage.getPendingWithdrawalRequests();
  const hasPending = pending.some(w => w.userId === user.id);
  if (hasPending) {
    return NextResponse.json({ message: "You already have a pending withdrawal" }, { status: 400 });
  }

  // Debit balance
  const debitResult = await storage.debitBalance(user.id, amountUsd, "withdrawal", `Withdrawal request: ${coinType}`);
  if (!debitResult) {
    return NextResponse.json({ message: "Failed to process withdrawal" }, { status: 400 });
  }

  // Create withdrawal request
  const request = await storage.createWithdrawalRequest(user.id, amountUsd, coinType, balance.faucetpayEmail);
  return NextResponse.json(request, { status: 201 });
}
