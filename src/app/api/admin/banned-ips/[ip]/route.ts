import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAdmin } from "@/lib/server/auth";

// Unban IP
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ ip: string }> }
) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const { ip } = await params;
  const deleted = await storage.unbanIp(ip);
  if (!deleted) {
    return NextResponse.json({ message: "IP not found" }, { status: 404 });
  }
  return NextResponse.json({ message: "IP unbanned" });
}
