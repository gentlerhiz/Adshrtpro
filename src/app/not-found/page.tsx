import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, Link2 } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-12 pb-8 text-center">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Link2 className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="font-heading text-4xl font-bold mb-2">404</h1>
          <h2 className="font-heading text-xl font-semibold mb-4">Page Not Found</h2>
          <p className="text-muted-foreground mb-8">
            The page you're looking for doesn't exist or the link may have been removed.
          </p>
          <Link href="/">
            <Button data-testid="button-go-home">
              <Home className="w-4 h-4 mr-2" />
              Go to Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
