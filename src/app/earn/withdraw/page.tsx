"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UserBalance {
  balanceUsd: string;
  faucetpayEmail: string | null;
}

interface WithdrawalRequest {
  id: string;
  amountUsd: string;
  coinType: string;
  faucetpayEmail: string;
  status: string;
  adminNotes: string | null;
  txHash: string | null;
  requestedAt: string;
  processedAt: string | null;
}

export default function WithdrawPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [coinType, setCoinType] = useState("");
  const [faucetpayEmail, setFaucetpayEmail] = useState("");

  const { data: balance, isLoading: balanceLoading } = useQuery<UserBalance>({
    queryKey: ["/api/earning/balance"],
    enabled: !!user,
  });

  const { data: withdrawals = [], isLoading: withdrawalsLoading } = useQuery<WithdrawalRequest[]>({
    queryKey: ["/api/withdrawals"],
    enabled: !!user,
  });

  const { data: settings = {} } = useQuery<Record<string, string>>({
    queryKey: ["/api/earning/settings"],
  });

  const updateEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      await apiRequest("PATCH", "/api/earning/faucetpay-email", { email });
    },
    onSuccess: () => {
      toast({ title: "Email updated", description: "Your FaucetPay email has been saved." });
      queryClient.invalidateQueries({ queryKey: ["/api/earning/balance"] });
    },
    onError: (error: Error) => {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async ({ amountUsd, coinType }: { amountUsd: string; coinType: string }) => {
      await apiRequest("POST", "/api/withdrawals", { amountUsd, coinType });
    },
    onSuccess: () => {
      toast({ title: "Withdrawal requested", description: "Your withdrawal is pending admin approval." });
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/earning/balance"] });
      setAmount("");
      setCoinType("");
    },
    onError: (error: Error) => {
      toast({ title: "Withdrawal failed", description: error.message, variant: "destructive" });
    },
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Withdraw</h1>
        <p className="text-muted-foreground mb-6">Please log in to withdraw funds.</p>
        <Link href="/login">
          <Button data-testid="button-login">Log In</Button>
        </Link>
      </div>
    );
  }

  const availableBalance = parseFloat(balance?.balanceUsd || "0");
  const minWithdrawal = parseFloat(settings.minWithdrawal || "1.00");
  const supportedCoins = (settings.supportedCoins || "BTC,ETH,DOGE,LTC,USDT,TRX").split(",");
  const hasPendingWithdrawal = withdrawals.some(w => w.status === "pending");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="border-blue-500 text-blue-500"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "paid":
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/earn" className="text-primary hover:underline text-sm mb-2 inline-block">
          ← Back to Earn
        </Link>
        <h1 className="text-3xl font-bold mb-2">Withdraw Funds</h1>
        <p className="text-muted-foreground">Withdraw your earnings via FaucetPay.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600" data-testid="text-available-balance">
              ${balanceLoading ? "..." : availableBalance.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Minimum withdrawal: ${minWithdrawal.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>FaucetPay Email</CardTitle>
            <CardDescription>Your FaucetPay account email for receiving payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="your@faucetpay.email"
                value={faucetpayEmail || balance?.faucetpayEmail || ""}
                onChange={(e) => setFaucetpayEmail(e.target.value)}
                data-testid="input-faucetpay-email"
              />
              <Button 
                onClick={() => updateEmailMutation.mutate(faucetpayEmail)}
                disabled={!faucetpayEmail || updateEmailMutation.isPending}
                data-testid="button-save-email"
              >
                Save
              </Button>
            </div>
            {balance?.faucetpayEmail && (
              <p className="text-sm text-muted-foreground mt-2">
                Current: {balance.faucetpayEmail}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Request Withdrawal</CardTitle>
          <CardDescription>Choose your amount and cryptocurrency</CardDescription>
        </CardHeader>
        <CardContent>
          {!balance?.faucetpayEmail ? (
            <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Please set your FaucetPay email above before requesting a withdrawal.
              </p>
            </div>
          ) : hasPendingWithdrawal ? (
            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
              <p className="text-sm text-blue-800 dark:text-blue-200">
                You have a pending withdrawal. Please wait for it to be processed.
              </p>
            </div>
          ) : availableBalance < minWithdrawal ? (
            <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                You need at least ${minWithdrawal.toFixed(2)} to withdraw.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount (USD)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min={minWithdrawal}
                  max={availableBalance}
                  placeholder={`Min: $${minWithdrawal.toFixed(2)}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  data-testid="input-withdraw-amount"
                />
              </div>
              <div>
                <Label htmlFor="coin">Cryptocurrency</Label>
                <Select value={coinType} onValueChange={setCoinType}>
                  <SelectTrigger data-testid="select-coin-type">
                    <SelectValue placeholder="Select coin" />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedCoins.map((coin) => (
                      <SelectItem key={coin} value={coin}>{coin}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                onClick={() => withdrawMutation.mutate({ amountUsd: amount, coinType })}
                disabled={!amount || !coinType || parseFloat(amount) < minWithdrawal || parseFloat(amount) > availableBalance || withdrawMutation.isPending}
                data-testid="button-request-withdrawal"
              >
                <Wallet className="mr-2 h-4 w-4" />
                {withdrawMutation.isPending ? "Processing..." : "Request Withdrawal"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Withdrawal History</CardTitle>
          <CardDescription>Track your withdrawal requests</CardDescription>
        </CardHeader>
        <CardContent>
          {withdrawalsLoading ? (
            <p className="text-muted-foreground text-center py-4">Loading...</p>
          ) : withdrawals.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No withdrawal requests yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">${parseFloat(withdrawal.amountUsd).toFixed(2)} - {withdrawal.coinType}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(withdrawal.requestedAt).toLocaleString()}
                      {withdrawal.txHash && (
                        <span className="ml-2">TX: {withdrawal.txHash.slice(0, 10)}...</span>
                      )}
                    </p>
                    {withdrawal.adminNotes && (
                      <p className="text-xs text-muted-foreground mt-1">Note: {withdrawal.adminNotes}</p>
                    )}
                  </div>
                  {getStatusBadge(withdrawal.status)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
