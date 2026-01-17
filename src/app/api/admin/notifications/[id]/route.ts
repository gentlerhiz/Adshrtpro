import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAdmin } from "@/lib/server/auth";

// Admin: Delete notification
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const deleted = await storage.deleteNotification(id);
  if (!deleted) {
    return NextResponse.json({ message: "Notification not found" }, { status: 404 });
  }
  return NextResponse.json({ message: "Notification deleted" });
}
