import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAdmin } from "@/lib/server/auth";

// Update announcement (admin)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const body = await req.json();
  
  const updated = await storage.updateAnnouncement(id, body);
  if (!updated) {
    return NextResponse.json({ message: "Announcement not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

// Delete announcement (admin)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const deleted = await storage.deleteAnnouncement(id);
  if (!deleted) {
    return NextResponse.json({ message: "Announcement not found" }, { status: 404 });
  }
  return NextResponse.json({ message: "Announcement deleted" });
}
