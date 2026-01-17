import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAdmin } from "@/lib/server/auth";

// Admin: Get all notifications
export async function GET(req: Request) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const notifications = await storage.getAllNotifications();
  return NextResponse.json(notifications);
}

// Admin: Create notification
export async function POST(req: Request) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const notification = await storage.createNotification(body);
    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error("Create notification error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
