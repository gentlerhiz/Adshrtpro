import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAdmin } from "@/lib/server/auth";

// Admin: Approve/reject task submission
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const { status, adminNotes } = await req.json();
  
  if (!["approved", "rejected"].includes(status)) {
    return NextResponse.json({ message: "Invalid status" }, { status: 400 });
  }

  const submission = await storage.getTaskSubmission(id);
  if (!submission) {
    return NextResponse.json({ message: "Submission not found" }, { status: 404 });
  }

  if (submission.status !== "pending") {
    return NextResponse.json({ message: "Submission already processed" }, { status: 400 });
  }

  const task = await storage.getTask(submission.taskId);
  if (!task) {
    return NextResponse.json({ message: "Task not found" }, { status: 404 });
  }

  // For approvals, use the atomic method with task-level locking
  if (status === "approved") {
    const result = await storage.approveTaskSubmissionWithLock(
      id,
      task.id,
      submission.userId,
      { status, adminNotes, reviewedAt: new Date() },
      task.maxCompletions,
      parseFloat(task.rewardUsd),
      task.title
    );

    if (!result.success) {
      if (result.error === "Already processed") {
        return NextResponse.json({ message: "Submission was already processed" });
      }
      return NextResponse.json({ message: result.error || "Failed to process submission" }, { status: 409 });
    }

    return NextResponse.json({ message: "Submission approved" });
  }

  // For rejections, use the simpler update
  const { updated, submission: updatedSubmission } = await storage.updateTaskSubmissionIfPending(id, {
    status,
    adminNotes,
    reviewedAt: new Date(),
  });

  if (!updatedSubmission) {
    return NextResponse.json({ message: "Submission is being processed by another request" }, { status: 409 });
  }

  if (!updated) {
    return NextResponse.json({ message: "Submission was already processed" });
  }

  return NextResponse.json({ message: `Submission ${status}` });
}
