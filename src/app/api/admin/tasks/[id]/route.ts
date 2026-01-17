import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAdmin } from "@/lib/server/auth";

// Admin: Update task
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const body = await req.json();
  
  const task = await storage.updateTask(id, body);
  if (!task) {
    return NextResponse.json({ message: "Task not found" }, { status: 404 });
  }
  return NextResponse.json(task);
}

// Admin: Delete task
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const deleted = await storage.deleteTask(id);
  if (!deleted) {
    return NextResponse.json({ message: "Task not found" }, { status: 404 });
  }
  return NextResponse.json({ message: "Task deleted" });
}
