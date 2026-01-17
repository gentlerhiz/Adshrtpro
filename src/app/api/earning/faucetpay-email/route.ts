import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAuth } from "@/lib/server/auth";

// Update FaucetPay email
export async function PATCH(req: Request) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  const { email } = await req.json();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ message: "Valid email required" }, { status: 400 });
  }
  
  await storage.updateUserBalance(user.id, { faucetpayEmail: email });
  return NextResponse.json({ message: "FaucetPay email updated" });
}
