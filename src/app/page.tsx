"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  QrCode,
  Zap,
  BarChart3,
  ShieldCheck,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface px-4 py-8">
        <div className="w-full max-w-md space-y-8 rounded-2xl border border-border bg-background p-8 sm:p-10">
          <div className="flex flex-col items-center space-y-4">
            <Skeleton className="h-14 w-14 rounded-xl" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-[1px] w-full" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface px-4 py-8">
      {/* Background decorative elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-subtle-pulse absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/5" />
        <div
          className="animate-subtle-pulse absolute -bottom-32 -left-32 h-[28rem] w-[28rem] rounded-full bg-primary/5"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="animate-subtle-pulse absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/3"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Login Card */}
      <div className="animate-fade-in-up relative z-10 w-full max-w-md">
        <div
          className="rounded-2xl border border-border bg-background p-8 sm:p-10"
          style={{
            boxShadow:
              "0 4px 6px -1px rgba(0,0,0,0.05), 0 10px 15px -3px rgba(0,0,0,0.05)",
          }}
        >
          {/* Logo / Brand */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
              <QrCode className="h-7 w-7 text-white" strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Dynamic QR Code
            </h1>
            <p className="mt-2 text-sm text-muted">
              Create trackable QR codes. Update destinations anytime.
            </p>
          </div>

          {/* Divider */}
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium text-muted">
              Sign in to continue
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Google Sign-In Button */}
          <button
            onClick={signInWithGoogle}
            className="focus-ring group flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium text-foreground hover:border-primary/30 hover:bg-primary-light/50"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          {/* Features preview */}
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { icon: Zap, label: "Dynamic URLs" },
              { icon: BarChart3, label: "Scan Analytics" },
              { icon: ShieldCheck, label: "Secure" },
            ].map((feature) => (
              <div
                key={feature.label}
                className="flex flex-col items-center gap-1.5 rounded-lg bg-surface p-3"
              >
                <feature.icon
                  className="h-5 w-5 text-primary"
                  strokeWidth={1.75}
                />
                <span className="text-xs font-medium text-muted">
                  {feature.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted">
          Free tier — up to 5 dynamic QR codes per account
        </p>
        <a
          href="https://tamilarasu-portfolio.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="mx-auto mt-3 flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-hover"
        >
          Built by Tamilarasu
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
