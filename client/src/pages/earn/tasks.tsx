import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ClipboardList, CheckCircle, Clock, XCircle, Upload, Link as LinkIcon, User, ExternalLink, FileText, Image, Users, Shield, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

function makeLinksClickable(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline inline-flex items-center gap-1"
        >
          {part}
          <ExternalLink className="w-3 h-3" />
        </a>
      );
    }
    return part;
  });
}

interface Task {
  id: string;
  title: string;
  description: string;
  instructions: string | null;
  rewardUsd: string;
  proofType: string;
  isActive: boolean;
  hasSubmitted: boolean;
  submission?: {
    id: string;
    status: string;
    proofData: string;
    adminNotes: string | null;
    submittedAt: string;
  };
}

interface SocialVerificationData {
  isVerified: boolean;
  verifiedAt: string | null;
  submission: {
    id: string;
    status: string;
    screenshotLinks: string;
    adminNotes: string | null;
    submittedAt: string;
  } | null;
}

export default function TasksPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [proofUrl, setProofUrl] = useState("");
  const [proofText, setProofText] = useState("");
  const [screenshotLinks, setScreenshotLinks] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [socialProofLinks, setSocialProofLinks] = useState("");
  const [socialDialogOpen, setSocialDialogOpen] = useState(false);

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    enabled: !!user,
  });

  const { data: socialVerification } = useQuery<SocialVerificationData>({
    queryKey: ["/api/social-verification"],
    enabled: !!user,
  });

  const socialSubmitMutation = useMutation({
    mutationFn: async (screenshotLinks: string) => {
      await apiRequest("POST", "/api/social-verification/submit", { screenshotLinks });
    },
    onSuccess: () => {
      toast({ title: "Submitted!", description: "Your social verification is pending review." });
      queryClient.invalidateQueries({ queryKey: ["/api/social-verification"] });
      setSocialDialogOpen(false);
      setSocialProofLinks("");
    },
    onError: (error: Error) => {
      toast({ title: "Submission failed", description: error.message, variant: "destructive" });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async ({ taskId, proofUrl, proofText, screenshotLinks }: { taskId: string; proofUrl: string; proofText: string; screenshotLinks: string }) => {
      await apiRequest("POST", `/api/tasks/${taskId}/submit`, { proofUrl, proofText, screenshotLinks });
    },
    onSuccess: () => {
      toast({ title: "Task submitted!", description: "Your submission is pending review." });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setDialogOpen(false);
      setProofUrl("");
      setProofText("");
      setScreenshotLinks("");
      setSelectedTask(null);
    },
    onError: (error: Error) => {
      toast({ title: "Submission failed", description: error.message, variant: "destructive" });
    },
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Tasks</h1>
        <p className="text-muted-foreground mb-6">Please log in to access tasks.</p>
        <Link href="/login">
          <Button data-testid="button-login">Log In</Button>
        </Link>
      </div>
    );
  }

  const getStatusBadge = (submission: Task["submission"]) => {
    if (!submission) return null;
    switch (submission.status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return null;
    }
  };

  const getProofIcon = (type: string) => {
    switch (type) {
      case "screenshot":
        return <Upload className="h-4 w-4" />;
      case "link":
        return <LinkIcon className="h-4 w-4" />;
      case "username":
        return <User className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getProofLabel = (type: string) => {
    switch (type) {
      case "screenshot":
        return "Screenshot URL (upload to Imgur or similar)";
      case "link":
        return "Profile/Post Link";
      case "username":
        return "Username";
      default:
        return "Proof";
    }
  };

  const getSocialStatusBadge = () => {
    if (socialVerification?.isVerified) {
      return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
    }
    if (socialVerification?.submission) {
      switch (socialVerification.submission.status) {
        case "pending":
          return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending Review</Badge>;
        case "rejected":
          return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
        default:
          return null;
      }
    }
    return <Badge variant="outline"><AlertTriangle className="w-3 h-3 mr-1" />Not Verified</Badge>;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/earn" className="text-primary hover:underline text-sm mb-2 inline-block">
          ← Back to Earn
        </Link>
        <h1 className="text-3xl font-bold mb-2">Tasks</h1>
        <p className="text-muted-foreground">Complete tasks and submit proof to earn rewards.</p>
      </div>

      {/* Social Verification Task */}
      <Card className="mb-6 border-primary/30 bg-primary/5">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Social Verification
                  <Badge variant="outline" className="text-xs">Required for Referral Rewards</Badge>
                </CardTitle>
                <CardDescription>Follow our official social media pages to unlock referral rewards</CardDescription>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {getSocialStatusBadge()}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription>
                <strong>How it works:</strong> Both you and your referral must complete Social Verification to earn referral rewards ($0.10 each). 
                Your referral must also create at least 3 shortened links.
              </AlertDescription>
            </Alert>

            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Instructions:</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Follow our official social media pages (Telegram, Facebook, Twitter/X, Instagram, etc.)</li>
                <li>Visit our <Link href="/socials" className="text-primary hover:underline">Socials page</Link> to find all official accounts</li>
                <li>Take screenshots showing you follow each account</li>
                <li>Upload screenshots to <a href="https://imgbb.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">imgbb.com</a> or <a href="https://postimages.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">postimages.org</a></li>
                <li>Submit all screenshot links below (separate multiple links with commas)</li>
              </ol>
            </div>

            {socialVerification?.isVerified ? (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">You are verified!</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  You can now earn referral rewards when you invite friends.
                </p>
              </div>
            ) : socialVerification?.submission?.status === "pending" ? (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">Pending Review</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Your submission is being reviewed by our team.
                </p>
              </div>
            ) : socialVerification?.submission?.status === "rejected" ? (
              <div className="space-y-3">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <XCircle className="w-5 h-5" />
                    <span className="font-medium">Rejected</span>
                  </div>
                  {socialVerification.submission.adminNotes && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Reason: {socialVerification.submission.adminNotes}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <Dialog open={socialDialogOpen} onOpenChange={setSocialDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-social-verify">
                    <Upload className="w-4 h-4 mr-2" />
                    Submit Verification
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Social Verification</DialogTitle>
                    <DialogDescription>
                      Submit screenshot proof that you follow our official social media pages.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="social-proof">Screenshot Links</Label>
                      <Textarea
                        id="social-proof"
                        placeholder="Paste your screenshot links here, separated by commas"
                        value={socialProofLinks}
                        onChange={(e) => setSocialProofLinks(e.target.value)}
                        className="mt-2"
                        rows={4}
                        data-testid="input-social-proof"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Upload to imgbb.com or postimages.org, then paste links here
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => socialSubmitMutation.mutate(socialProofLinks)}
                      disabled={!socialProofLinks.trim() || socialSubmitMutation.isPending}
                      data-testid="button-submit-social"
                    >
                      {socialSubmitMutation.isPending ? "Submitting..." : "Submit"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardContent>
      </Card>

      <h2 className="text-xl font-semibold mb-4">Available Tasks</h2>

      {isLoading ? (
        <div className="text-center py-8">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Tasks Available</h3>
            <p className="text-muted-foreground">
              Check back later for new tasks.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <Card key={task.id} className="hover-elevate">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                    <CardDescription>{task.description}</CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      ${parseFloat(task.rewardUsd).toFixed(2)}
                    </Badge>
                    {task.hasSubmitted && getStatusBadge(task.submission)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {task.instructions && (
                  <div className="mb-4 p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <p className="text-sm font-medium">Instructions:</p>
                    </div>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {makeLinksClickable(task.instructions)}
                    </div>
                  </div>
                )}
                
                <div className="mb-4 p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Image className="w-4 h-4 text-primary" />
                    <p className="text-sm font-medium">Proof Requirements:</p>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Profile/Post Link: Submit the link to your completed action</li>
                    <li>Additional Text: Your username or any notes</li>
                    <li>Screenshots: Upload to <a href="https://imgbb.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">imgbb.com</a> or <a href="https://postimages.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">postimages.org</a> and paste the links</li>
                  </ul>
                </div>
                
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {getProofIcon(task.proofType)}
                    <span>Primary proof type: {task.proofType}</span>
                  </div>
                  
                  {task.hasSubmitted ? (
                    <div className="text-sm">
                      {task.submission?.status === "rejected" && task.submission.adminNotes && (
                        <p className="text-red-500">Note: {task.submission.adminNotes}</p>
                      )}
                    </div>
                  ) : (
                    <Dialog open={dialogOpen && selectedTask?.id === task.id} onOpenChange={(open) => {
                      setDialogOpen(open);
                      if (!open) {
                        setSelectedTask(null);
                        setProofUrl("");
                        setProofText("");
                        setScreenshotLinks("");
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button 
                          onClick={() => setSelectedTask(task)}
                          data-testid={`button-submit-task-${task.id}`}
                        >
                          Submit Proof
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Submit Task Proof</DialogTitle>
                          <DialogDescription>
                            Submit proof for: {task.title}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label htmlFor="proofUrl">Profile/Post Link</Label>
                            <Input
                              id="proofUrl"
                              placeholder="https://example.com/your-profile"
                              value={proofUrl}
                              onChange={(e) => setProofUrl(e.target.value)}
                              data-testid="input-proof-url"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Paste the link to your profile or post here.
                            </p>
                          </div>
                          
                          <div>
                            <Label htmlFor="proofText">Additional Information</Label>
                            <Textarea
                              id="proofText"
                              placeholder="Your username, additional notes, or any other proof text..."
                              value={proofText}
                              onChange={(e) => setProofText(e.target.value)}
                              data-testid="input-proof-text"
                              className="min-h-[80px]"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="screenshotLinks">Screenshot Proof Links</Label>
                            <Textarea
                              id="screenshotLinks"
                              placeholder="https://i.ibb.co/xxx, https://postimg.cc/xxx"
                              value={screenshotLinks}
                              onChange={(e) => setScreenshotLinks(e.target.value)}
                              data-testid="input-screenshot-links"
                              className="min-h-[60px]"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Please submit your proof screenshots using imgbb.com or postimages.org.
                              If you have more than one proof, put a comma between the links.
                            </p>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={() => task && submitMutation.mutate({ 
                              taskId: task.id, 
                              proofUrl, 
                              proofText,
                              screenshotLinks 
                            })}
                            disabled={(!proofUrl && !proofText && !screenshotLinks) || submitMutation.isPending}
                            data-testid="button-confirm-submit"
                          >
                            {submitMutation.isPending ? "Submitting..." : "Submit"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
