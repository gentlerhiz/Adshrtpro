"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient, getQueryFn } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  Globe,
  Smartphone,
  Monitor,
  Chrome,
  ExternalLink,
  Lock,
  Clock,
  MousePointer,
  Play,
} from "lucide-react";
import { AdDisplay } from "@/components/ad-display";
import { SEO } from "@/components/seo";
import type { Link as LinkType, LinkAnalytics } from "@shared/schema";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface UnlockStatus {
  unlocked: boolean;
  expiry: string | null;
}

interface AdSettings {
  adsEnabled: boolean;
  rewardedAdCode: string;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function AnalyticsContent() {
  const { user, isLoading: authLoading, unlockLinkAnalytics } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const linkParam = searchParams.get("link");
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(linkParam);
  const [countdown, setCountdown] = useState<string>("00:00");
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [forceLockedLinks, setForceLockedLinks] = useState<Set<string>>(new Set());
  const [adDialogOpen, setAdDialogOpen] = useState(false);
  const adContainerRef = useRef<HTMLDivElement>(null);

  const { data: links, isLoading: linksLoading } = useQuery<LinkType[]>({
    queryKey: ["/api/links"],
    enabled: !!user,
  });

  // Query for ad settings
  const { data: adSettings } = useQuery<AdSettings>({
    queryKey: ["/api/settings/ads"],
  });

  // Query for unlock status from server - polls every 30 seconds
  const { data: unlockStatus, refetch: refetchUnlockStatus } = useQuery<UnlockStatus>({
    queryKey: [`/api/analytics/${selectedLinkId}/unlock-status`],
    queryFn: getQueryFn<UnlockStatus>({ on401: "returnNull" }),
    enabled: !!selectedLinkId,
    refetchInterval: 30000, // Refresh every 30 seconds to stay in sync with server
    staleTime: 5000, // Consider data stale after 5 seconds
  });

  // Derive isUnlocked: server must report unlocked, expiry must be in the future, and not force-locked
  const serverExpiry = unlockStatus?.expiry ? new Date(unlockStatus.expiry) : null;
  const expiryValid = serverExpiry && serverExpiry.getTime() > Date.now();
  const serverUnlocked = unlockStatus?.unlocked && expiryValid;
  const isLinkForceLocked = selectedLinkId ? forceLockedLinks.has(selectedLinkId) : false;
  // Real-time check: even with stale cache, compare expiry NOW
  const isUnlocked = Boolean(serverUnlocked) && !isLinkForceLocked;

  // Precise timeout to lock exactly at server expiry time
  useEffect(() => {
    if (!selectedLinkId || !unlockStatus?.expiry) {
      return;
    }

    const expiryDate = new Date(unlockStatus.expiry);
    const remaining = expiryDate.getTime() - Date.now();
    
    const lockLink = () => {
      setForceLockedLinks(prev => {
        const next = new Set(prev);
        next.add(selectedLinkId!);
        return next;
      });
      setCountdown("00:00");
      queryClient.setQueryData(["/api/analytics", selectedLinkId], undefined);
    };

    if (remaining <= 0) {
      // Already expired - force lock immediately
      lockLink();
      return;
    }

    // Set a timeout to fire exactly at expiry
    const timeoutId = setTimeout(() => {
      lockLink();
      refetchUnlockStatus();
    }, remaining);

    return () => clearTimeout(timeoutId);
  }, [selectedLinkId, unlockStatus?.expiry, refetchUnlockStatus]);

  // Countdown timer - updates every second for display only
  useEffect(() => {
    if (!selectedLinkId || !unlockStatus?.expiry) {
      setCountdown("00:00");
      return;
    }

    const updateCountdown = () => {
      const expiryDate = new Date(unlockStatus.expiry!);
      const remaining = expiryDate.getTime() - Date.now();
      if (remaining > 0) {
        setCountdown(formatCountdown(remaining));
      } else {
        setCountdown("00:00");
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [selectedLinkId, unlockStatus?.expiry]);

  // Query for analytics data - only when unlocked
  const analyticsEnabled = Boolean(selectedLinkId) && isUnlocked;
  const { data: analytics, isLoading: analyticsLoading, error: analyticsError, isError: analyticsIsError } = useQuery<LinkAnalytics>({
    queryKey: ["/api/analytics", selectedLinkId],
    enabled: analyticsEnabled,
    retry: false, // Don't retry on 403
    staleTime: 10000, // Refetch after 10 seconds
  });

  // Handle 403 error by relocking - immediately lock UI and clear cached data
  useEffect(() => {
    if (analyticsIsError && selectedLinkId) {
      // Analytics request failed (likely 403) - immediately lock UI and hide data
      setForceLockedLinks(prev => {
        const next = new Set(prev);
        next.add(selectedLinkId);
        return next;
      });
      queryClient.setQueryData(["/api/analytics", selectedLinkId], undefined);
      queryClient.invalidateQueries({ queryKey: [`/api/analytics/${selectedLinkId}/unlock-status`] });
      refetchUnlockStatus();
    }
  }, [analyticsIsError, selectedLinkId, refetchUnlockStatus]);


  useEffect(() => {
    if (links && links.length > 0 && !selectedLinkId) {
      setSelectedLinkId(links[0].id);
    }
  }, [links, selectedLinkId]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  // Inject ad code when dialog opens - must be before early returns
  useEffect(() => {
    if (adDialogOpen && adContainerRef.current && adSettings?.rewardedAdCode) {
      // Clear previous content
      adContainerRef.current.innerHTML = "";
      // Inject the ad code
      const range = document.createRange();
      range.selectNode(adContainerRef.current);
      const fragment = range.createContextualFragment(adSettings.rewardedAdCode);
      adContainerRef.current.appendChild(fragment);
    }
  }, [adDialogOpen, adSettings?.rewardedAdCode]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-muted border-t-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const selectedLink = links?.find((l) => l.id === selectedLinkId);

  const handleWatchAd = () => {
    if (!selectedLinkId) return;
    // If there's a rewarded ad code, show the dialog first
    if (adSettings?.rewardedAdCode) {
      setAdDialogOpen(true);
    } else {
      // No ad code set, unlock directly
      handleUnlock();
    }
  };

  const handleUnlock = async () => {
    if (!selectedLinkId) return;
    setIsUnlocking(true);
    setAdDialogOpen(false);
    try {
      await unlockLinkAnalytics(selectedLinkId);
      // Clear force lock flag for this link after successful unlock
      setForceLockedLinks(prev => {
        const next = new Set(prev);
        next.delete(selectedLinkId);
        return next;
      });
      // Invalidate and refetch unlock status to sync with server
      await queryClient.invalidateQueries({ queryKey: [`/api/analytics/${selectedLinkId}/unlock-status`] });
      await refetchUnlockStatus();
      // Invalidate analytics query to fetch data immediately
      queryClient.invalidateQueries({ queryKey: ["/api/analytics", selectedLinkId] });
    } catch (error) {
      console.error("Failed to unlock analytics:", error);
    } finally {
      setIsUnlocking(false);
    }
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
  }: {
    title: string;
    value: string | number;
    icon: any;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold" data-testid={`stat-${title.toLowerCase().replace(" ", "-")}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );

  const DataList = ({
    title,
    data,
    icon: Icon,
  }: {
    title: string;
    data: { label: string; count: number }[];
    icon: any;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="space-y-3">
            {data.slice(0, 5).map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm truncate flex-1">{item.label || "Unknown"}</span>
                <Badge variant="secondary">{item.count}</Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No data available</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen py-8 px-4">
      <SEO 
        title="Analytics"
        description="Track clicks, countries, devices, and more with detailed link analytics."
      />
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold mb-1">Analytics</h1>
            <p className="text-muted-foreground">Track your link performance</p>
          </div>

          {isUnlocked && countdown !== "00:00" && (
            <Badge variant="outline" className="gap-2" data-testid="countdown-badge">
              <Clock className="w-4 h-4" />
              Access expires in {countdown}
            </Badge>
          )}
        </div>

        {linksLoading ? (
          <Skeleton className="h-10 w-64 mb-8" />
        ) : links && links.length > 0 ? (
          <div className="mb-8">
            <label className="text-sm font-medium mb-2 block">Select Link</label>
            <Select value={selectedLinkId ?? ""} onValueChange={setSelectedLinkId}>
              <SelectTrigger className="w-full md:w-80" data-testid="select-link">
                <SelectValue placeholder="Select a link" />
              </SelectTrigger>
              <SelectContent>
                {links.map((link) => (
                  <SelectItem key={link.id} value={link.id}>
                    /{link.shortCode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedLink && (
              <a
                href={`/${selectedLink.shortCode}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary mt-2 inline-flex items-center gap-1"
              >
                {selectedLink.originalUrl.length > 50 
                  ? selectedLink.originalUrl.slice(0, 50) + "..."
                  : selectedLink.originalUrl}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        ) : (
          <Card className="mb-8">
            <CardContent className="py-12 text-center">
              <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No links yet</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Create a link to start tracking analytics.
              </p>
              <Link href="/">
                <Button data-testid="button-create-link">Create a Link</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {selectedLinkId && !isUnlocked && (
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background z-10" />
            <CardContent className="py-24 text-center relative z-20">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="w-10 h-10 text-primary" />
              </div>
              <h2 className="font-heading text-2xl font-bold mb-2">
                Analytics Locked for This Link
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Watch a short ad to unlock analytics access for this link for 1 hour. 
                Get detailed insights about your link performance.
              </p>
              <Button
                size="lg"
                onClick={handleWatchAd}
                disabled={isUnlocking}
                data-testid="button-unlock-analytics"
              >
                <Play className="w-5 h-5 mr-2" />
                {isUnlocking ? "Unlocking..." : "Watch Ad to Unlock (1 hour)"}
              </Button>
            </CardContent>

            <div className="absolute inset-0 z-0 blur-sm opacity-50 pointer-events-none p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
              </div>
            </div>
          </Card>
        )}

        {selectedLinkId && isUnlocked && (
          <>
            {analyticsLoading ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-24" />
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-48" />
                  ))}
                </div>
              </>
            ) : analytics ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <StatCard
                    title="Total Clicks"
                    value={analytics.totalClicks}
                    icon={MousePointer}
                  />
                  <StatCard
                    title="Countries"
                    value={analytics.clicksByCountry.length}
                    icon={Globe}
                  />
                  <StatCard
                    title="Devices"
                    value={analytics.clicksByDevice.length}
                    icon={Smartphone}
                  />
                  <StatCard
                    title="Browsers"
                    value={analytics.clicksByBrowser.length}
                    icon={Chrome}
                  />
                </div>

                {analytics.clicksByDate && analytics.clicksByDate.length > 0 && (
                  <Card className="mb-8">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Click Trends
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={analytics.clicksByDate}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis 
                              dataKey="date" 
                              tickFormatter={(value) => format(new Date(value), "MMM d")}
                              className="text-xs"
                            />
                            <YAxis allowDecimals={false} className="text-xs" />
                            <Tooltip
                              labelFormatter={(value) => format(new Date(value), "MMM d, yyyy")}
                              formatter={(value: number) => [value, "Clicks"]}
                              contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="count"
                              stroke="hsl(var(--primary))"
                              strokeWidth={2}
                              dot={{ fill: "hsl(var(--primary))", r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DataList
                    title="Top Countries"
                    icon={Globe}
                    data={analytics.clicksByCountry.map((c) => ({
                      label: c.country,
                      count: c.count,
                    }))}
                  />
                  <DataList
                    title="Top Devices"
                    icon={Monitor}
                    data={analytics.clicksByDevice.map((d) => ({
                      label: d.device,
                      count: d.count,
                    }))}
                  />
                  <DataList
                    title="Top Browsers"
                    icon={Chrome}
                    data={analytics.clicksByBrowser.map((b) => ({
                      label: b.browser,
                      count: b.count,
                    }))}
                  />
                  <DataList
                    title="Top Referrers"
                    icon={ExternalLink}
                    data={analytics.clicksByReferrer.map((r) => ({
                      label: r.referrer || "Direct",
                      count: r.count,
                    }))}
                  />
                </div>

                {analytics.recentClicks.length > 0 && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="text-lg">Recent Clicks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analytics.recentClicks.slice(0, 10).map((click) => (
                          <div
                            key={click.id}
                            className="flex items-center justify-between text-sm border-b pb-3 last:border-0"
                          >
                            <div className="flex items-center gap-4 flex-wrap">
                              <Badge variant="outline">{click.country || "Unknown"}</Badge>
                              <span className="text-muted-foreground">
                                {click.device} / {click.browser}
                              </span>
                            </div>
                            <span className="text-muted-foreground">
                              {click.clickedAt
                                ? format(new Date(click.clickedAt), "MMM d, HH:mm")
                                : "-"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No clicks yet</h3>
                  <p className="text-muted-foreground text-sm">
                    Share your link to start collecting analytics data.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        <AdDisplay placement="footer" className="mt-8" />
      </div>

      {/* Rewarded Ad Dialog */}
      <Dialog open={adDialogOpen} onOpenChange={setAdDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Watch Ad to Unlock</DialogTitle>
            <DialogDescription>
              Watch the ad below to unlock analytics for 1 hour.
            </DialogDescription>
          </DialogHeader>
          <div 
            ref={adContainerRef} 
            className="min-h-[200px] flex items-center justify-center bg-muted rounded-md"
            data-testid="ad-container"
          >
            {!adSettings?.rewardedAdCode && (
              <p className="text-muted-foreground">Loading ad...</p>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setAdDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUnlock} disabled={isUnlocking}>
              {isUnlocking ? "Unlocking..." : "Continue & Unlock"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
      <AnalyticsContent />
    </Suspense>
  );
}
