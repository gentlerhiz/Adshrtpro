import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAdmin } from "@/lib/server/auth";

// Get all users
export async function GET(req: Request) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const users = await storage.getAllUsers();
  return NextResponse.json(users.map((u) => ({ ...u, password: undefined })));
}
