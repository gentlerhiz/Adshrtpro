import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAdmin } from "@/lib/server/auth";

// Admin: Update offerwall setting for network
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ network: string }> }
) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const { network } = await params;
  const body = await req.json();
  
  const setting = await storage.setOfferwallSetting(network, body);
  return NextResponse.json(setting);
}
