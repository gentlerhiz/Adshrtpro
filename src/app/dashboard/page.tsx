"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Link2,
  BarChart3,
  Copy,
  Check,
  ExternalLink,
  MoreHorizontal,
  Trash2,
  QrCode,
  Plus,
  Search,
  AlertCircle,
  Upload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import type { Link as LinkType } from "@shared/schema";
import { format } from "date-fns";
import { SponsoredCarousel } from "@/components/sponsored-carousel";
import { AdDisplay } from "@/components/ad-display";
import { SEO } from "@/components/seo";
import { EmptyState } from "@/components/empty-state";
import { Pagination, usePagination } from "@/components/pagination";

const ITEMS_PER_PAGE = 10;

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newAlias, setNewAlias] = useState("");
  const [bulkUrls, setBulkUrls] = useState("");
  const [bulkResults, setBulkResults] = useState<Array<{
    originalUrl: string;
    shortUrl?: string;
    shortCode?: string;
    error?: string;
    success: boolean;
  }> | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: links, isLoading } = useQuery<LinkType[]>({
    queryKey: ["/api/links"],
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (data: { originalUrl: string; shortCode?: string }) => {
      const response = await apiRequest("POST", "/api/links", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/links"] });
      toast({
        title: "Link created",
        description: "Your new short link is ready.",
      });
      setShowCreateDialog(false);
      setNewUrl("");
      setNewAlias("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create link.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/links/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/links"] });
      toast({
        title: "Link deleted",
        description: "The link has been removed.",
      });
      setDeleteId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete link.",
        variant: "destructive",
      });
    },
  });

  const bulkMutation = useMutation({
    mutationFn: async (urls: string[]) => {
      const response = await apiRequest("POST", "/api/links/bulk", { urls });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to import links");
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/links"] });
      setBulkResults(data.results);
      toast({
        title: "Bulk import complete",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to import links.",
        variant: "destructive",
      });
    },
  });

  const handleBulkImport = () => {
    const urls = bulkUrls
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url.length > 0);
    
    if (urls.length === 0) {
      toast({
        title: "Error",
        description: "Please enter at least one URL.",
        variant: "destructive",
      });
      return;
    }

    if (urls.length > 50) {
      toast({
        title: "Error",
        description: "Maximum 50 URLs allowed per import.",
        variant: "destructive",
      });
      return;
    }

    setBulkResults(null);
    bulkMutation.mutate(urls);
  };

  const resetBulkDialog = () => {
    setShowBulkDialog(false);
    setBulkUrls("");
    setBulkResults(null);
  };

  const copyToClipboard = async (shortCode: string, id: string) => {
    const shortUrl = `${window.location.origin}/${shortCode}`;
    await navigator.clipboard.writeText(shortUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: "Copied!",
      description: "Link copied to clipboard.",
    });
  };

  const filteredLinks = links?.filter(
    (link) =>
      link.shortCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.originalUrl.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const { totalPages, getPageItems } = usePagination(filteredLinks || [], ITEMS_PER_PAGE);
  const paginatedLinks = getPageItems(currentPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <SEO 
        title="Dashboard"
        description="Manage your shortened links, view analytics, and create new short URLs."
      />
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold mb-1">Dashboard</h1>
            <p className="text-muted-foreground">Manage your shortened links</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button data-testid="button-bulk-import" variant="outline" onClick={() => setShowBulkDialog(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Bulk Import
            </Button>
            <Button data-testid="button-new-link" onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Link
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Links
              </CardTitle>
              <Link2 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{links?.length ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Links
              </CardTitle>
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {links?.filter((l) => !l.isDisabled).length ?? 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                QR Codes
              </CardTitle>
              <QrCode className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{links?.length ?? 0}</p>
            </CardContent>
          </Card>
        </div>

        <SponsoredCarousel />

        <AdDisplay placement="header" className="mb-6" />

        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center gap-4">
            <CardTitle className="font-heading text-xl flex-1">Your Links</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search links..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-links"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : !links || links.length === 0 ? (
              <EmptyState 
                type="links" 
                onAction={() => setShowCreateDialog(true)}
              />
            ) : filteredLinks && filteredLinks.length > 0 ? (
              <>
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Short Link</TableHead>
                        <TableHead>Original URL</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedLinks.map((link) => (
                        <TableRow key={link.id} data-testid={`row-link-${link.id}`}>
                          <TableCell>
                            <a
                              href={`/${link.shortCode}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-primary hover:underline flex items-center gap-1"
                            >
                              /{link.shortCode}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-muted-foreground">
                            {link.originalUrl}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {link.createdAt
                              ? format(new Date(link.createdAt), "MMM d, yyyy")
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={link.isDisabled ? "secondary" : "default"}>
                              {link.isDisabled ? "Disabled" : "Active"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => copyToClipboard(link.shortCode, link.id)}
                                data-testid={`button-copy-${link.id}`}
                              >
                                {copiedId === link.id ? (
                                  <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" data-testid={`button-actions-${link.id}`}>
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <Link href={`/analytics?link=${link.id}`}>
                                    <DropdownMenuItem>
                                      <BarChart3 className="w-4 h-4 mr-2" />
                                      View Analytics
                                    </DropdownMenuItem>
                                  </Link>
                                  <Link href={`/qr-codes?link=${link.id}`}>
                                    <DropdownMenuItem>
                                      <QrCode className="w-4 h-4 mr-2" />
                                      QR Code
                                    </DropdownMenuItem>
                                  </Link>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => setDeleteId(link.id)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="md:hidden space-y-4">
                  {paginatedLinks.map((link) => (
                    <Card key={link.id} className="overflow-visible">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1 min-w-0">
                            <a
                              href={`/${link.shortCode}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-primary hover:underline flex items-center gap-1"
                            >
                              /{link.shortCode}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            <p className="text-sm text-muted-foreground truncate mt-1">
                              {link.originalUrl}
                            </p>
                          </div>
                          <Badge variant={link.isDisabled ? "secondary" : "default"}>
                            {link.isDisabled ? "Disabled" : "Active"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {link.createdAt
                              ? format(new Date(link.createdAt), "MMM d, yyyy")
                              : "-"}
                          </span>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyToClipboard(link.shortCode, link.id)}
                            >
                              {copiedId === link.id ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                            <Link href={`/analytics?link=${link.id}`}>
                              <Button variant="ghost" size="icon">
                                <BarChart3 className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Link href={`/qr-codes?link=${link.id}`}>
                              <Button variant="ghost" size="icon">
                                <QrCode className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(link.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-6">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">No matching links</h3>
                <p className="text-muted-foreground text-sm">
                  No links match your search for "{searchQuery}".
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this link?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The short link will stop working
                and all analytics data will be lost.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                data-testid="button-confirm-delete"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Link</DialogTitle>
              <DialogDescription>
                Shorten a long URL to make it easier to share.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-url">URL to shorten</Label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="new-url"
                    placeholder="https://example.com/your-long-url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="pl-10"
                    data-testid="input-new-url"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-alias">Custom alias (optional)</Label>
                <Input
                  id="new-alias"
                  placeholder="my-custom-link"
                  value={newAlias}
                  onChange={(e) => setNewAlias(e.target.value)}
                  data-testid="input-new-alias"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for auto-generated short code
                </p>
              </div>
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 dark:text-amber-400">
                  Adult, illegal, or harmful content is strictly prohibited. Violating links will be removed and accounts may be banned.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!newUrl) return;
                  createMutation.mutate({
                    originalUrl: newUrl,
                    shortCode: newAlias || undefined,
                  });
                }}
                disabled={!newUrl || createMutation.isPending}
                data-testid="button-create-link"
              >
                {createMutation.isPending ? "Creating..." : "Create Link"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showBulkDialog} onOpenChange={(open) => !open && resetBulkDialog()}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Bulk Import Links</DialogTitle>
              <DialogDescription>
                Paste multiple URLs (one per line) to shorten them all at once. Maximum 50 URLs.
              </DialogDescription>
            </DialogHeader>
            
            {!bulkResults ? (
              <div className="space-y-4 py-4 flex-1 overflow-auto">
                <div className="space-y-2">
                  <Label htmlFor="bulk-urls">URLs to shorten</Label>
                  <Textarea
                    id="bulk-urls"
                    placeholder={"https://example.com/page1\nhttps://example.com/page2\nhttps://example.com/page3"}
                    value={bulkUrls}
                    onChange={(e) => setBulkUrls(e.target.value)}
                    className="min-h-[200px] font-mono text-sm"
                    data-testid="input-bulk-urls"
                  />
                  <p className="text-xs text-muted-foreground">
                    {bulkUrls.split("\n").filter((u) => u.trim()).length} URLs entered
                  </p>
                </div>
                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 dark:text-amber-400">
                    Adult, illegal, or harmful content is strictly prohibited. Violating links will be removed and accounts may be banned.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-4 flex-1 overflow-auto">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>{bulkResults.filter((r) => r.success).length} succeeded</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-destructive" />
                    <span>{bulkResults.filter((r) => !r.success).length} failed</span>
                  </div>
                </div>
                
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {bulkResults.map((result, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-md border text-sm ${
                        result.success
                          ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900"
                          : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900"
                      }`}
                      data-testid={`bulk-result-${index}`}
                    >
                      <div className="flex items-start gap-2">
                        {result.success ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-muted-foreground">{result.originalUrl}</p>
                          {result.success && result.shortUrl && (
                            <div className="flex items-center gap-2 mt-1">
                              <a
                                href={result.shortUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary font-medium hover:underline truncate"
                              >
                                {result.shortUrl}
                              </a>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="shrink-0"
                                onClick={() => {
                                  navigator.clipboard.writeText(result.shortUrl!);
                                  toast({
                                    title: "Copied!",
                                    description: "Link copied to clipboard.",
                                  });
                                }}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                          {result.error && (
                            <p className="text-destructive text-xs mt-1">{result.error}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter className="shrink-0">
              {!bulkResults ? (
                <>
                  <Button variant="outline" onClick={resetBulkDialog}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleBulkImport}
                    disabled={!bulkUrls.trim() || bulkMutation.isPending}
                    data-testid="button-start-bulk-import"
                  >
                    {bulkMutation.isPending ? "Importing..." : "Import Links"}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setBulkResults(null);
                      setBulkUrls("");
                    }}
                  >
                    Import More
                  </Button>
                  <Button onClick={resetBulkDialog} data-testid="button-close-bulk-dialog">
                    Done
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
