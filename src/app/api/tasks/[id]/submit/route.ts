import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAuth } from "@/lib/server/auth";

// Submit task proof
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  const { id: taskId } = await params;
  const { proofData, proofUrl, proofText, screenshotLinks } = await req.json();

  // Trim inputs and check for actual content
  const trimmedProofUrl = proofUrl?.trim() || "";
  const trimmedProofText = proofText?.trim() || "";
  const trimmedScreenshotLinks = screenshotLinks?.trim() || "";
  const trimmedProofData = proofData?.trim() || "";

  // At least one proof field must be provided with actual content
  if (!trimmedProofData && !trimmedProofUrl && !trimmedProofText && !trimmedScreenshotLinks) {
    return NextResponse.json({ message: "Proof is required. Please provide at least one of: link, text, or screenshot links." }, { status: 400 });
  }

  // Check if task exists and is active
  const task = await storage.getTask(taskId);
  if (!task || !task.isActive) {
    return NextResponse.json({ message: "Task not found" }, { status: 404 });
  }

  // Check if already submitted
  const hasSubmitted = await storage.hasUserSubmittedTask(user.id, taskId);
  if (hasSubmitted) {
    return NextResponse.json({ message: "You have already submitted this task" }, { status: 400 });
  }

  // Build combined proofData for backward compatibility
  const combinedProofData = trimmedProofData || [trimmedProofUrl, trimmedProofText, trimmedScreenshotLinks].filter(Boolean).join(" | ");
  
  const submission = await storage.createTaskSubmission(
    taskId, 
    user.id, 
    combinedProofData,
    trimmedProofUrl || null,
    trimmedProofText || null,
    trimmedScreenshotLinks || null
  );
  return NextResponse.json(submission, { status: 201 });
}
