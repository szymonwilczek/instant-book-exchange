"use client";

import * as React from "react";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { HamburgerIcon } from "@/components/navbar/HamburgerIcon";
import { Logo } from "@/components/Logo";
import { UserMenu } from "@/components/navbar/UserMenu";
import { CartSheet } from "@/components/navbar/CartSheet";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { MessageCircle, LogIn, Home, ArrowRightLeft, User, Trophy, TableProperties } from "lucide-react";
import { PointsDisplay } from "./PointsDisplay";
import { useTranslations } from "next-intl";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet";

export interface NavbarNavItem {
  href?: string;
  label: string;
}

export interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
  logo?: React.ReactNode;
  navigationLinks?: NavbarNavItem[];
  onNavItemClick?: (href: string) => void;
  onInfoItemClick?: (item: string) => void;
  onUserItemClick?: (item: string) => void;
}

export const Navbar = React.forwardRef<HTMLElement, NavbarProps>(
  (
    {
      className,
      logo = <Logo />,
      onNavItemClick,
      onInfoItemClick,
      onUserItemClick,
      ...props
    },
    ref
  ) => {
    const [isMobile, setIsMobile] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const containerRef = useRef<HTMLElement>(null);
    const { data: session } = useSession();
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
    const pathname = usePathname();
    const router = useRouter();
    const t = useTranslations("navbar");

    const defaultNavigationLinks: NavbarNavItem[] = [
      { href: "/", label: t("navigationLinks.home") },
      { href: "/transactions", label: t("navigationLinks.transactions") },
    ];

    const mobileNavigationLinks: NavbarNavItem[] = [
      { href: "/", label: t("navigationLinks.home") },
      { href: "/transactions", label: t("navigationLinks.transactions") },
      { href: "/profile", label: t("navigationLinks.profile") },
      { href: "/messages", label: t("navigationLinks.messages") },
      { href: "/achievements", label: t("navigationLinks.achievements") },
      { href: "/leaderboard", label: t("navigationLinks.ranking") },
    ];

    // polling dla unread messages z cache headers
    useEffect(() => {
      if (session?.user?.id) {
        const fetchUnreadCount = async () => {
          try {
            const res = await fetch("/api/messages/unread-count", {
              cache: "default",
            });
            if (res.ok) {
              const data = await res.json();
              setUnreadMessagesCount(data.count || 0);
            }
          } catch (error) {
            console.error("Error fetching unread count:", error);
          }
        };

        fetchUnreadCount();

        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
      }
    }, [session?.user?.id]);

    useEffect(() => {
      const checkWidth = () => {
        if (containerRef.current) {
          const width = containerRef.current.offsetWidth;
          setIsMobile(width < 768);
        }
      };

      checkWidth();

      const resizeObserver = new ResizeObserver(checkWidth);
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      return () => {
        resizeObserver.disconnect();
      };
    }, []);

    const combinedRef = React.useCallback(
      (node: HTMLElement | null) => {
        containerRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref]
    );

    if (
      (pathname && pathname.endsWith("/login")) ||
      (pathname && pathname.endsWith("/register"))
    ) {
      return null;
    }

    return (
      <header
        ref={combinedRef}
        className={cn(
          "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6 [&_*]:no-underline",
          className
        )}
        {...props}
      >
        <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between gap-4">
          {/* Left side */}
          <div className="flex items-center gap-2">
            {/* Mobile menu trigger */}
            {isMobile && (
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    className="group h-9 w-9 hover:bg-accent hover:text-accent-foreground"
                    variant="ghost"
                    size="icon"
                  >
                    <HamburgerIcon />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] sm:w-[320px] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      {logo}
                      <span className="font-bold text-lg">Menu</span>
                    </SheetTitle>
                    <SheetDescription className="sr-only">
                      Navigation menu
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-2 flex flex-col gap-2">
                    {mobileNavigationLinks.map((link, index) => {
                      const icons = {
                        "/": Home,
                        "/transactions": ArrowRightLeft,
                        "/profile": User,
                        "/messages": MessageCircle,
                        "/achievements": Trophy,
                        "/leaderboard": TableProperties,
                      };
                      const Icon = icons[link.href as keyof typeof icons];

                      return (
                        <Button
                          key={index}
                          variant="ghost"
                          className="w-full justify-start text-base gap-3 py-4 mt-2"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            if (onNavItemClick) {
                              onNavItemClick(link.href!);
                            } else {
                              router.push(link.href!);
                            }
                          }}
                        >
                          {Icon && <Icon className="h-5 w-5" />}
                          {link.label}
                        </Button>
                      );
                    })}
                  </div>
                </SheetContent>
              </Sheet>
            )}
            {/* Main nav */}
            <div className="flex items-center gap-6">
              {!isMobile && (
                <button
                  onClick={() => router.push("/")}
                  className="flex items-center space-x-2 text-primary hover:text-primary/90 transition-colors cursor-pointer"
                >
                  <div className="text-2xl">{logo}</div>
                  <span className="hidden font-bold text-xl sm:inline-block">
                    Instant Book Exchange
                  </span>
                </button>
              )}
              {/* Navigation menu */}
              {!isMobile && (
                <NavigationMenu className="flex">
                  <NavigationMenuList className="gap-1">
                    {defaultNavigationLinks.map((link, index) => (
                      <NavigationMenuItem key={index}>
                        <NavigationMenuLink
                          href={link.href}
                          onClick={() => {
                            if (onNavItemClick) {
                              onNavItemClick(link.href!);
                            } else {
                              router.push(link.href!);
                            }
                          }}
                          className="text-muted-foreground hover:text-primary py-1.5 font-medium transition-colors cursor-pointer group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                        >
                          {link.label}
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                    ))}
                  </NavigationMenuList>
                </NavigationMenu>
              )}
            </div>
          </div>
          {/* Right side */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {/* Messages - tylko dla zalogowanych */}
              {session && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push("/messages")}
                  className="relative h-9 w-9 cursor-pointer"
                >
                  <MessageCircle className="h-5 w-5" />
                  {unreadMessagesCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full px-1 text-xs"
                    >
                      {unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
                    </Badge>
                  )}
                </Button>
              )}
              {session && <CartSheet />}
            </div>
            <PointsDisplay />
            {session ? (
              <UserMenu
                userName={session.user.username || session.user.name || "User"}
                userEmail={session.user.email || "user@example.com"}
                userAvatar={session.user.profileImage || session.user.image || undefined}
                onItemClick={onUserItemClick}
              />
            ) : (
              <Button
                onClick={() => router.push("/login")}
                variant="default"
                size="sm"
                className="gap-2 cursor-pointer"
              >
                <LogIn className="h-4 w-4" />
                {t("logIn")}
              </Button>
            )}
          </div>
        </div>
      </header>
    );
  }
);

Navbar.displayName = "Navbar";

export { Logo, HamburgerIcon, UserMenu, CartSheet };
