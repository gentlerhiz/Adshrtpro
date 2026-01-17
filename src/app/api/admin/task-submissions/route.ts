import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAdmin } from "@/lib/server/auth";

// Admin: Get all task submissions
export async function GET(req: Request) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const submissions = await storage.getAllTaskSubmissions();
  // Enrich with task and user info
  const enriched = await Promise.all(submissions.map(async (s) => {
    const task = await storage.getTask(s.taskId);
    const user = await storage.getUser(s.userId);
    return {
      ...s,
      taskTitle: task?.title,
      taskReward: task?.rewardUsd,
      userEmail: user?.email,
    };
  }));
  return NextResponse.json(enriched);
}
