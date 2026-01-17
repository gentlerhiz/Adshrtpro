import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAdmin } from "@/lib/server/auth";

// Get banned IPs
export async function GET(req: Request) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const bannedIps = await storage.getAllBannedIps();
  return NextResponse.json(bannedIps);
}

// Ban IP
export async function POST(req: Request) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const { ip, reason } = await req.json();
  if (!ip) {
    return NextResponse.json({ message: "IP required" }, { status: 400 });
  }
  const bannedIp = await storage.banIp(ip, reason);
  return NextResponse.json(bannedIp, { status: 201 });
}
