import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";

export async function GET() {
  try {
    const transactions = await storage.getAllTransactions();
    const paymentProofs = transactions
      .filter((t) => t.type === "withdrawal" && t.status === "completed")
      .slice(0, 50)
      .map((t) => ({ id: t.id, amount: t.amount, createdAt: t.createdAt }));

    return NextResponse.json(paymentProofs);
  } catch (error) {
    console.error("/api/public/payment-proofs error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
