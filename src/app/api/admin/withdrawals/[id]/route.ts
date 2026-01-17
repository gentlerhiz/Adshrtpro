import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAdmin } from "@/lib/server/auth";

// Admin: Process withdrawal
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const { status, txHash, adminNotes } = await req.json();
  
  // Accept both "completed" (frontend) and "approved"/"paid" (legacy)
  const normalizedStatus = status === "completed" ? "paid" : status;
  
  if (!["approved", "rejected", "paid"].includes(normalizedStatus)) {
    return NextResponse.json({ message: "Invalid status" }, { status: 400 });
  }

  const withdrawal = await storage.getWithdrawalRequest(id);
  if (!withdrawal) {
    return NextResponse.json({ message: "Withdrawal not found" }, { status: 404 });
  }

  if (withdrawal.status === "paid") {
    return NextResponse.json({ message: "Withdrawal already paid" }, { status: 400 });
  }

  // If rejecting, refund the balance
  if (normalizedStatus === "rejected" && withdrawal.status === "pending") {
    await storage.creditBalance(
      withdrawal.userId,
      withdrawal.amountUsd,
      "refund",
      "Withdrawal rejected - refund"
    );
  }

  await storage.updateWithdrawalRequest(id, {
    status: normalizedStatus,
    txHash,
    adminNotes,
    processedAt: new Date(),
  });

  return NextResponse.json({ message: `Withdrawal ${normalizedStatus}` });
}
