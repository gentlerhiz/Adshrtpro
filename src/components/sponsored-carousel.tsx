"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Megaphone,
  Info,
} from "lucide-react";
import type { SponsoredPost } from "@shared/schema";

function getVisitorId(): string {
  let visitorId = localStorage.getItem("sponsoredVisitorId");
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem("sponsoredVisitorId", visitorId);
  }
  return visitorId;
}

export function SponsoredCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reactions, setReactions] = useState<Record<string, string | null>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, { likes: number; dislikes: number }>>({});
  const [isPaused, setIsPaused] = useState(false);
  const visitorId = getVisitorId();

  const { data: posts, isLoading } = useQuery<SponsoredPost[]>({
    queryKey: ["/api/sponsored-posts"],
  });

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setCurrentIndex(emblaApi.selectedScrollSnap());
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };

    emblaApi.on("select", onSelect);
    onSelect();

    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi || isPaused || !posts || posts.length <= 1) return;

    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [emblaApi, isPaused, posts]);

  useEffect(() => {
    if (posts) {
      posts.forEach((post) => {
        setLikeCounts((prev) => ({
          ...prev,
          [post.id]: { likes: post.likes ?? 0, dislikes: post.dislikes ?? 0 },
        }));
      });

      posts.forEach(async (post) => {
        try {
          const res = await fetch(`/api/sponsored-posts/${post.id}/reaction?visitorId=${visitorId}`);
          const data = await res.json();
          if (data.reaction) {
            setReactions((prev) => ({ ...prev, [post.id]: data.reaction }));
          }
        } catch {
        }
      });
    }
  }, [posts, visitorId]);

  const reactMutation = useMutation({
    mutationFn: async ({ postId, reaction }: { postId: string; reaction: string }) => {
      const res = await apiRequest("POST", `/api/sponsored-posts/${postId}/react`, {
        reaction,
        visitorId,
      });
      return res.json();
    },
    onSuccess: (data, variables) => {
      setReactions((prev) => ({ ...prev, [variables.postId]: variables.reaction }));
      setLikeCounts((prev) => ({
        ...prev,
        [variables.postId]: { likes: data.likes, dislikes: data.dislikes },
      }));
    },
  });

  const trackClick = async (postId: string) => {
    try {
      await apiRequest("POST", `/api/sponsored-posts/${postId}/click`, {});
    } catch {
    }
  };

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6 overflow-visible">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Megaphone className="h-4 w-4" />
            <span>Sponsored</span>
          </div>
          {posts.length > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={scrollPrev}
                disabled={!canScrollPrev}
                className="h-7 w-7"
                data-testid="button-carousel-prev"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground min-w-8 text-center">
                {currentIndex + 1}/{posts.length}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={scrollNext}
                disabled={!canScrollNext}
                className="h-7 w-7"
                data-testid="button-carousel-next"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div 
          ref={emblaRef} 
          className="overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="flex">
            {posts.map((post) => (
              <div key={post.id} className="flex-[0_0_100%] min-w-0">
                <div className="flex flex-col sm:flex-row gap-4">
                  {post.bannerUrl && (
                    <div className="sm:w-1/3 flex-shrink-0">
                      <img
                        src={post.bannerUrl}
                        alt={post.title}
                        className="w-full h-32 object-cover rounded-md"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      {post.logoUrl && (
                        <img
                          src={post.logoUrl}
                          alt=""
                          className="w-10 h-10 object-contain rounded-md flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate" data-testid={`text-sponsored-title-${post.id}`}>
                          {post.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {post.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <Link href={`/sponsor/${post.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          data-testid={`button-sponsored-details-${post.id}`}
                        >
                          <Info className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                      </Link>
                      {post.websiteUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            trackClick(post.id);
                            window.open(post.websiteUrl!, "_blank");
                          }}
                          data-testid={`button-sponsored-visit-${post.id}`}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Visit
                        </Button>
                      )}
                      <div className="flex items-center gap-1 ml-auto">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => reactMutation.mutate({ postId: post.id, reaction: "like" })}
                          className={reactions[post.id] === "like" ? "text-green-600" : ""}
                          data-testid={`button-sponsored-like-${post.id}`}
                        >
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          {likeCounts[post.id]?.likes ?? post.likes ?? 0}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => reactMutation.mutate({ postId: post.id, reaction: "dislike" })}
                          className={reactions[post.id] === "dislike" ? "text-red-600" : ""}
                          data-testid={`button-sponsored-dislike-${post.id}`}
                        >
                          <ThumbsDown className="h-3 w-3 mr-1" />
                          {likeCounts[post.id]?.dislikes ?? post.dislikes ?? 0}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
