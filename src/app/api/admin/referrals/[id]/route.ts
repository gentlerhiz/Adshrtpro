import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";
import { requireAdmin } from "@/lib/server/auth";

// Admin: Validate referral
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const { isValid } = await req.json();
  
  const referral = await storage.getReferral(id);
  if (!referral) {
    return NextResponse.json({ message: "Referral not found" }, { status: 404 });
  }

  if (referral.status === "rewarded") {
    return NextResponse.json({ message: "Referral already rewarded" }, { status: 400 });
  }

  if (isValid) {
    // Get both users
    const referrer = await storage.getUser(referral.referrerId);
    const referred = await storage.getUser(referral.referredId);
    
    if (!referrer || !referred) {
      return NextResponse.json({ message: "User not found" }, { status: 400 });
    }
    
    // Check if BOTH users have completed social verification
    if (!referrer.socialVerified) {
      return NextResponse.json({ 
        message: "Referrer has not completed Social Verification" 
      }, { status: 400 });
    }
    
    if (!referred.socialVerified) {
      return NextResponse.json({ 
        message: "Referred user has not completed Social Verification" 
      }, { status: 400 });
    }
    
    // Check if referred user has created enough links
    const linksRequired = parseInt(await storage.getEarningSetting("referralLinksRequired") || "3");
    const referredUserLinks = await storage.getLinksByUserId(referral.referredId);
    const actualLinkCount = referredUserLinks.length;
    
    if (actualLinkCount < linksRequired) {
      return NextResponse.json({ 
        message: `Referred user has only created ${actualLinkCount} of ${linksRequired} required links` 
      }, { status: 400 });
    }
    
    // Update the linksCreated field with actual count and mark as validated
    await storage.updateReferral(id, { 
      status: "validated",
      linksCreated: actualLinkCount 
    });
    
    // Credit BOTH users with the referral reward
    const rewardAmount = await storage.getEarningSetting("referralReward") || "0.10";
    
    // Credit referrer
    await storage.creditBalance(
      referral.referrerId,
      rewardAmount,
      "referral",
      `Referral reward for inviting user ${referred.email.split("@")[0]}***`
    );
    
    // Credit referred user
    await storage.creditBalance(
      referral.referredId,
      rewardAmount,
      "referral",
      `Referral bonus for joining via ${referrer.email.split("@")[0]}***`
    );
    
    await storage.updateReferral(id, { status: "rewarded" });
  } else {
    await storage.updateReferral(id, { status: "invalid" });
  }

  return NextResponse.json({ message: isValid ? "Referral validated - both users rewarded" : "Referral marked as invalid" });
}
