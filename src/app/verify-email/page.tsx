"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link2, Mail, CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react";

function VerifyEmailContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [verificationState, setVerificationState] = useState<"pending" | "success" | "error" | "waiting">(
    token ? "pending" : "waiting"
  );

  const verifyMutation = useMutation({
    mutationFn: async (verifyToken: string) => {
      await apiRequest("POST", "/api/auth/verify-email", { token: verifyToken });
    },
    onSuccess: () => {
      setVerificationState("success");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Email verified!",
        description: "Your account is now fully activated.",
      });
    },
    onError: () => {
      setVerificationState("error");
      toast({
        title: "Verification failed",
        description: "Invalid or expired verification link.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (token && verificationState === "pending") {
      verifyMutation.mutate(token);
    }
  }, [token]);

  const resendMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/resend-verification", {});
    },
    onSuccess: () => {
      toast({
        title: "Email sent!",
        description: "Check your inbox for the verification link.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Unable to send verification email. Please try again.",
        variant: "destructive",
      });
    },
  });

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
            {verificationState === "waiting" && (
              <>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="font-heading text-2xl">Check your email</CardTitle>
                <CardDescription>
                  We've sent a verification link to your email address.
                  Click the link to verify your account.
                </CardDescription>
              </>
            )}

            {verificationState === "pending" && (
              <>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
                <CardTitle className="font-heading text-2xl">Verifying...</CardTitle>
                <CardDescription>
                  Please wait while we verify your email address.
                </CardDescription>
              </>
            )}

            {verificationState === "success" && (
              <>
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="font-heading text-2xl">Email verified!</CardTitle>
                <CardDescription>
                  Your account has been activated. You can now access all features.
                </CardDescription>
              </>
            )}

            {verificationState === "error" && (
              <>
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-destructive" />
                </div>
                <CardTitle className="font-heading text-2xl">Verification failed</CardTitle>
                <CardDescription>
                  The verification link is invalid or has expired. Please request a new one.
                </CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {verificationState === "waiting" && (
              <>
                <p className="text-sm text-muted-foreground text-center">
                  Didn't receive the email? Check your spam folder or request a new one.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => resendMutation.mutate()}
                  disabled={resendMutation.isPending}
                  data-testid="button-resend"
                >
                  {resendMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Resend verification email
                </Button>
              </>
            )}

            {verificationState === "success" && (
              <Button
                className="w-full"
                onClick={() => router.push("/dashboard")}
                data-testid="button-go-dashboard"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}

            {verificationState === "error" && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => resendMutation.mutate()}
                disabled={resendMutation.isPending}
                data-testid="button-request-new"
              >
                {resendMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Request new verification link
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}