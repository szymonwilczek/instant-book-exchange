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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { HamburgerIcon } from "@/components/navbar/HamburgerIcon";
import { Logo } from "@/components/Logo";
import { InfoMenu } from "@/components/navbar/InfoMenu";
import { UserMenu } from "@/components/navbar/UserMenu";
import { CartSheet } from "@/components/navbar/CartSheet";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Sun, Moon, MessageCircle, LogIn } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { PointsDisplay } from "./PointsDisplay";

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

const defaultNavigationLinks: NavbarNavItem[] = [
  { href: "/", label: "Home" },
  { href: "/transactions", label: "Transactions" },
  { href: "/achievements", label: "Achievements" },
];

export const Navbar = React.forwardRef<HTMLElement, NavbarProps>(
  (
    {
      className,
      logo = <Logo />,
      navigationLinks = defaultNavigationLinks,
      onNavItemClick,
      onInfoItemClick,
      onUserItemClick,
      ...props
    },
    ref
  ) => {
    const [isMobile, setIsMobile] = useState(false);
    const containerRef = useRef<HTMLElement>(null);
    const { data: session } = useSession();
    const [userData, setUserData] = useState(null);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();
    const router = useRouter();

    useEffect(() => {
      if (session) {
        fetch("/api/user/profile")
          .then((res) => res.json())
          .then(setUserData);
      }
    }, [session]);

    // unread messages count
    useEffect(() => {
      if (session?.user?.id) {
        const fetchUnreadCount = async () => {
          try {
            const res = await fetch("/api/messages/unread-count");
            if (res.ok) {
              const data = await res.json();
              setUnreadMessagesCount(data.count || 0);
            }
          } catch (error) {
            console.error("Error fetching unread count:", error);
          }
        };

        fetchUnreadCount();

        // poll co 30 sekund
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
      }
    }, [session?.user?.id]);

    useEffect(() => {
      const checkWidth = () => {
        if (containerRef.current) {
          const width = containerRef.current.offsetWidth;
          setIsMobile(width < 768); // 768px is md breakpoint
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

    // Combine refs
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

    if (pathname === "/login" || pathname === "/register") {
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    className="group h-9 w-9 hover:bg-accent hover:text-accent-foreground"
                    variant="ghost"
                    size="icon"
                  >
                    <HamburgerIcon />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-64 p-1">
                  <NavigationMenu className="max-w-none">
                    <NavigationMenuList className="flex-col items-start gap-0">
                      {navigationLinks.map((link, index) => (
                        <NavigationMenuItem key={index} className="w-full">
                          <button
                            onClick={() => {
                              if (onNavItemClick) {
                                onNavItemClick(link.href!);
                              } else {
                                router.push(link.href!);
                              }
                            }}
                            className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer no-underline"
                          >
                            {link.label}
                          </button>
                        </NavigationMenuItem>
                      ))}
                    </NavigationMenuList>
                  </NavigationMenu>
                </PopoverContent>
              </Popover>
            )}
            {/* Main nav */}
            <div className="flex items-center gap-6">
              <button
                onClick={() => router.push("/")}
                className="flex items-center space-x-2 text-primary hover:text-primary/90 transition-colors cursor-pointer"
              >
                <div className="text-2xl">{logo}</div>
                <span className="hidden font-bold text-xl sm:inline-block">
                  Instant Book Exchange
                </span>
              </button>
              {/* Navigation menu */}
              {!isMobile && (
                <NavigationMenu className="flex">
                  <NavigationMenuList className="gap-1">
                    {navigationLinks.map((link, index) => (
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
              {/* Info menu */}
              <InfoMenu onItemClick={onInfoItemClick} />
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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="h-9 w-9 cursor-pointer"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </div>
            <PointsDisplay />
            <LanguageSwitcher />
            {session ? (
              <UserMenu
                userName={session?.user?.name || userData?.name || "User"}
                userEmail={
                  session?.user?.email || userData?.email || "user@example.com"
                }
                userAvatar={userData?.profileImage || session?.user?.image}
                onItemClick={onUserItemClick}
              />
            ) : (
              <Button
                onClick={() => router.push("/login")}
                variant="default"
                size="sm"
                className="gap-2"
              >
                <LogIn className="h-4 w-4" />
                LOG IN
              </Button>
            )}
          </div>
        </div>
      </header>
    );
  }
);

Navbar.displayName = "Navbar";

export { Logo, HamburgerIcon, InfoMenu, UserMenu, CartSheet };
