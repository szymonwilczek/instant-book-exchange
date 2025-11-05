"use client";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import AuthBackgroundShape from "@/assets/svg/auth-background-shape";
import Logo from "@/assets/svg/logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import LoginForm from "@/components/login/login-form";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export default function LoginPage() {
  const handleSubmit = async (data: {
    email: string;
    password: string;
    rememberMe: boolean;
  }) => {
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      rememberMe: data.rememberMe.toString(),
      redirect: false,
    });
    if (result?.error) {
      alert("Login error: " + result.error);
    } else {
      window.location.href = "/profile";
    }
  };

  const handleGoogleSignIn = () =>
    signIn("google", { callbackUrl: "/profile" });

  return (
    <div className="relative flex h-auto min-h-screen items-center justify-center overflow-x-hidden px-4 py-10 sm:px-6 lg:px-8">
      <div className="absolute">
        <AuthBackgroundShape />
      </div>

      <Card className="z-1 w-full border-none shadow-md sm:max-w-lg">
        <CardHeader className="gap-6">
          <Logo className="gap-3" />

          <div>
            <CardTitle className="mb-1.5 text-2xl">
              Sign In to Instant Book Exchange
            </CardTitle>
            <CardDescription className="text-base">
              Your bookshelf is waiting.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <LoginForm onSubmit={handleSubmit} />

            <p className="text-muted-foreground text-center">
              Don&apos;t have an account yet?{" "}
              <Link
                href="/register"
                className="text-card-foreground hover:underline"
              >
                Sign Up
              </Link>
            </p>

            <div className="flex items-center gap-4">
              <Separator className="flex-1" />
              <p>or</p>
              <Separator className="flex-1" />
            </div>

            <Button
              variant="ghost"
              className="w-full"
              onClick={handleGoogleSignIn}
            >
              Sign in with Google
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
