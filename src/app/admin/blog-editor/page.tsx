"use client";

import { useState, useEffect, Suspense } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertBlogPostSchema, type InsertBlogPost, type BlogPost } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ArrowLeft, Save, Loader2, Eye } from "lucide-react";

function BlogEditorContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const isNew = params.id === "new";
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client before checking auth
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Redirect non-admin users
  useEffect(() => {
    if (isClient && user !== undefined && !user?.isAdmin) {
      router.push("/");
    }
  }, [isClient, user, router]);

  const { data: post, isLoading } = useQuery<BlogPost>({
    queryKey: ["/api/admin/blog", params.id],
    enabled: !isNew,
  });

  const form = useForm<InsertBlogPost>({
    resolver: zodResolver(insertBlogPostSchema),
    defaultValues: {
      title: "",
      slug: "",
      content: "",
      excerpt: "",
      featuredImage: "",
      isPublished: false,
    },
  });

  useEffect(() => {
    if (post) {
      form.reset({
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt ?? "",
        featuredImage: post.featuredImage ?? "",
        isPublished: post.isPublished ?? false,
      });
    }
  }, [post]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertBlogPost) => {
      await apiRequest("POST", "/api/admin/blog", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog"] });
      toast({ title: "Post created!" });
      router.push("/admin");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertBlogPost) => {
      await apiRequest("PATCH", `/api/admin/blog/${params.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog"] });
      toast({ title: "Post updated!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertBlogPost) => {
    if (isNew) {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  // Show loading while checking auth on client
  if (!isClient || (user === undefined)) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!user?.isAdmin) {
    return null;
  }

  if (!isNew && isLoading) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-24 mb-8" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link href="/admin">
            <Button variant="ghost" data-testid="button-back-admin">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
          </Link>

          {!isNew && post?.isPublished && (
            <Link href={`/blog/${post.slug}`}>
              <Button variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                View Post
              </Button>
            </Link>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-2xl">
              {isNew ? "Create New Post" : "Edit Post"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter post title"
                          className="h-12 text-lg"
                          onChange={(e) => {
                            field.onChange(e);
                            if (isNew) {
                              form.setValue("slug", generateSlug(e.target.value));
                            }
                          }}
                          data-testid="input-post-title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">/blog/</span>
                          <Input
                            {...field}
                            placeholder="post-slug"
                            data-testid="input-post-slug"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="excerpt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Excerpt (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Brief summary of the post..."
                          rows={2}
                          data-testid="textarea-post-excerpt"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="featuredImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Featured Image URL (optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="https://example.com/image.jpg"
                          data-testid="input-post-image"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content (HTML supported)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Write your post content here..."
                          rows={15}
                          className="font-mono text-sm"
                          data-testid="textarea-post-content"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isPublished"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-3">
                        <FormControl>
                          <Switch
                            checked={field.value ?? false}
                            onCheckedChange={field.onChange}
                            data-testid="switch-post-published"
                          />
                        </FormControl>
                        <Label>Publish this post</Label>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center gap-4 pt-4 border-t">
                  <Button
                    type="submit"
                    disabled={isPending}
                    data-testid="button-save-post"
                  >
                    {isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {isNew ? "Create Post" : "Save Changes"}
                  </Button>
                  <Link href="/admin">
                    <Button variant="outline" type="button">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function BlogEditorPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <BlogEditorContent />
    </Suspense>
  );
}