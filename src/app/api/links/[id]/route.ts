import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAuth } from "@/lib/server/auth";

// Delete link
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  const { id } = await params;

  const link = await storage.getLink(id);
  if (!link) {
    return NextResponse.json({ message: "Link not found" }, { status: 404 });
  }

  if (link.userId !== user.id) {
    return NextResponse.json({ message: "Not authorized" }, { status: 403 });
  }

  await storage.deleteLink(id);
  return NextResponse.json({ message: "Link deleted" });
}
