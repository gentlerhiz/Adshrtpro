"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Users,
  Link2,
  BarChart3,
  Settings,
  Ban,
  Check,
  X,
  Shield,
  BookOpen,
  ExternalLink,
  Trash2,
  Search,
  Megaphone,
  Plus,
  Edit,
  Bell,
  Send,
} from "lucide-react";
import type { User, Link as LinkType, BlogPost, PlatformStats, BannedIp, SponsoredPost, CustomAd, Notification, Announcement } from "@shared/schema";
import { adSizeRecommendations } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [searchUsers, setSearchUsers] = useState("");
  const [searchLinks, setSearchLinks] = useState("");
  const [banDialogOpen, setBanDialogOpen] = useState<{ type: "user" | "link" | "ip"; id: string } | null>(null);
  const [sponsoredDialogOpen, setSponsoredDialogOpen] = useState(false);
  const [editingSponsoredPost, setEditingSponsoredPost] = useState<SponsoredPost | null>(null);
  const [sponsoredForm, setSponsoredForm] = useState({
    title: "",
    description: "",
    content: "",
    logoUrl: "",
    bannerUrl: "",
    websiteUrl: "",
    isActive: false,
    isApproved: false,
    priority: 0,
  });
  const [customAdDialogOpen, setCustomAdDialogOpen] = useState(false);
  const [editingCustomAd, setEditingCustomAd] = useState<CustomAd | null>(null);
  const [customAdForm, setCustomAdForm] = useState({
    name: "",
    adCode: "",
    placement: "header" as "header" | "footer" | "sidebar" | "in-content",
    deviceType: "both" as "desktop" | "mobile" | "both",
    adSize: "728x90" as "728x90" | "970x90" | "300x250" | "336x280" | "320x50" | "320x100",
    isEnabled: true,
  });
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [notificationForm, setNotificationForm] = useState({
    title: "",
    message: "",
    type: "info" as "info" | "success" | "warning" | "error",
    isGlobal: true,
    userId: "",
  });
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [announcementForm, setAnnouncementForm] = useState({
    message: "",
    type: "info" as "info" | "success" | "promo",
    isActive: true,
    priority: 0,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<PlatformStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: sponsoredPosts, isLoading: sponsoredLoading } = useQuery<SponsoredPost[]>({
    queryKey: ["/api/admin/sponsored-posts"],
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: links, isLoading: linksLoading } = useQuery<LinkType[]>({
    queryKey: ["/api/admin/links"],
  });

  const { data: posts, isLoading: postsLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog"],
  });

  const { data: bannedIps } = useQuery<BannedIp[]>({
    queryKey: ["/api/admin/banned-ips"],
  });

  const { data: notifications, isLoading: notificationsLoading } = useQuery<Notification[]>({
    queryKey: ["/api/admin/notifications"],
  });

  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/admin/settings"],
  });

  const { data: customAds, isLoading: customAdsLoading } = useQuery<CustomAd[]>({
    queryKey: ["/api/admin/custom-ads"],
  });

  const { data: announcements, isLoading: announcementsLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/admin/announcements"],
  });

  const banUserMutation = useMutation({
    mutationFn: async ({ id, banned }: { id: string; banned: boolean }) => {
      await apiRequest("PATCH", `/api/admin/users/${id}`, { isBanned: banned });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User updated" });
    },
  });

  const banLinkMutation = useMutation({
    mutationFn: async ({ id, disabled }: { id: string; disabled: boolean }) => {
      await apiRequest("PATCH", `/api/admin/links/${id}`, { isDisabled: disabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/links"] });
      toast({ title: "Link updated" });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/blog/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog"] });
      toast({ title: "Post deleted" });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      await apiRequest("PATCH", "/api/admin/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({ title: "Settings saved" });
    },
  });

  const createSponsoredMutation = useMutation({
    mutationFn: async (data: typeof sponsoredForm) => {
      await apiRequest("POST", "/api/admin/sponsored-posts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sponsored-posts"] });
      toast({ title: "Sponsored post created" });
      setSponsoredDialogOpen(false);
      resetSponsoredForm();
    },
    onError: () => {
      toast({ title: "Failed to create sponsored post", variant: "destructive" });
    },
  });

  const updateSponsoredMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof sponsoredForm> }) => {
      await apiRequest("PATCH", `/api/admin/sponsored-posts/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sponsored-posts"] });
      toast({ title: "Sponsored post updated" });
      setSponsoredDialogOpen(false);
      setEditingSponsoredPost(null);
      resetSponsoredForm();
    },
  });

  const deleteSponsoredMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/sponsored-posts/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sponsored-posts"] });
      toast({ title: "Sponsored post deleted" });
    },
  });

  const createCustomAdMutation = useMutation({
    mutationFn: async (data: typeof customAdForm) => {
      await apiRequest("POST", "/api/admin/custom-ads", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/custom-ads"] });
      toast({ title: "Custom ad created" });
      setCustomAdDialogOpen(false);
      resetCustomAdForm();
    },
  });

  const updateCustomAdMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof customAdForm> }) => {
      await apiRequest("PATCH", `/api/admin/custom-ads/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/custom-ads"] });
      toast({ title: "Custom ad updated" });
      setCustomAdDialogOpen(false);
      setEditingCustomAd(null);
    },
  });

  const deleteCustomAdMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/custom-ads/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/custom-ads"] });
      toast({ title: "Custom ad deleted" });
    },
  });

  const createNotificationMutation = useMutation({
    mutationFn: async (data: typeof notificationForm) => {
      await apiRequest("POST", "/api/admin/notifications", {
        title: data.title,
        message: data.message,
        type: data.type,
        isGlobal: data.isGlobal,
        userId: data.isGlobal ? undefined : data.userId || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      toast({ title: "Notification sent successfully" });
      setNotificationDialogOpen(false);
      resetNotificationForm();
    },
    onError: () => {
      toast({ title: "Failed to send notification", variant: "destructive" });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/notifications/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      toast({ title: "Notification deleted" });
    },
  });

  const resetNotificationForm = () => {
    setNotificationForm({
      title: "",
      message: "",
      type: "info",
      isGlobal: true,
      userId: "",
    });
  };

  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: typeof announcementForm) => {
      await apiRequest("POST", "/api/admin/announcements", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      toast({ title: "Announcement created" });
      setAnnouncementDialogOpen(false);
      resetAnnouncementForm();
    },
    onError: () => {
      toast({ title: "Failed to create announcement", variant: "destructive" });
    },
  });

  const updateAnnouncementMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof announcementForm> }) => {
      await apiRequest("PATCH", `/api/admin/announcements/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      toast({ title: "Announcement updated" });
      setAnnouncementDialogOpen(false);
      setEditingAnnouncement(null);
      resetAnnouncementForm();
    },
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/announcements/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      toast({ title: "Announcement deleted" });
    },
  });

  const resetAnnouncementForm = () => {
    setAnnouncementForm({
      message: "",
      type: "info",
      isActive: true,
      priority: 0,
    });
  };

  const resetCustomAdForm = () => {
    setCustomAdForm({
      name: "",
      adCode: "",
      placement: "header",
      deviceType: "both",
      adSize: "728x90",
      isEnabled: true,
    });
  };

  const openCustomAdEdit = (ad: CustomAd) => {
    setEditingCustomAd(ad);
    setCustomAdForm({
      name: ad.name,
      adCode: ad.adCode,
      placement: ad.placement as typeof customAdForm.placement,
      deviceType: ad.deviceType as typeof customAdForm.deviceType,
      adSize: ad.adSize as typeof customAdForm.adSize,
      isEnabled: ad.isEnabled ?? true,
    });
    setCustomAdDialogOpen(true);
  };

  const resetSponsoredForm = () => {
    setSponsoredForm({
      title: "",
      description: "",
      content: "",
      logoUrl: "",
      bannerUrl: "",
      websiteUrl: "",
      isActive: false,
      isApproved: false,
      priority: 0,
    });
  };

  const openSponsoredEdit = (post: SponsoredPost) => {
    setEditingSponsoredPost(post);
    setSponsoredForm({
      title: post.title,
      description: post.description,
      content: post.content ?? "",
      logoUrl: post.logoUrl ?? "",
      bannerUrl: post.bannerUrl ?? "",
      websiteUrl: post.websiteUrl ?? "",
      isActive: post.isActive ?? false,
      isApproved: post.isApproved ?? false,
      priority: post.priority ?? 0,
    });
    setSponsoredDialogOpen(true);
  };

  useEffect(() => {
    if (user !== undefined && !user?.isAdmin) {
      router.push("/login");
    }
  }, [user, router]);

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <Shield className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Welcome back, Admin</h2>
            <p className="text-muted-foreground mb-6">
              Sign in to your admin account to manage the platform.
            </p>
            <Link href="/login">
              <Button data-testid="button-admin-login">Sign in to Admin Panel</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredUsers = users?.filter(
    (u) => u.email.toLowerCase().includes(searchUsers.toLowerCase()) ||
      (u.telegramUsername && u.telegramUsername.toLowerCase().includes(searchUsers.toLowerCase()))
  );

  const filteredLinks = links?.filter(
    (l) =>
      l.shortCode.toLowerCase().includes(searchLinks.toLowerCase()) ||
      l.originalUrl.toLowerCase().includes(searchLinks.toLowerCase())
  );

  const StatCard = ({ title, value, icon: Icon, subtext }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value}</p>
        {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h1 className="font-heading text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">Manage your platform</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))
          ) : (
            <>
              <StatCard
                title="Total Users"
                value={stats?.totalUsers ?? 0}
                icon={Users}
              />
              <StatCard
                title="Total Links"
                value={stats?.totalLinks ?? 0}
                icon={Link2}
                subtext={`${stats?.linksToday ?? 0} today`}
              />
              <StatCard
                title="Total Clicks"
                value={stats?.totalClicks ?? 0}
                icon={BarChart3}
                subtext={`${stats?.clicksToday ?? 0} today`}
              />
              <StatCard
                title="Blog Posts"
                value={posts?.length ?? 0}
                icon={BookOpen}
              />
            </>
          )}
        </div>

        <Tabs defaultValue="users">
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 mb-6">
            <TabsList className="inline-flex w-max md:grid md:w-full md:grid-cols-9 gap-1">
              <TabsTrigger value="users" data-testid="tab-users" className="whitespace-nowrap">Users</TabsTrigger>
              <TabsTrigger value="links" data-testid="tab-links" className="whitespace-nowrap">Links</TabsTrigger>
              <TabsTrigger value="blog" data-testid="tab-blog" className="whitespace-nowrap">Blog</TabsTrigger>
              <TabsTrigger value="sponsored" data-testid="tab-sponsored" className="whitespace-nowrap">Sponsored</TabsTrigger>
              <TabsTrigger value="settings" data-testid="tab-settings" className="whitespace-nowrap">Ads</TabsTrigger>
              <TabsTrigger value="earning" data-testid="tab-earning" className="whitespace-nowrap">Earning</TabsTrigger>
              <TabsTrigger value="notifications" data-testid="tab-notifications" className="whitespace-nowrap">Notifications</TabsTrigger>
              <TabsTrigger value="announcements" data-testid="tab-announcements" className="whitespace-nowrap">Announcements</TabsTrigger>
              <TabsTrigger value="security" data-testid="tab-security" className="whitespace-nowrap">Security</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="users">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center gap-4">
                <CardTitle className="flex-1">Users</CardTitle>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchUsers}
                    onChange={(e) => setSearchUsers(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <Skeleton className="h-64" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Telegram</TableHead>
                        <TableHead>Verified</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Admin</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers?.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.email}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {u.telegramUsername ? `@${u.telegramUsername}` : "-"}
                          </TableCell>
                          <TableCell>
                            {u.emailVerified ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <X className="w-4 h-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={u.isBanned ? "destructive" : "default"}>
                              {u.isBanned ? "Banned" : "Active"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {u.isAdmin && <Badge>Admin</Badge>}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                banUserMutation.mutate({ id: u.id, banned: !u.isBanned })
                              }
                            >
                              {u.isBanned ? "Unban" : "Ban"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="links">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center gap-4">
                <CardTitle className="flex-1">Links</CardTitle>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search links..."
                    value={searchLinks}
                    onChange={(e) => setSearchLinks(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {linksLoading ? (
                  <Skeleton className="h-64" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Short Code</TableHead>
                        <TableHead>Original URL</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLinks?.slice(0, 50).map((link) => (
                        <TableRow key={link.id}>
                          <TableCell>
                            <a
                              href={`/${link.shortCode}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-primary hover:underline flex items-center gap-1"
                            >
                              /{link.shortCode}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-muted-foreground">
                            {link.originalUrl}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {link.createdAt
                              ? format(new Date(link.createdAt), "MMM d, yyyy")
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={link.isDisabled ? "secondary" : "default"}>
                              {link.isDisabled ? "Disabled" : "Active"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                banLinkMutation.mutate({
                                  id: link.id,
                                  disabled: !link.isDisabled,
                                })
                              }
                            >
                              {link.isDisabled ? "Enable" : "Disable"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blog">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle>Blog Posts</CardTitle>
                <Link href="/admin/blog/new">
                  <Button data-testid="button-new-post">New Post</Button>
                </Link>
              </CardHeader>
              <CardContent>
                {postsLoading ? (
                  <Skeleton className="h-64" />
                ) : posts && posts.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {posts.map((post) => (
                        <TableRow key={post.id}>
                          <TableCell className="font-medium">{post.title}</TableCell>
                          <TableCell className="text-muted-foreground">
                            /{post.slug}
                          </TableCell>
                          <TableCell>
                            <Badge variant={post.isPublished ? "default" : "secondary"}>
                              {post.isPublished ? "Published" : "Draft"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {post.updatedAt
                              ? format(new Date(post.updatedAt), "MMM d, yyyy")
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Link href={`/admin/blog/${post.id}`}>
                                <Button variant="ghost" size="sm">
                                  Edit
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deletePostMutation.mutate(post.id)}
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
                    <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No blog posts yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Rewarded Ad Code</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Paste your rewarded ad script here..."
                    className="min-h-[200px] font-mono text-sm"
                    defaultValue={settings?.rewardedAdCode || ""}
                    onChange={(e) =>
                      updateSettingsMutation.mutate({ rewardedAdCode: e.target.value })
                    }
                    data-testid="textarea-rewarded-ad"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    This code will be used for analytics unlock and QR download.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AdSense Code</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Paste your AdSense script here..."
                    className="min-h-[200px] font-mono text-sm"
                    defaultValue={settings?.adsenseCode || ""}
                    onChange={(e) =>
                      updateSettingsMutation.mutate({ adsenseCode: e.target.value })
                    }
                    data-testid="textarea-adsense"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Display ads shown on public pages.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Analytics Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Unlock Duration (minutes)</Label>
                    <Input
                      type="number"
                      defaultValue={settings?.unlockDuration || "60"}
                      onChange={(e) =>
                        updateSettingsMutation.mutate({ unlockDuration: e.target.value })
                      }
                      data-testid="input-unlock-duration"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      defaultChecked={settings?.adsEnabled === "true"}
                      onCheckedChange={(checked) =>
                        updateSettingsMutation.mutate({ adsEnabled: checked.toString() })
                      }
                      data-testid="switch-ads-enabled"
                    />
                    <Label>Enable Ads Globally</Label>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <CardTitle>Custom Ads Manager</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Fallback ads when AdSense is not approved
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      resetCustomAdForm();
                      setEditingCustomAd(null);
                      setCustomAdDialogOpen(true);
                    }}
                    data-testid="button-add-custom-ad"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Custom Ad
                  </Button>
                </CardHeader>
                <CardContent>
                  {customAdsLoading ? (
                    <Skeleton className="h-64" />
                  ) : customAds && customAds.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Placement</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead>Device</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customAds.map((ad) => (
                          <TableRow key={ad.id}>
                            <TableCell className="font-medium">{ad.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{ad.placement}</Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-muted-foreground text-sm">
                                {adSizeRecommendations[ad.adSize as keyof typeof adSizeRecommendations]?.name || ad.adSize}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{ad.deviceType}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={ad.isEnabled ? "default" : "secondary"}>
                                {ad.isEnabled ? "Enabled" : "Disabled"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openCustomAdEdit(ad)}
                                  data-testid={`button-edit-ad-${ad.id}`}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    updateCustomAdMutation.mutate({
                                      id: ad.id,
                                      data: { isEnabled: !ad.isEnabled },
                                    })
                                  }
                                  data-testid={`button-toggle-ad-${ad.id}`}
                                >
                                  {ad.isEnabled ? (
                                    <X className="w-4 h-4" />
                                  ) : (
                                    <Check className="w-4 h-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteCustomAdMutation.mutate(ad.id)}
                                  data-testid={`button-delete-ad-${ad.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-12">
                      <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No custom ads configured</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Add custom ads to display when AdSense is not available
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sponsored">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center gap-4">
                <CardTitle className="flex-1">Sponsored Posts</CardTitle>
                <Button
                  onClick={() => {
                    resetSponsoredForm();
                    setEditingSponsoredPost(null);
                    setSponsoredDialogOpen(true);
                  }}
                  data-testid="button-add-sponsored"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Sponsored Post
                </Button>
              </CardHeader>
              <CardContent>
                {sponsoredLoading ? (
                  <Skeleton className="h-64" />
                ) : sponsoredPosts && sponsoredPosts.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Views</TableHead>
                        <TableHead>Clicks</TableHead>
                        <TableHead>Reactions</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sponsoredPosts.map((post) => (
                        <TableRow key={post.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {post.logoUrl && (
                                <img
                                  src={post.logoUrl}
                                  alt=""
                                  className="w-6 h-6 rounded object-contain"
                                />
                              )}
                              <span className="font-medium">{post.title}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant={post.isActive ? "default" : "secondary"}>
                                {post.isActive ? "Active" : "Inactive"}
                              </Badge>
                              <Badge variant={post.isApproved ? "default" : "outline"}>
                                {post.isApproved ? "Approved" : "Pending"}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>{post.viewCount ?? 0}</TableCell>
                          <TableCell>{post.clickCount ?? 0}</TableCell>
                          <TableCell>
                            <span className="text-green-600">{post.likes ?? 0}</span>
                            {" / "}
                            <span className="text-red-600">{post.dislikes ?? 0}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openSponsoredEdit(post)}
                                data-testid={`button-edit-sponsored-${post.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  updateSponsoredMutation.mutate({
                                    id: post.id,
                                    data: { isActive: !post.isActive },
                                  })
                                }
                                data-testid={`button-toggle-sponsored-${post.id}`}
                              >
                                {post.isActive ? (
                                  <X className="w-4 h-4" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteSponsoredMutation.mutate(post.id)}
                                data-testid={`button-delete-sponsored-${post.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No sponsored posts yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Create your first sponsored post to display in the carousel.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="earning">
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <CardTitle>Earning System Settings</CardTitle>
                  <Link href="/admin/earning">
                    <Button data-testid="button-manage-earning">
                      Manage Earning System
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Manage tasks, withdrawals, referrals, and offerwall settings from the dedicated earning management page.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Tasks Management</p>
                      <p className="text-xl font-bold">Create & approve tasks</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Withdrawals</p>
                      <p className="text-xl font-bold">Review & process</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Referrals</p>
                      <p className="text-xl font-bold">Validate & reward</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center gap-4">
                <CardTitle className="flex-1">Manage Notifications</CardTitle>
                <Button onClick={() => setNotificationDialogOpen(true)} data-testid="button-create-notification">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Notification
                </Button>
              </CardHeader>
              <CardContent>
                {notificationsLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-16" />
                    ))}
                  </div>
                ) : notifications && notifications.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notifications.map((notif) => (
                        <TableRow key={notif.id}>
                          <TableCell className="font-medium">{notif.title}</TableCell>
                          <TableCell className="text-muted-foreground max-w-xs truncate">
                            {notif.message}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              notif.type === "success" ? "default" :
                              notif.type === "warning" ? "secondary" :
                              notif.type === "error" ? "destructive" : "outline"
                            }>
                              {notif.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {notif.isGlobal ? (
                              <Badge variant="secondary">Global</Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                {users?.find(u => u.id === notif.userId)?.email || notif.userId}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {notif.createdAt
                              ? format(new Date(notif.createdAt), "MMM d, HH:mm")
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteNotificationMutation.mutate(notif.id)}
                              data-testid={`button-delete-notification-${notif.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No notifications created yet</p>
                    <Button onClick={() => setNotificationDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Notification
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="announcements">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center gap-4">
                <CardTitle className="flex-1">Manage Announcements</CardTitle>
                <Button onClick={() => {
                  resetAnnouncementForm();
                  setEditingAnnouncement(null);
                  setAnnouncementDialogOpen(true);
                }} data-testid="button-create-announcement">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Announcement
                </Button>
              </CardHeader>
              <CardContent>
                {announcementsLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-16" />
                    ))}
                  </div>
                ) : announcements && announcements.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Message</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {announcements.map((ann) => (
                        <TableRow key={ann.id}>
                          <TableCell className="max-w-md truncate">{ann.message}</TableCell>
                          <TableCell>
                            <Badge variant={
                              ann.type === "success" ? "default" :
                              ann.type === "promo" ? "secondary" : "outline"
                            }>
                              {ann.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{ann.priority}</TableCell>
                          <TableCell>
                            <Switch
                              checked={ann.isActive ?? false}
                              onCheckedChange={(checked) => 
                                updateAnnouncementMutation.mutate({ id: ann.id, data: { isActive: checked } })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingAnnouncement(ann);
                                  setAnnouncementForm({
                                    message: ann.message,
                                    type: ann.type as "info" | "success" | "promo",
                                    isActive: ann.isActive ?? true,
                                    priority: ann.priority ?? 0,
                                  });
                                  setAnnouncementDialogOpen(true);
                                }}
                                data-testid={`button-edit-announcement-${ann.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteAnnouncementMutation.mutate(ann.id)}
                                data-testid={`button-delete-announcement-${ann.id}`}
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
                    <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No announcements created yet</p>
                    <Button onClick={() => {
                      resetAnnouncementForm();
                      setAnnouncementDialogOpen(true);
                    }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Announcement
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Banned IP Addresses</CardTitle>
              </CardHeader>
              <CardContent>
                {bannedIps && bannedIps.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Banned At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bannedIps.map((ip) => (
                        <TableRow key={ip.id}>
                          <TableCell className="font-mono">{ip.ip}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {ip.reason || "-"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {ip.bannedAt
                              ? format(new Date(ip.bannedAt), "MMM d, yyyy")
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <Ban className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No banned IPs</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={sponsoredDialogOpen} onOpenChange={setSponsoredDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSponsoredPost ? "Edit Sponsored Post" : "Create Sponsored Post"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={sponsoredForm.title}
                  onChange={(e) =>
                    setSponsoredForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Company or product name"
                  data-testid="input-sponsored-title"
                />
              </div>
              <div>
                <Label>Description *</Label>
                <Textarea
                  value={sponsoredForm.description}
                  onChange={(e) =>
                    setSponsoredForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Short description of the sponsor"
                  data-testid="input-sponsored-description"
                />
              </div>
              <div>
                <Label>Content</Label>
                <Textarea
                  value={sponsoredForm.content}
                  onChange={(e) =>
                    setSponsoredForm((prev) => ({ ...prev, content: e.target.value }))
                  }
                  placeholder="Additional content (optional)"
                  className="min-h-[100px]"
                  data-testid="input-sponsored-content"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Logo URL</Label>
                  <Input
                    value={sponsoredForm.logoUrl}
                    onChange={(e) =>
                      setSponsoredForm((prev) => ({ ...prev, logoUrl: e.target.value }))
                    }
                    placeholder="https://..."
                    data-testid="input-sponsored-logo"
                  />
                </div>
                <div>
                  <Label>Banner URL</Label>
                  <Input
                    value={sponsoredForm.bannerUrl}
                    onChange={(e) =>
                      setSponsoredForm((prev) => ({ ...prev, bannerUrl: e.target.value }))
                    }
                    placeholder="https://..."
                    data-testid="input-sponsored-banner"
                  />
                </div>
              </div>
              <div>
                <Label>Website URL</Label>
                <Input
                  value={sponsoredForm.websiteUrl}
                  onChange={(e) =>
                    setSponsoredForm((prev) => ({ ...prev, websiteUrl: e.target.value }))
                  }
                  placeholder="https://..."
                  data-testid="input-sponsored-website"
                />
              </div>
              <div>
                <Label>Priority</Label>
                <Input
                  type="number"
                  value={sponsoredForm.priority}
                  onChange={(e) =>
                    setSponsoredForm((prev) => ({ ...prev, priority: parseInt(e.target.value) || 0 }))
                  }
                  placeholder="Higher number = shown first"
                  data-testid="input-sponsored-priority"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={sponsoredForm.isActive}
                    onCheckedChange={(checked) =>
                      setSponsoredForm((prev) => ({ ...prev, isActive: checked }))
                    }
                    data-testid="switch-sponsored-active"
                  />
                  <Label>Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={sponsoredForm.isApproved}
                    onCheckedChange={(checked) =>
                      setSponsoredForm((prev) => ({ ...prev, isApproved: checked }))
                    }
                    data-testid="switch-sponsored-approved"
                  />
                  <Label>Approved</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setSponsoredDialogOpen(false);
                  setEditingSponsoredPost(null);
                  resetSponsoredForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (editingSponsoredPost) {
                    updateSponsoredMutation.mutate({
                      id: editingSponsoredPost.id,
                      data: sponsoredForm,
                    });
                  } else {
                    createSponsoredMutation.mutate(sponsoredForm);
                  }
                }}
                disabled={!sponsoredForm.title || !sponsoredForm.description}
                data-testid="button-save-sponsored"
              >
                {editingSponsoredPost ? "Save Changes" : "Create Post"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={customAdDialogOpen} onOpenChange={setCustomAdDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCustomAd ? "Edit Custom Ad" : "Add Custom Ad"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Ad Name</Label>
                <Input
                  value={customAdForm.name}
                  onChange={(e) =>
                    setCustomAdForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Header Banner, Sidebar Ad, etc."
                  data-testid="input-ad-name"
                />
              </div>
              <div>
                <Label>Ad Code</Label>
                <Textarea
                  value={customAdForm.adCode}
                  onChange={(e) =>
                    setCustomAdForm((prev) => ({ ...prev, adCode: e.target.value }))
                  }
                  placeholder="Paste HTML, image URL, or script..."
                  className="min-h-[150px] font-mono text-sm"
                  data-testid="textarea-ad-code"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Placement</Label>
                  <Select
                    value={customAdForm.placement}
                    onValueChange={(value: typeof customAdForm.placement) =>
                      setCustomAdForm((prev) => ({ ...prev, placement: value }))
                    }
                  >
                    <SelectTrigger data-testid="select-placement">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="header">Header</SelectItem>
                      <SelectItem value="footer">Footer</SelectItem>
                      <SelectItem value="sidebar">Sidebar</SelectItem>
                      <SelectItem value="in-content">In-Content</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Device Type</Label>
                  <Select
                    value={customAdForm.deviceType}
                    onValueChange={(value: typeof customAdForm.deviceType) =>
                      setCustomAdForm((prev) => ({ ...prev, deviceType: value }))
                    }
                  >
                    <SelectTrigger data-testid="select-device">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">All Devices</SelectItem>
                      <SelectItem value="desktop">Desktop Only</SelectItem>
                      <SelectItem value="mobile">Mobile Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Ad Size</Label>
                  <Select
                    value={customAdForm.adSize}
                    onValueChange={(value: typeof customAdForm.adSize) =>
                      setCustomAdForm((prev) => ({ ...prev, adSize: value }))
                    }
                  >
                    <SelectTrigger data-testid="select-size">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(adSizeRecommendations).map(([size, info]) => (
                        <SelectItem key={size} value={size}>
                          {info.name} ({size})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="rounded-md bg-muted/50 p-3">
                <p className="text-sm text-muted-foreground">
                  <strong>Recommended:</strong>{" "}
                  {adSizeRecommendations[customAdForm.adSize]?.description} - {customAdForm.adSize}px
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={customAdForm.isEnabled}
                  onCheckedChange={(checked) =>
                    setCustomAdForm((prev) => ({ ...prev, isEnabled: checked }))
                  }
                  data-testid="switch-ad-enabled"
                />
                <Label>Enable this ad</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setCustomAdDialogOpen(false);
                  setEditingCustomAd(null);
                  resetCustomAdForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (editingCustomAd) {
                    updateCustomAdMutation.mutate({
                      id: editingCustomAd.id,
                      data: customAdForm,
                    });
                  } else {
                    createCustomAdMutation.mutate(customAdForm);
                  }
                }}
                disabled={!customAdForm.name || !customAdForm.adCode}
                data-testid="button-save-ad"
              >
                {editingCustomAd ? "Save Changes" : "Create Ad"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={notificationDialogOpen} onOpenChange={setNotificationDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Notification</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={notificationForm.title}
                  onChange={(e) =>
                    setNotificationForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Notification title"
                  data-testid="input-notification-title"
                />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea
                  value={notificationForm.message}
                  onChange={(e) =>
                    setNotificationForm((prev) => ({ ...prev, message: e.target.value }))
                  }
                  placeholder="Notification message..."
                  rows={3}
                  data-testid="input-notification-message"
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select
                  value={notificationForm.type}
                  onValueChange={(value: typeof notificationForm.type) =>
                    setNotificationForm((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger data-testid="select-notification-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={notificationForm.isGlobal}
                  onCheckedChange={(checked) =>
                    setNotificationForm((prev) => ({ ...prev, isGlobal: checked }))
                  }
                  data-testid="switch-notification-global"
                />
                <Label>Send to all users (global notification)</Label>
              </div>
              {!notificationForm.isGlobal && (
                <div>
                  <Label>Target User</Label>
                  <Select
                    value={notificationForm.userId}
                    onValueChange={(value) =>
                      setNotificationForm((prev) => ({ ...prev, userId: value }))
                    }
                  >
                    <SelectTrigger data-testid="select-notification-user">
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setNotificationDialogOpen(false);
                  resetNotificationForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => createNotificationMutation.mutate(notificationForm)}
                disabled={!notificationForm.title || !notificationForm.message || createNotificationMutation.isPending}
                data-testid="button-send-notification"
              >
                <Send className="w-4 h-4 mr-2" />
                {createNotificationMutation.isPending ? "Sending..." : "Send Notification"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={announcementDialogOpen} onOpenChange={setAnnouncementDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingAnnouncement ? "Edit Announcement" : "Create Announcement"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Message</Label>
                <Textarea
                  value={announcementForm.message}
                  onChange={(e) =>
                    setAnnouncementForm((prev) => ({ ...prev, message: e.target.value }))
                  }
                  placeholder="Announcement message..."
                  rows={3}
                  data-testid="input-announcement-message"
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select
                  value={announcementForm.type}
                  onValueChange={(value: "info" | "success" | "promo") =>
                    setAnnouncementForm((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger data-testid="select-announcement-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info (Blue)</SelectItem>
                    <SelectItem value="success">Success (Green)</SelectItem>
                    <SelectItem value="promo">Promo (Purple)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority (higher = shown first)</Label>
                <Input
                  type="number"
                  value={announcementForm.priority}
                  onChange={(e) =>
                    setAnnouncementForm((prev) => ({ ...prev, priority: parseInt(e.target.value) || 0 }))
                  }
                  data-testid="input-announcement-priority"
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={announcementForm.isActive}
                  onCheckedChange={(checked) =>
                    setAnnouncementForm((prev) => ({ ...prev, isActive: checked }))
                  }
                  data-testid="switch-announcement-active"
                />
                <Label>Active (displayed in banner)</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setAnnouncementDialogOpen(false);
                  setEditingAnnouncement(null);
                  resetAnnouncementForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (editingAnnouncement) {
                    updateAnnouncementMutation.mutate({ id: editingAnnouncement.id, data: announcementForm });
                  } else {
                    createAnnouncementMutation.mutate(announcementForm);
                  }
                }}
                disabled={!announcementForm.message || createAnnouncementMutation.isPending || updateAnnouncementMutation.isPending}
                data-testid="button-save-announcement"
              >
                {createAnnouncementMutation.isPending || updateAnnouncementMutation.isPending 
                  ? "Saving..." 
                  : editingAnnouncement ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
