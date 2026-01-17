"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AdDisplay } from "@/components/ad-display";
import { BookOpen, Calendar, ArrowLeft, Clock } from "lucide-react";
import type { BlogPost } from "@shared/schema";
import { format } from "date-fns";

export default function BlogPostPage() {
  const params = useParams<{ slug: string }>();

  const { data: post, isLoading, error } = useQuery<BlogPost>({
    queryKey: ["/api/blog", params.slug],
  });

  const readingTime = post
    ? Math.ceil(post.content.split(/\s+/).length / 200)
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <Skeleton className="h-8 w-24 mb-8" />
          <Skeleton className="h-64 w-full rounded-lg mb-8" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/3 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Post not found</h3>
              <p className="text-muted-foreground mb-6">
                The blog post you're looking for doesn't exist or has been removed.
              </p>
              <Link href="/blog">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Blog
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <article className="max-w-3xl mx-auto">
        <Link href="/blog">
          <Button variant="ghost" size="sm" className="mb-8" data-testid="button-back-blog">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Button>
        </Link>

        {post.featuredImage ? (
          <div
            className="h-64 md:h-80 rounded-lg bg-cover bg-center mb-8"
            style={{ backgroundImage: `url(${post.featuredImage})` }}
          />
        ) : (
          <div className="h-64 md:h-80 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-8">
            <BookOpen className="w-16 h-16 text-primary/40" />
          </div>
        )}

        <Badge variant="secondary" className="mb-4">Blog</Badge>

        <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
          {post.title}
        </h1>

        <div className="flex items-center gap-4 text-muted-foreground mb-8 pb-8 border-b">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {post.createdAt
              ? format(new Date(post.createdAt), "MMMM d, yyyy")
              : "No date"}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {readingTime} min read
          </div>
        </div>

        <div
          className="prose prose-lg dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
          data-testid="post-content"
        />

        <AdDisplay placement="in-content" className="my-8" />

        <div className="mt-12 pt-8 border-t">
          <Link href="/blog">
            <Button variant="outline" data-testid="button-more-posts">
              <ArrowLeft className="w-4 h-4 mr-2" />
              More Posts
            </Button>
          </Link>
        </div>
      </article>
    </div>
  );
}
