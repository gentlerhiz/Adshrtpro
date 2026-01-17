import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAuth } from "@/lib/server/auth";

// Get user balance and earning info
export async function GET(req: Request) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  let balance = await storage.getUserBalance(user.id);
  if (!balance) {
    balance = await storage.createUserBalance(user.id);
  }
  return NextResponse.json(balance);
}
