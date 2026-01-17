"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import {
  ArrowLeft,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Megaphone,
  Globe,
  Calendar,
  Eye,
  MousePointer,
  Loader2,
} from "lucide-react";
import type { SponsoredPost } from "@shared/schema";
import { format } from "date-fns";

function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  let visitorId = localStorage.getItem("sponsoredVisitorId");
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem("sponsoredVisitorId", visitorId);
  }
  return visitorId;
}

function SponsorDetailContent() {
  const params = useParams();
  const sponsorId = params?.id as string;
  const [visitorId, setVisitorId] = useState<string>("");
  const [reaction, setReaction] = useState<string | null>(null);
  const [likeCounts, setLikeCounts] = useState<{ likes: number; dislikes: number }>({ likes: 0, dislikes: 0 });

  // Initialize visitorId on client side only
  useEffect(() => {
    setVisitorId(getVisitorId());
  }, []);

  const { data: post, isLoading, error } = useQuery<SponsoredPost>({
    queryKey: ["/api/sponsored-posts", sponsorId],
    enabled: !!sponsorId,
  });

  useEffect(() => {
    if (post) {
      setLikeCounts({ likes: post.likes ?? 0, dislikes: post.dislikes ?? 0 });
      
      // Fetch user's existing reaction
      fetch(`/api/sponsored-posts/${post.id}/reaction?visitorId=${visitorId}`)
        .then(res => res.json())
        .then(data => {
          if (data.reaction) {
            setReaction(data.reaction);
          }
        })
        .catch(console.error);
    }
  }, [post, visitorId]);

  const reactionMutation = useMutation({
    mutationFn: async (newReaction: string) => {
      const response = await apiRequest("POST", `/api/sponsored-posts/${sponsorId}/react`, {
        reaction: newReaction,
        visitorId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setLikeCounts({ likes: data.likes, dislikes: data.dislikes });
    },
  });

  const trackClick = async () => {
    try {
      await apiRequest("POST", `/api/sponsored-posts/${sponsorId}/click`, {});
    } catch (e) {
      console.error("Failed to track click:", e);
    }
  };

  const handleReaction = (newReaction: string) => {
    if (reaction === newReaction) return;
    setReaction(newReaction);
    reactionMutation.mutate(newReaction);
  };

  const parseSocialLinks = (socialLinksStr: string | null): Record<string, string> => {
    if (!socialLinksStr) return {};
    try {
      return JSON.parse(socialLinksStr);
    } catch {
      return {};
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-64 w-full mb-6" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Sponsor Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The sponsor post you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const socialLinks = parseSocialLinks(post.socialLinks);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/">
          <Button variant="ghost" className="mb-6" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>

        <div className="flex items-center gap-2 mb-4">
          <Badge variant="secondary" className="gap-1">
            <Megaphone className="w-3 h-3" />
            Sponsored
          </Badge>
        </div>

        {post.bannerUrl && (
          <div className="mb-6 rounded-md overflow-hidden">
            <img
              src={post.bannerUrl}
              alt={post.title}
              className="w-full h-64 object-cover"
              data-testid="img-sponsor-banner"
            />
          </div>
        )}

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start gap-4">
              {post.logoUrl && (
                <img
                  src={post.logoUrl}
                  alt=""
                  className="w-16 h-16 object-contain rounded-md flex-shrink-0"
                  data-testid="img-sponsor-logo"
                />
              )}
              <div className="flex-1">
                <CardTitle className="font-heading text-2xl mb-2" data-testid="text-sponsor-title">
                  {post.title}
                </CardTitle>
                <p className="text-muted-foreground" data-testid="text-sponsor-description">
                  {post.description}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {post.content && (
              <div className="prose prose-sm dark:prose-invert max-w-none mb-6" data-testid="text-sponsor-content">
                {post.content.split('\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4 pt-4 border-t">
              {post.websiteUrl && (
                <Button
                  onClick={() => {
                    trackClick();
                    window.open(post.websiteUrl!, "_blank");
                  }}
                  data-testid="button-visit-website"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Visit Website
                </Button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant={reaction === "like" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleReaction("like")}
                  disabled={reactionMutation.isPending}
                  data-testid="button-like"
                >
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  {likeCounts.likes}
                </Button>
                <Button
                  variant={reaction === "dislike" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleReaction("dislike")}
                  disabled={reactionMutation.isPending}
                  data-testid="button-dislike"
                >
                  <ThumbsDown className="w-4 h-4 mr-1" />
                  {likeCounts.dislikes}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Sponsor Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Published:</span>
                <span>{post.createdAt ? format(new Date(post.createdAt), "MMM d, yyyy") : "N/A"}</span>
              </div>
              {post.startDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Campaign Start:</span>
                  <span>{format(new Date(post.startDate), "MMM d, yyyy")}</span>
                </div>
              )}
              {post.endDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Campaign End:</span>
                  <span>{format(new Date(post.endDate), "MMM d, yyyy")}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Engagement Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Views:</span>
                <span>{post.viewCount ?? 0}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MousePointer className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Clicks:</span>
                <span>{post.clickCount ?? 0}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ThumbsUp className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Likes:</span>
                <span>{likeCounts.likes}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {Object.keys(socialLinks).length > 0 && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Social Links
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(socialLinks).map(([platform, url]) => (
                  <Button
                    key={platform}
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(url, "_blank")}
                    data-testid={`button-social-${platform.toLowerCase()}`}
                  >
                    {platform}
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function SponsorDetailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <SponsorDetailContent />
    </Suspense>
  );
}