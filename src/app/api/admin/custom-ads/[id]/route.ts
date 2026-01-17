import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAdmin } from "@/lib/server/auth";
import { insertCustomAdSchema } from "@shared/schema";
import { z } from "zod";

// Admin: Update custom ad
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;

  try {
    const body = await req.json();
    const data = insertCustomAdSchema.partial().parse(body);
    
    const ad = await storage.updateCustomAd(id, data);
    if (!ad) {
      return NextResponse.json({ message: "Ad not found" }, { status: 404 });
    }
    return NextResponse.json(ad);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.errors[0].message }, { status: 400 });
    }
    console.error("Update custom ad error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// Admin: Delete custom ad
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const deleted = await storage.deleteCustomAd(id);
  if (!deleted) {
    return NextResponse.json({ message: "Ad not found" }, { status: 404 });
  }
  return NextResponse.json({ message: "Ad deleted" });
}
