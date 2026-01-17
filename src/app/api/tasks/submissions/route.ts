import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAuth } from "@/lib/server/auth";

// Get user's task submissions
export async function GET(req: Request) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  const submissions = await storage.getTaskSubmissionsByUser(user.id);
  return NextResponse.json(submissions);
}
