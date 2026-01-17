import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAdmin } from "@/lib/server/auth";

// Get all links
export async function GET(req: Request) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const links = await storage.getAllLinks();
  return NextResponse.json(links);
}
