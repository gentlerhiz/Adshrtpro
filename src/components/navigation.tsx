"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Link2,
  Menu,
  Moon,
  Sun,
  User,
  LayoutDashboard,
  BarChart3,
  QrCode,
  LogOut,
  Settings,
  BookOpen,
  DollarSign,
} from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";

export function Navigation() {
  const { user, logout, isLoading, isLoggingOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home", icon: Link2 },
    { href: "/blog", label: "Blog", icon: BookOpen },
  ];

  const userLinks = user
    ? [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/analytics", label: "Analytics", icon: BarChart3 },
        { href: "/qr-codes", label: "QR Codes", icon: QrCode },
        { href: "/earn", label: "Earn", icon: DollarSign },
      ]
    : [];

  const isActive = (href: string) => location === href;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-heading font-bold text-xl">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <Link2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span data-testid="text-brand-name">AdShrtPro</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={isActive(link.href) ? "secondary" : "ghost"}
                  size="sm"
                  data-testid={`link-nav-${link.label.toLowerCase()}`}
                >
                  <link.icon className="w-4 h-4 mr-2" />
                  {link.label}
                </Button>
              </Link>
            ))}
            {user &&
              userLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <Button
                    variant={isActive(link.href) ? "secondary" : "ghost"}
                    size="sm"
                    data-testid={`link-nav-${link.label.toLowerCase().replace(" ", "-")}`}
                  >
                    <link.icon className="w-4 h-4 mr-2" />
                    {link.label}
                  </Button>
                </Link>
              ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            data-testid="button-theme-toggle"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>

          {user && <NotificationBell />}

          {!isLoading && (
            <>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" data-testid="button-user-menu">
                      <User className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline max-w-[120px] truncate">
                        {user.email}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      {user.email}
                    </div>
                    <DropdownMenuSeparator />
                    <Link href="/dashboard">
                      <DropdownMenuItem data-testid="link-dropdown-dashboard">
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Dashboard
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/analytics">
                      <DropdownMenuItem data-testid="link-dropdown-analytics">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Analytics
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/earn">
                      <DropdownMenuItem data-testid="link-dropdown-earn">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Earn
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/qr-codes">
                      <DropdownMenuItem data-testid="link-dropdown-qr">
                        <QrCode className="w-4 h-4 mr-2" />
                        QR Codes
                      </DropdownMenuItem>
                    </Link>
                    {user.isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <Link href="/admin">
                          <DropdownMenuItem data-testid="link-dropdown-admin">
                            <Settings className="w-4 h-4 mr-2" />
                            Admin Panel
                          </DropdownMenuItem>
                        </Link>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => logout()}
                      disabled={isLoggingOut}
                      data-testid="button-logout"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      {isLoggingOut ? "Logging out..." : "Log out"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link href="/login">
                    <Button variant="ghost" size="sm" data-testid="link-login">
                      Log in
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm" data-testid="link-register">
                      Sign up
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex flex-col gap-4 mt-6">
                <div className="flex items-center gap-2 font-heading font-bold text-xl mb-4">
                  <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                    <Link2 className="w-5 h-5 text-primary-foreground" />
                  </div>
                  AdShrtPro
                </div>

                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <Button
                      variant={isActive(link.href) ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setMobileOpen(false)}
                    >
                      <link.icon className="w-4 h-4 mr-2" />
                      {link.label}
                    </Button>
                  </Link>
                ))}

                {user && (
                  <>
                    <div className="border-t pt-4 mt-2">
                      <p className="text-sm text-muted-foreground px-4 mb-2">
                        Account
                      </p>
                    </div>
                    {userLinks.map((link) => (
                      <Link key={link.href} href={link.href}>
                        <Button
                          variant={isActive(link.href) ? "secondary" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => setMobileOpen(false)}
                        >
                          <link.icon className="w-4 h-4 mr-2" />
                          {link.label}
                        </Button>
                      </Link>
                    ))}
                    {user.isAdmin && (
                      <Link href="/admin">
                        <Button
                          variant={isActive("/admin") ? "secondary" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => setMobileOpen(false)}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Admin Panel
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-destructive"
                      disabled={isLoggingOut}
                      onClick={() => {
                        logout();
                        setMobileOpen(false);
                      }}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      {isLoggingOut ? "Logging out..." : "Log out"}
                    </Button>
                  </>
                )}

                {!user && !isLoading && (
                  <div className="border-t pt-4 mt-2 flex flex-col gap-2">
                    <Link href="/login">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setMobileOpen(false)}
                      >
                        Log in
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button
                        className="w-full"
                        onClick={() => setMobileOpen(false)}
                      >
                        Sign up
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
