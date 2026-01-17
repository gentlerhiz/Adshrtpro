import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";

// Track sponsored post click (public)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await storage.incrementSponsoredPostClick(id);
  return NextResponse.json({ message: "Click tracked" });
}
