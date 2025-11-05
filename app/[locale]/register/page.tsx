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
import RegisterForm from "@/components/register/register-form";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export default function RegisterPage() {
  const handleGoogleSignIn = () =>
    signIn("google", { callbackUrl: "/profile" });

  const handleSubmit = async (data: {
    username: string;
    email: string;
    password: string;
  }) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (res.ok) {
      alert("Registered successfully! You will be redirected to login.");

      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    } else {
      alert(result.error);
    }
  };

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
              Sign Up to Instant Book Exchange
            </CardTitle>
            <CardDescription className="text-base">
              Connecting readers, one book at a time.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <RegisterForm onSubmit={handleSubmit} />

            <p className="text-muted-foreground text-center">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-card-foreground hover:underline"
              >
                Sign in instead
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
