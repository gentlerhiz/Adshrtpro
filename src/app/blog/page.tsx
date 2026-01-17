"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AdDisplay } from "@/components/ad-display";
import { SEO } from "@/components/seo";
import { EmptyState } from "@/components/empty-state";
import { BookOpen, Calendar, ArrowRight } from "lucide-react";
import type { BlogPost } from "@shared/schema";
import { format } from "date-fns";

export default function BlogPage() {
  const { data: posts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog"],
  });

  const publishedPosts = posts?.filter((p) => p.isPublished) ?? [];

  return (
    <div className="min-h-screen py-12 px-4">
      <SEO 
        title="Blog"
        description="Tips, tricks, and insights on URL shortening, link management, and digital marketing strategies."
      />
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            Blog
          </Badge>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
            Insights & Updates
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tips, tricks, and insights on URL shortening, link management, 
            and digital marketing strategies.
          </p>
        </div>

        <AdDisplay placement="header" className="mb-8" />

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-48 rounded-t-lg" />
                <CardContent className="pt-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : publishedPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publishedPosts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}>
                <Card className="h-full hover-elevate cursor-pointer group" data-testid={`card-post-${post.id}`}>
                  {post.featuredImage ? (
                    <div
                      className="h-48 rounded-t-lg bg-cover bg-center"
                      style={{ backgroundImage: `url(${post.featuredImage})` }}
                    />
                  ) : (
                    <div className="h-48 rounded-t-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-primary/40" />
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Calendar className="w-4 h-4" />
                      {post.createdAt
                        ? format(new Date(post.createdAt), "MMM d, yyyy")
                        : "No date"}
                    </div>
                    <CardTitle className="font-heading text-xl line-clamp-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                      {post.excerpt || post.content.slice(0, 150)}...
                    </p>
                    <span className="text-primary text-sm font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                      Read more
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No posts yet</h3>
              <p className="text-muted-foreground">
                Check back soon for new articles and updates.
              </p>
            </CardContent>
          </Card>
        )}

        <AdDisplay placement="footer" className="mt-12" />
      </div>
    </div>
  );
}
