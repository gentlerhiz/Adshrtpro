"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Check,
  X,
  ClipboardList,
  Wallet,
  Users,
  Settings,
  Plus,
  Eye,
  Trash2,
  DollarSign,
} from "lucide-react";
import { format } from "date-fns";
import type { Task, TaskSubmission, WithdrawalRequest, Referral, SocialVerification } from "@shared/schema";
import { Shield } from "lucide-react";

interface EnrichedSocialVerification extends SocialVerification {
  userEmail?: string;
}

export default function AdminEarningPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    rewardUsd: "",
    requirements: "",
    proofInstructions: "",
    maxCompletions: "",
    isActive: true,
  });
  const [submissionViewOpen, setSubmissionViewOpen] = useState<TaskSubmission | null>(null);

  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/admin/tasks"],
    enabled: !!user?.isAdmin,
  });

  const { data: submissions, isLoading: submissionsLoading } = useQuery<TaskSubmission[]>({
    queryKey: ["/api/admin/task-submissions"],
    enabled: !!user?.isAdmin,
  });

  const { data: withdrawals, isLoading: withdrawalsLoading } = useQuery<WithdrawalRequest[]>({
    queryKey: ["/api/admin/withdrawals"],
    enabled: !!user?.isAdmin,
  });

  const { data: referrals, isLoading: referralsLoading } = useQuery<Referral[]>({
    queryKey: ["/api/admin/referrals"],
    enabled: !!user?.isAdmin,
  });

  const { data: socialVerifications, isLoading: socialVerificationsLoading } = useQuery<EnrichedSocialVerification[]>({
    queryKey: ["/api/admin/social-verifications"],
    enabled: !!user?.isAdmin,
  });

  const { data: earningSettings } = useQuery<Record<string, string>>({
    queryKey: ["/api/admin/earning-settings"],
    enabled: !!user?.isAdmin,
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: typeof taskForm) => {
      await apiRequest("POST", "/api/admin/tasks", {
        ...data,
        rewardUsd: data.rewardUsd,
        maxCompletions: data.maxCompletions ? parseInt(data.maxCompletions) : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tasks"] });
      toast({ title: "Task created successfully" });
      setTaskDialogOpen(false);
      resetTaskForm();
    },
    onError: () => {
      toast({ title: "Failed to create task", variant: "destructive" });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof taskForm> }) => {
      await apiRequest("PATCH", `/api/admin/tasks/${id}`, {
        ...data,
        rewardUsd: data.rewardUsd,
        maxCompletions: data.maxCompletions ? parseInt(data.maxCompletions) : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tasks"] });
      toast({ title: "Task updated" });
      setTaskDialogOpen(false);
      setEditingTask(null);
      resetTaskForm();
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/tasks/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tasks"] });
      toast({ title: "Task deleted" });
    },
  });

  const reviewSubmissionMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: string; status: string; adminNotes?: string }) => {
      await apiRequest("PATCH", `/api/admin/task-submissions/${id}`, { status, adminNotes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/task-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tasks"] });
      toast({ title: "Submission reviewed" });
      setSubmissionViewOpen(null);
    },
  });

  const processWithdrawalMutation = useMutation({
    mutationFn: async ({ id, status, txHash, adminNotes }: { id: string; status: string; txHash?: string; adminNotes?: string }) => {
      await apiRequest("PATCH", `/api/admin/withdrawals/${id}`, { status, txHash, adminNotes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
      toast({ title: "Withdrawal processed" });
    },
  });

  const validateReferralMutation = useMutation({
    mutationFn: async ({ id, isValid }: { id: string; isValid: boolean }) => {
      await apiRequest("PATCH", `/api/admin/referrals/${id}`, { isValid });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/referrals"] });
      toast({ title: "Referral validated" });
    },
  });

  const reviewSocialVerificationMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: string; status: string; adminNotes?: string }) => {
      await apiRequest("PATCH", `/api/admin/social-verifications/${id}`, { status, adminNotes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/social-verifications"] });
      toast({ title: "Social verification reviewed" });
    },
    onError: (error: Error) => {
      toast({ title: "Review failed", description: error.message, variant: "destructive" });
    },
  });

  const updateEarningSettingsMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      await apiRequest("PATCH", "/api/admin/earning-settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/earning-settings"] });
      toast({ title: "Settings saved" });
    },
  });

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              You don't have permission to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const resetTaskForm = () => {
    setTaskForm({
      title: "",
      description: "",
      rewardUsd: "",
      requirements: "",
      proofInstructions: "",
      maxCompletions: "",
      isActive: true,
    });
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description,
      rewardUsd: task.rewardUsd,
      requirements: task.requirements || "",
      proofInstructions: task.proofInstructions || "",
      maxCompletions: task.maxCompletions?.toString() || "",
      isActive: task.isActive ?? true,
    });
    setTaskDialogOpen(true);
  };

  const pendingSubmissions = submissions?.filter(s => s.status === "pending") || [];
  const pendingWithdrawals = withdrawals?.filter(w => w.status === "pending") || [];
  const pendingReferrals = referrals?.filter(r => r.status === "pending") || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-heading font-bold">Earning Management</h1>
            <p className="text-muted-foreground">Manage tasks, withdrawals, referrals, and settings</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <ClipboardList className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Submissions</p>
                  <p className="text-2xl font-bold">{pendingSubmissions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-500/10 rounded-lg">
                  <Wallet className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Withdrawals</p>
                  <p className="text-2xl font-bold">{pendingWithdrawals.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <Users className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Referrals</p>
                  <p className="text-2xl font-bold">{pendingReferrals.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <DollarSign className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Tasks</p>
                  <p className="text-2xl font-bold">{tasks?.filter(t => t.isActive).length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tasks">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-6">
            <TabsTrigger value="tasks" data-testid="tab-admin-tasks">Tasks</TabsTrigger>
            <TabsTrigger value="submissions" data-testid="tab-admin-submissions">
              Submissions {pendingSubmissions.length > 0 && <Badge variant="destructive" className="ml-2">{pendingSubmissions.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="social" data-testid="tab-admin-social">
              <Shield className="w-3 h-3 mr-1" />
              Social {socialVerifications?.filter(s => s.status === "pending").length ? <Badge variant="destructive" className="ml-2">{socialVerifications.filter(s => s.status === "pending").length}</Badge> : null}
            </TabsTrigger>
            <TabsTrigger value="withdrawals" data-testid="tab-admin-withdrawals">
              Withdrawals {pendingWithdrawals.length > 0 && <Badge variant="destructive" className="ml-2">{pendingWithdrawals.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="referrals" data-testid="tab-admin-referrals">
              Referrals {pendingReferrals.length > 0 && <Badge variant="destructive" className="ml-2">{pendingReferrals.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-admin-earning-settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle>Manual Tasks</CardTitle>
                <Button onClick={() => setTaskDialogOpen(true)} data-testid="button-create-task">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Task
                </Button>
              </CardHeader>
              <CardContent>
                {tasksLoading ? (
                  <Skeleton className="h-64" />
                ) : tasks && tasks.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Reward</TableHead>
                        <TableHead>Completions</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell className="font-medium">{task.title}</TableCell>
                          <TableCell>${task.rewardUsd}</TableCell>
                          <TableCell>
                            {task.completedCount || 0}
                            {task.maxCompletions && ` / ${task.maxCompletions}`}
                          </TableCell>
                          <TableCell>
                            <Badge variant={task.isActive ? "default" : "secondary"}>
                              {task.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditTask(task)}
                                data-testid={`button-edit-task-${task.id}`}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteTaskMutation.mutate(task.id)}
                                data-testid={`button-delete-task-${task.id}`}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No tasks created yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Create your first manual task to start earning opportunities.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="submissions">
            <Card>
              <CardHeader>
                <CardTitle>Task Submissions</CardTitle>
                <CardDescription>Review and approve user task submissions</CardDescription>
              </CardHeader>
              <CardContent>
                {submissionsLoading ? (
                  <Skeleton className="h-64" />
                ) : submissions && submissions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions.map((submission) => (
                        <TableRow key={submission.id}>
                          <TableCell className="font-medium">{submission.taskId}</TableCell>
                          <TableCell>{submission.userId}</TableCell>
                          <TableCell>
                            {submission.submittedAt
                              ? format(new Date(submission.submittedAt), "MMM d, yyyy HH:mm")
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                submission.status === "approved"
                                  ? "default"
                                  : submission.status === "rejected"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {submission.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSubmissionViewOpen(submission)}
                                data-testid={`button-view-submission-${submission.id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {submission.status === "pending" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      reviewSubmissionMutation.mutate({
                                        id: submission.id,
                                        status: "approved",
                                      })
                                    }
                                    data-testid={`button-approve-submission-${submission.id}`}
                                  >
                                    <Check className="w-4 h-4 text-green-500" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      reviewSubmissionMutation.mutate({
                                        id: submission.id,
                                        status: "rejected",
                                      })
                                    }
                                    data-testid={`button-reject-submission-${submission.id}`}
                                  >
                                    <X className="w-4 h-4 text-destructive" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No submissions yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="social">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Social Verification Submissions
                </CardTitle>
                <CardDescription>
                  Review screenshot proofs of users following your social media pages
                </CardDescription>
              </CardHeader>
              <CardContent>
                {socialVerificationsLoading ? (
                  <Skeleton className="h-64" />
                ) : socialVerifications && socialVerifications.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Screenshot Links</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {socialVerifications.map((sv) => (
                        <TableRow key={sv.id}>
                          <TableCell className="font-medium">{sv.userEmail}</TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              {sv.screenshotLinks.split(",").map((link, idx) => (
                                <a
                                  key={idx}
                                  href={link.trim()}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline text-sm block truncate"
                                >
                                  {link.trim()}
                                </a>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {sv.submittedAt && format(new Date(sv.submittedAt), "MMM d, yyyy HH:mm")}
                          </TableCell>
                          <TableCell>
                            {sv.status === "pending" && (
                              <Badge variant="secondary">Pending</Badge>
                            )}
                            {sv.status === "approved" && (
                              <Badge variant="default" className="bg-green-600">Approved</Badge>
                            )}
                            {sv.status === "rejected" && (
                              <Badge variant="destructive">Rejected</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {sv.status === "pending" && (
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() =>
                                    reviewSocialVerificationMutation.mutate({
                                      id: sv.id,
                                      status: "approved",
                                    })
                                  }
                                  disabled={reviewSocialVerificationMutation.isPending}
                                  data-testid={`button-approve-social-${sv.id}`}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    reviewSocialVerificationMutation.mutate({
                                      id: sv.id,
                                      status: "rejected",
                                      adminNotes: "Insufficient proof provided",
                                    })
                                  }
                                  disabled={reviewSocialVerificationMutation.isPending}
                                  data-testid={`button-reject-social-${sv.id}`}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No social verification submissions yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdrawals">
            <Card>
              <CardHeader>
                <CardTitle>Withdrawal Requests</CardTitle>
                <CardDescription>Process user withdrawal requests via FaucetPay</CardDescription>
              </CardHeader>
              <CardContent>
                {withdrawalsLoading ? (
                  <Skeleton className="h-64" />
                ) : withdrawals && withdrawals.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Coin</TableHead>
                        <TableHead>FaucetPay Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {withdrawals.map((withdrawal: any) => (
                        <TableRow key={withdrawal.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{withdrawal.userName || "Unknown"}</p>
                              <p className="text-xs text-muted-foreground">{withdrawal.userEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">${withdrawal.amountUsd}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{withdrawal.coinType}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm">
                            {withdrawal.userFaucetPayEmail || withdrawal.faucetpayEmail || "Not set"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                withdrawal.status === "paid" || withdrawal.status === "completed"
                                  ? "default"
                                  : withdrawal.status === "rejected"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {withdrawal.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {withdrawal.status === "pending" && (
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    processWithdrawalMutation.mutate({
                                      id: withdrawal.id,
                                      status: "completed",
                                    })
                                  }
                                  disabled={processWithdrawalMutation.isPending}
                                  data-testid={`button-approve-withdrawal-${withdrawal.id}`}
                                >
                                  <Check className="w-4 h-4 text-green-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    processWithdrawalMutation.mutate({
                                      id: withdrawal.id,
                                      status: "rejected",
                                    })
                                  }
                                  disabled={processWithdrawalMutation.isPending}
                                  data-testid={`button-reject-withdrawal-${withdrawal.id}`}
                                >
                                  <X className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No withdrawal requests</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="referrals">
            <Card>
              <CardHeader>
                <CardTitle>Referral Validations</CardTitle>
                <CardDescription>Validate referrals that meet the link creation requirements</CardDescription>
              </CardHeader>
              <CardContent>
                {referralsLoading ? (
                  <Skeleton className="h-64" />
                ) : referrals && referrals.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Referrer</TableHead>
                        <TableHead>Referred User</TableHead>
                        <TableHead>Links Created</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {referrals.map((referral) => (
                        <TableRow key={referral.id}>
                          <TableCell>{referral.referrerId}</TableCell>
                          <TableCell>{referral.referredId}</TableCell>
                          <TableCell>
                            {referral.linksCreated || 0} / {earningSettings?.referralLinksRequired || 3}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                referral.status === "validated"
                                  ? "default"
                                  : referral.status === "rewarded"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {referral.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {referral.status === "pending" && (referral.linksCreated || 0) >= parseInt(earningSettings?.referralLinksRequired || "3") && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  validateReferralMutation.mutate({
                                    id: referral.id,
                                    isValid: true,
                                  })
                                }
                                data-testid={`button-validate-referral-${referral.id}`}
                              >
                                Validate & Reward
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No referrals yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Withdrawal Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Minimum Withdrawal (USD)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      defaultValue={earningSettings?.minWithdrawal || "1.00"}
                      onBlur={(e) =>
                        updateEarningSettingsMutation.mutate({
                          minWithdrawal: e.target.value,
                        })
                      }
                      data-testid="input-min-withdrawal"
                    />
                  </div>
                  <div>
                    <Label>Supported Coins (comma-separated)</Label>
                    <Input
                      defaultValue={earningSettings?.supportedCoins || "BTC,ETH,DOGE,LTC,USDT,TRX"}
                      onBlur={(e) =>
                        updateEarningSettingsMutation.mutate({
                          supportedCoins: e.target.value,
                        })
                      }
                      data-testid="input-supported-coins"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={earningSettings?.faucetpayEnabled === "true"}
                      onCheckedChange={(checked) =>
                        updateEarningSettingsMutation.mutate({
                          faucetpayEnabled: checked.toString(),
                        })
                      }
                      data-testid="switch-faucetpay"
                    />
                    <Label>Enable FaucetPay Withdrawals</Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Referral Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Referral Reward (USD)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      defaultValue={earningSettings?.referralReward || "0.10"}
                      onBlur={(e) =>
                        updateEarningSettingsMutation.mutate({
                          referralReward: e.target.value,
                        })
                      }
                      data-testid="input-referral-reward"
                    />
                  </div>
                  <div>
                    <Label>Links Required for Valid Referral</Label>
                    <Input
                      type="number"
                      defaultValue={earningSettings?.referralLinksRequired || "3"}
                      onBlur={(e) =>
                        updateEarningSettingsMutation.mutate({
                          referralLinksRequired: e.target.value,
                        })
                      }
                      data-testid="input-referral-links"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTask ? "Edit Task" : "Create Task"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={taskForm.title}
                  onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Subscribe to YouTube Channel"
                  data-testid="input-task-title"
                />
              </div>
              <div>
                <Label>Description *</Label>
                <Textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Subscribe to our YouTube channel and earn rewards."
                  data-testid="textarea-task-description"
                />
              </div>
              <div>
                <Label>Reward (USD) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={taskForm.rewardUsd}
                  onChange={(e) => setTaskForm((prev) => ({ ...prev, rewardUsd: e.target.value }))}
                  placeholder="0.05"
                  data-testid="input-task-reward"
                />
              </div>
              <div>
                <Label>Requirements</Label>
                <Textarea
                  value={taskForm.requirements}
                  onChange={(e) => setTaskForm((prev) => ({ ...prev, requirements: e.target.value }))}
                  placeholder="Must subscribe and stay subscribed for 30 days."
                  data-testid="textarea-task-requirements"
                />
              </div>
              <div>
                <Label>Proof Instructions</Label>
                <Textarea
                  value={taskForm.proofInstructions}
                  onChange={(e) => setTaskForm((prev) => ({ ...prev, proofInstructions: e.target.value }))}
                  placeholder="Provide a screenshot of your subscription."
                  data-testid="textarea-task-proof"
                />
              </div>
              <div>
                <Label>Max Completions (leave empty for unlimited)</Label>
                <Input
                  type="number"
                  value={taskForm.maxCompletions}
                  onChange={(e) => setTaskForm((prev) => ({ ...prev, maxCompletions: e.target.value }))}
                  placeholder="100"
                  data-testid="input-task-max"
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={taskForm.isActive}
                  onCheckedChange={(checked) => setTaskForm((prev) => ({ ...prev, isActive: checked }))}
                  data-testid="switch-task-active"
                />
                <Label>Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setTaskDialogOpen(false);
                  setEditingTask(null);
                  resetTaskForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (editingTask) {
                    updateTaskMutation.mutate({ id: editingTask.id, data: taskForm });
                  } else {
                    createTaskMutation.mutate(taskForm);
                  }
                }}
                disabled={!taskForm.title || !taskForm.description || !taskForm.rewardUsd}
                data-testid="button-save-task"
              >
                {editingTask ? "Save Changes" : "Create Task"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!submissionViewOpen} onOpenChange={() => setSubmissionViewOpen(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Submission Details</DialogTitle>
            </DialogHeader>
            {submissionViewOpen && (
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">User ID</Label>
                  <p className="font-mono text-sm">{submissionViewOpen.userId}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Profile/Post Link</Label>
                  {(submissionViewOpen as any).proofUrl ? (
                    <a 
                      href={(submissionViewOpen as any).proofUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline break-all block"
                    >
                      {(submissionViewOpen as any).proofUrl}
                    </a>
                  ) : (
                    <p className="text-muted-foreground">No URL provided</p>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">Additional Information</Label>
                  <p className="whitespace-pre-wrap">{(submissionViewOpen as any).proofText || "No text provided"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Screenshot Proof Links</Label>
                  {(submissionViewOpen as any).screenshotLinks ? (
                    <div className="space-y-1">
                      {(submissionViewOpen as any).screenshotLinks.split(",").map((link: string, idx: number) => (
                        <a 
                          key={idx}
                          href={link.trim()} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline break-all block text-sm"
                        >
                          {link.trim()}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No screenshots provided</p>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">Legacy Proof Data</Label>
                  <p className="text-sm text-muted-foreground break-all">{submissionViewOpen.proofData || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge
                    variant={
                      submissionViewOpen.status === "approved"
                        ? "default"
                        : submissionViewOpen.status === "rejected"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {submissionViewOpen.status}
                  </Badge>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setSubmissionViewOpen(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
