import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAdmin } from "@/lib/server/auth";

// Update link
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const { isDisabled } = await req.json();
  
  const link = await storage.updateLink(id, { isDisabled });
  if (!link) {
    return NextResponse.json({ message: "Link not found" }, { status: 404 });
  }
  return NextResponse.json(link);
}
