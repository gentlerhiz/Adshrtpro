import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAuth } from "@/lib/server/auth";

// Build the BitcoTasks offerwall iframe URL for the signed-in user.
// Format: https://bitcotasks.com/offerwall/{API_KEY}/{USER_ID}
// The API key is public by design here (it ships in the iframe src); the
// secret key is never returned - it is only used to verify postbacks.
export async function GET(req: Request) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const { user } = authResult;

  const setting = await storage.getOfferwallSetting("bitcotasks");
  if (!setting?.isEnabled || !setting.apiKey) {
    return NextResponse.json({ url: null });
  }

  const url = `https://bitcotasks.com/offerwall/${setting.apiKey}/${encodeURIComponent(user.id)}`;
  return NextResponse.json({ url });
}
