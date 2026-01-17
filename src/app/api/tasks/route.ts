import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAuth } from "@/lib/server/auth";

// Get active tasks for users
export async function GET(req: Request) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  const tasks = await storage.getActiveTasks();
  
  // Get user's submissions to check if they've already submitted
  const submissions = await storage.getTaskSubmissionsByUser(user.id);
  const submittedTaskIds = new Set(submissions.map(s => s.taskId));
  
  const tasksWithStatus = tasks.map(task => ({
    ...task,
    hasSubmitted: submittedTaskIds.has(task.id),
    submission: submissions.find(s => s.taskId === task.id),
  }));
  
  return NextResponse.json(tasksWithStatus);
}
