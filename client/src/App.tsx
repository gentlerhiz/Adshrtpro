import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-context";
import { AuthProvider } from "@/lib/auth-context";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { ErrorBoundary } from "@/components/error-boundary";
import { HelmetProvider } from "react-helmet-async";
import HomePage from "@/pages/home";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import VerifyEmailPage from "@/pages/verify-email";
import DashboardPage from "@/pages/dashboard";
import AnalyticsPage from "@/pages/analytics";
import QrCodesPage from "@/pages/qr-codes";
import BlogPage from "@/pages/blog";
import BlogPostPage from "@/pages/blog-post";
import AdminPage from "@/pages/admin/index";
import BlogEditorPage from "@/pages/admin/blog-editor";
import AdminEarningPage from "@/pages/admin/earning";
import SponsorDetailPage from "@/pages/sponsor-detail";
import PrivacyPage from "@/pages/privacy";
import TermsPage from "@/pages/terms";
import ContactPage from "@/pages/contact";
import NotFound from "@/pages/not-found";
import EarnPage from "@/pages/earn";
import OfferwallsPage from "@/pages/earn/offerwalls";
import TasksPage from "@/pages/earn/tasks";
import ReferralsPage from "@/pages/earn/referrals";
import WithdrawPage from "@/pages/earn/withdraw";
import SocialsPage from "@/pages/socials";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import ProfilePage from "@/pages/profile";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/verify-email" component={VerifyEmailPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/qr-codes" component={QrCodesPage} />
      <Route path="/earn" component={EarnPage} />
      <Route path="/earn/offerwalls" component={OfferwallsPage} />
      <Route path="/earn/tasks" component={TasksPage} />
      <Route path="/earn/referrals" component={ReferralsPage} />
      <Route path="/earn/withdraw" component={WithdrawPage} />
      <Route path="/blog" component={BlogPage} />
      <Route path="/blog/:slug" component={BlogPostPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/admin/earning" component={AdminEarningPage} />
      <Route path="/admin/blog/:id" component={BlogEditorPage} />
      <Route path="/sponsor/:id" component={SponsorDetailPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/socials" component={SocialsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <TooltipProvider>
              <ErrorBoundary>
                <div className="min-h-screen flex flex-col">
                  <Navigation />
                  <main className="flex-1">
                    <Router />
                  </main>
                  <Footer />
                </div>
              </ErrorBoundary>
              <Toaster />
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
