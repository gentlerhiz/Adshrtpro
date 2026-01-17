import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAdmin } from "@/lib/server/auth";

// Admin: Review social verification
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
  
  const verifications = await storage.getAllSocialVerifications();
  const verification = verifications.find(v => v.id === id);
  
  if (!verification) {
    return NextResponse.json({ message: "Verification not found" }, { status: 404 });
  }
  
  if (verification.status !== "pending") {
    return NextResponse.json({ message: "Verification already processed" }, { status: 400 });
  }
  
  // Update verification status
  await storage.updateSocialVerification(id, {
    status,
    adminNotes: adminNotes || null,
    reviewedAt: new Date(),
  });
  
  // If approved, update user's socialVerified status
  if (status === "approved") {
    await storage.updateUser(verification.userId, {
      socialVerified: true,
      socialVerifiedAt: new Date(),
    });
  }
  
  return NextResponse.json({ message: `Social verification ${status}` });
}
