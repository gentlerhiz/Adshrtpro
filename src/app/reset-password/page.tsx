"use client";

import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { resetPasswordSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Link2, Loader2, Lock, CheckCircle } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const uid = searchParams.get("uid") || "";
  const [success, setSuccess] = useState(false);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: token,
      password: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ResetPasswordInput) => {
      const response = await apiRequest("POST", "/api/auth/reset-password", { ...data, uid });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to reset password");
      }
      return response.json();
    },
    onSuccess: () => {
      setSuccess(true);
      toast({
        title: "Password reset successful",
        description: "You can now log in with your new password.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password. The link may have expired.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    mutation.mutate({ ...data, token });
  };

  if (!token || !uid) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="pt-6 text-center">
              <h2 className="text-xl font-bold mb-2">Invalid Reset Link</h2>
              <p className="text-muted-foreground mb-6">
                This password reset link is invalid or has expired.
              </p>
              <Link href="/forgot-password">
                <Button className="w-full" data-testid="button-request-new">
                  Request a new reset link
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 font-heading font-bold text-2xl mb-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Link2 className="w-6 h-6 text-primary-foreground" />
              </div>
              AdShrtPro
            </Link>
          </div>

          <Card>
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold mb-2">Password Reset Successful</h2>
              <p className="text-muted-foreground mb-6">
                Your password has been updated. You can now log in with your new password.
              </p>
              <Link href="/login">
                <Button className="w-full" data-testid="button-login">
                  Go to Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-heading font-bold text-2xl mb-4">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Link2 className="w-6 h-6 text-primary-foreground" />
            </div>
            AdShrtPro
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="font-heading text-2xl">Reset your password</CardTitle>
            <CardDescription>
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type="password"
                            placeholder="Enter new password"
                            className="pl-10 h-12"
                            data-testid="input-password"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-12 font-semibold"
                  disabled={mutation.isPending}
                  data-testid="button-submit"
                >
                  {mutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Reset password"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
