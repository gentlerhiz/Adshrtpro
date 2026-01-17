"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
  QrCode,
  Download,
  Lock,
  Play,
  ExternalLink,
  Palette,
  Clock,
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AdDisplay } from "@/components/ad-display";
import { SEO } from "@/components/seo";
import type { Link as LinkType } from "@shared/schema";

interface AdSettings {
  adsEnabled: boolean;
  rewardedAdCode: string;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function QrCodesContent() {
  const { user, isLoading: authLoading, unlockLinkAnalytics } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const linkParam = searchParams.get("link");
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(linkParam);
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [countdown, setCountdown] = useState<string>("00:00:00");
  const [forceLockedLinks, setForceLockedLinks] = useState<Set<string>>(new Set());
  const [adDialogOpen, setAdDialogOpen] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const adContainerRef = useRef<HTMLDivElement>(null);

  const { data: links, isLoading: linksLoading } = useQuery<LinkType[]>({
    queryKey: ["/api/links"],
    enabled: !!user,
  });

  // Query for ad settings
  const { data: adSettings } = useQuery<AdSettings>({
    queryKey: ["/api/settings/ads"],
  });

  const { data: unlockStatus, refetch: refetchUnlockStatus } = useQuery<{ unlocked: boolean; expiry: string | null }>({
    queryKey: [`/api/analytics/${selectedLinkId}/unlock-status`],
    enabled: !!selectedLinkId && !!user,
    refetchInterval: 30000,
    staleTime: 5000,
  });

  const serverExpiry = unlockStatus?.expiry ? new Date(unlockStatus.expiry) : null;
  const expiryValid = serverExpiry && serverExpiry.getTime() > Date.now();
  const serverUnlocked = unlockStatus?.unlocked && expiryValid;
  const isLinkForceLocked = selectedLinkId ? forceLockedLinks.has(selectedLinkId) : false;
  const isUnlocked = serverUnlocked && !isLinkForceLocked;

  useEffect(() => {
    if (!selectedLinkId || !unlockStatus?.expiry) {
      setCountdown("00:00:00");
      return;
    }

    const expiry = new Date(unlockStatus.expiry);
    const now = Date.now();
    const remaining = expiry.getTime() - now;

    if (remaining <= 0) {
      setForceLockedLinks(prev => new Set(prev).add(selectedLinkId));
      setCountdown("00:00:00");
      refetchUnlockStatus();
      return;
    }

    const timeoutId = setTimeout(() => {
      setForceLockedLinks(prev => new Set(prev).add(selectedLinkId));
      setCountdown("00:00:00");
      queryClient.setQueryData([`/api/analytics/${selectedLinkId}/unlock-status`], { unlocked: false, expiry: null });
      refetchUnlockStatus();
    }, remaining);

    const intervalId = setInterval(() => {
      const now = Date.now();
      const remaining = expiry.getTime() - now;
      if (remaining <= 0) {
        setCountdown("00:00:00");
      } else {
        setCountdown(formatCountdown(remaining));
      }
    }, 1000);

    setCountdown(formatCountdown(remaining));

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [selectedLinkId, unlockStatus?.expiry, refetchUnlockStatus]);

  useEffect(() => {
    if (links && links.length > 0 && !selectedLinkId) {
      setSelectedLinkId(links[0].id);
    }
  }, [links, selectedLinkId]);

  const selectedLink = links?.find((l) => l.id === selectedLinkId);
  const shortUrl = selectedLink
    ? `${window.location.origin}/${selectedLink.shortCode}`
    : "";

  useEffect(() => {
    if (shortUrl && canvasRef.current) {
      generateQR();
    }
  }, [shortUrl, fgColor, bgColor]);

  const generateQR = async () => {
    if (!canvasRef.current || !shortUrl) return;
    
    const QRCode = (await import("qrcode")).default;
    await QRCode.toCanvas(canvasRef.current, shortUrl, {
      width: 256,
      margin: 2,
      color: {
        dark: fgColor,
        light: bgColor,
      },
    });
  };

  const downloadQR = () => {
    if (!canvasRef.current || !isUnlocked) return;
    
    const link = document.createElement("a");
    link.download = `qr-${selectedLink?.shortCode || "code"}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

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
      setForceLockedLinks(prev => {
        const next = new Set(prev);
        next.delete(selectedLinkId);
        return next;
      });
      await queryClient.invalidateQueries({ queryKey: [`/api/analytics/${selectedLinkId}/unlock-status`] });
      await refetchUnlockStatus();
    } finally {
      setIsUnlocking(false);
    }
  };

  // Inject ad code when dialog opens
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

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

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

  return (
    <div className="min-h-screen py-8 px-4">
      <SEO 
        title="QR Codes"
        description="Generate and customize QR codes for your shortened links. Download high-quality QR codes with custom colors."
      />
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold mb-1">QR Codes</h1>
            <p className="text-muted-foreground">
              Generate custom QR codes for your links
            </p>
          </div>
          
          {isUnlocked && (
            <Badge variant="outline" className="gap-2" data-testid="qr-countdown-badge">
              <Clock className="w-4 h-4" />
              Download access expires in {countdown}
            </Badge>
          )}
        </div>

        {linksLoading ? (
          <Skeleton className="h-10 w-64 mb-8" />
        ) : links && links.length > 0 ? (
          <div className="mb-8">
            <label className="text-sm font-medium mb-2 block">Select Link</label>
            <Select value={selectedLinkId ?? ""} onValueChange={setSelectedLinkId}>
              <SelectTrigger className="w-full md:w-80" data-testid="select-qr-link">
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
                {selectedLink.originalUrl.slice(0, 50)}...
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        ) : (
          <Card className="mb-8">
            <CardContent className="py-12 text-center">
              <QrCode className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No links yet</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Create a link to generate QR codes.
              </p>
              <Link href="/">
                <Button data-testid="button-create-qr-link">Create a Link</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {selectedLinkId && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  QR Code Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="w-64 h-64 bg-white rounded-lg flex items-center justify-center mb-4 border">
                  <canvas ref={canvasRef} data-testid="qr-canvas" />
                </div>
                
                {!isUnlocked ? (
                  <div className="text-center">
                    <div className="flex items-center gap-2 text-muted-foreground mb-4">
                      <Lock className="w-4 h-4" />
                      <span className="text-sm">
                        Download requires unlock
                      </span>
                    </div>
                    <Button onClick={handleWatchAd} disabled={isUnlocking} data-testid="button-unlock-qr">
                      <Play className="w-4 h-4 mr-2" />
                      {isUnlocking ? "Unlocking..." : "Watch Ad to Unlock (1 hour)"}
                    </Button>
                  </div>
                ) : (
                  <Button onClick={downloadQR} className="w-full" data-testid="button-download-qr">
                    <Download className="w-4 h-4 mr-2" />
                    Download QR Code
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Customize Colors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="fg-color" className="mb-2 block">
                    Foreground Color
                  </Label>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-md border cursor-pointer"
                      style={{ backgroundColor: fgColor }}
                      onClick={() => document.getElementById("fg-color-picker")?.click()}
                    />
                    <Input
                      id="fg-color"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="flex-1"
                      data-testid="input-fg-color"
                    />
                    <input
                      id="fg-color-picker"
                      type="color"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="sr-only"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bg-color" className="mb-2 block">
                    Background Color
                  </Label>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-md border cursor-pointer"
                      style={{ backgroundColor: bgColor }}
                      onClick={() => document.getElementById("bg-color-picker")?.click()}
                    />
                    <Input
                      id="bg-color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="flex-1"
                      data-testid="input-bg-color"
                    />
                    <input
                      id="bg-color-picker"
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="sr-only"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Quick Presets</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { fg: "#000000", bg: "#ffffff", label: "Classic" },
                      { fg: "#1e40af", bg: "#dbeafe", label: "Blue" },
                      { fg: "#047857", bg: "#d1fae5", label: "Green" },
                      { fg: "#7c3aed", bg: "#ede9fe", label: "Purple" },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => {
                          setFgColor(preset.fg);
                          setBgColor(preset.bg);
                        }}
                        className="p-2 rounded-md border text-xs font-medium hover:bg-accent transition-colors"
                        style={{
                          background: `linear-gradient(135deg, ${preset.fg} 50%, ${preset.bg} 50%)`,
                        }}
                        title={preset.label}
                        data-testid={`preset-${preset.label.toLowerCase()}`}
                      >
                        <span className="sr-only">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t text-sm text-muted-foreground">
                  <p>
                    Tip: For best scanning results, use high contrast colors.
                    Dark foreground on light background works best.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <AdDisplay placement="footer" className="mt-8" />
      </div>

      {/* Rewarded Ad Dialog */}
      <Dialog open={adDialogOpen} onOpenChange={setAdDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Watch Ad to Unlock</DialogTitle>
            <DialogDescription>
              Watch the ad below to unlock QR code downloads for 1 hour.
            </DialogDescription>
          </DialogHeader>
          <div 
            ref={adContainerRef} 
            className="min-h-[200px] flex items-center justify-center bg-muted rounded-md"
            data-testid="ad-container-qr"
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

export default function QrCodesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
      <QrCodesContent />
    </Suspense>
  );
}
