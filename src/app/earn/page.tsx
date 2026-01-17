"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { DollarSign, Gift, Users, Wallet, ExternalLink, ClipboardList, ArrowUpRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { SEO } from "@/components/seo";

interface UserBalance {
  balanceUsd: string;
  totalEarned: string;
  totalWithdrawn: string;
  faucetpayEmail: string | null;
}

interface Transaction {
  id: string;
  type: string;
  amount: string;
  description: string;
  network: string | null;
  createdAt: string;
}

export default function EarnPage() {
  const { user } = useAuth();

  const { data: balance, isLoading: balanceLoading } = useQuery<UserBalance>({
    queryKey: ["/api/earning/balance"],
    enabled: !!user,
  });

  const { data: transactions = [], isLoading: txLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/earning/transactions"],
    enabled: !!user,
  });

  const { data: settings = {} } = useQuery<Record<string, string>>({
    queryKey: ["/api/earning/settings"],
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Earn Rewards</h1>
        <p className="text-muted-foreground mb-6">Please log in to access earning features.</p>
        <Link href="/login">
          <Button data-testid="button-login">Log In</Button>
        </Link>
      </div>
    );
  }

  const balanceUsd = parseFloat(balance?.balanceUsd || "0").toFixed(2);
  const totalEarned = parseFloat(balance?.totalEarned || "0").toFixed(2);
  const totalWithdrawn = parseFloat(balance?.totalWithdrawn || "0").toFixed(2);

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO 
        title="Earn Rewards"
        description="Complete offers, tasks, and refer friends to earn real money. Withdraw via cryptocurrency."
      />
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Earn Rewards</h1>
        <p className="text-muted-foreground">Complete offers, tasks, and refer friends to earn USD.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-balance">${balanceLoading ? "..." : balanceUsd}</div>
            <p className="text-xs text-muted-foreground">Available to withdraw</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-total-earned">${totalEarned}</div>
            <p className="text-xs text-muted-foreground">Lifetime earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Withdrawn</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-withdrawn">${totalWithdrawn}</div>
            <p className="text-xs text-muted-foreground">Total paid out</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Min. Withdrawal</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${settings.minWithdrawal || "1.00"}</div>
            <p className="text-xs text-muted-foreground">Minimum to withdraw</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className="hover-elevate">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Offerwalls
            </CardTitle>
            <CardDescription>Complete offers to earn rewards</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Complete surveys, install apps, and finish offers from our partner networks to earn USD.
            </p>
            <Link href="/earn/offerwalls">
              <Button className="w-full" data-testid="button-offerwalls">View Offers</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Tasks
            </CardTitle>
            <CardDescription>Complete tasks with proof</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Follow social accounts, join groups, and complete manual tasks for rewards.
            </p>
            <Link href="/earn/tasks">
              <Button className="w-full" data-testid="button-tasks">View Tasks</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Referrals
            </CardTitle>
            <CardDescription>Invite friends to earn</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Share your referral link and earn ${settings.referralReward || "0.10"} for each valid referral.
            </p>
            <Link href="/earn/referrals">
              <Button className="w-full" data-testid="button-referrals">View Referrals</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center mb-8">
        <Link href="/earn/withdraw">
          <Button size="lg" data-testid="button-withdraw">
            <Wallet className="mr-2 h-5 w-5" />
            Withdraw Funds
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your earning and withdrawal history</CardDescription>
        </CardHeader>
        <CardContent>
          {txLoading ? (
            <p className="text-muted-foreground text-center py-4">Loading...</p>
          ) : transactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 10).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Badge variant={parseFloat(tx.amount) > 0 ? "default" : "secondary"}>
                      {tx.type}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className={`font-bold ${parseFloat(tx.amount) > 0 ? "text-green-600" : "text-red-600"}`}>
                    {parseFloat(tx.amount) > 0 ? "+" : ""}${parseFloat(tx.amount).toFixed(4)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
