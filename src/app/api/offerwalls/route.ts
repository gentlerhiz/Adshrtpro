import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAuth } from "@/lib/server/auth";

// Get offerwall settings (public - for display)
export async function GET(req: Request) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const settings = await storage.getAllOfferwallSettings();
  const enabled = settings.filter(s => s.isEnabled);
  return NextResponse.json(enabled.map(s => ({ network: s.network, isEnabled: s.isEnabled })));
}
