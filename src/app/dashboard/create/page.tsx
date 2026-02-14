"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { createQRCode, getUserQRCodeCount } from "@/lib/firestore";
import QRCodeLib from "qrcode";
import Link from "next/link";
import { ChevronLeft, QrCode, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CreateQRPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [targetUrl, setTargetUrl] = useState("");
  const [label, setLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [qrCount, setQrCount] = useState<number | null>(null);
  const [previewReady, setPreviewReady] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      getUserQRCodeCount(user.uid).then(setQrCount);
    }
  }, [user]);

  // Live QR preview
  useEffect(() => {
    if (!canvasRef.current || !targetUrl.trim()) {
      setPreviewReady(false);
      return;
    }

    try {
      new URL(targetUrl);
    } catch {
      setPreviewReady(false);
      return;
    }

    QRCodeLib.toCanvas(
      canvasRef.current,
      targetUrl,
      {
        width: 200,
        margin: 2,
        color: { dark: "#111827", light: "#ffffff" },
      },
      (err) => {
        if (!err) setPreviewReady(true);
      },
    );
  }, [targetUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError("");

    // Validate URL
    try {
      new URL(targetUrl);
    } catch {
      setError("Please enter a valid URL (include https://)");
      return;
    }

    // Check limit
    if (qrCount !== null && qrCount >= 5) {
      setError("You've reached the limit of 5 QR codes");
      return;
    }

    setCreating(true);
    try {
      await createQRCode(user.uid, targetUrl, label || "Untitled QR");
      router.push("/dashboard");
    } catch (err: unknown) {
      console.error("QR creation error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Failed to create QR code: ${msg}`);
    } finally {
      setCreating(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-surface">
        <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-5 w-32" />
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-background p-6">
              <Skeleton className="mb-2 h-7 w-32" />
              <Skeleton className="mb-6 h-4 w-64" />
              <div className="space-y-4">
                <div>
                  <Skeleton className="mb-2 h-4 w-12" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
                <div>
                  <Skeleton className="mb-2 h-4 w-24" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            </div>
            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-background p-6">
              <Skeleton className="mb-4 h-4 w-24" />
              <Skeleton className="aspect-square w-[200px] rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  const isAtLimit = qrCount !== null && qrCount >= 5;

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/dashboard"
            className="focus-ring flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-muted hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Link>
          <span className="text-sm font-semibold text-foreground">
            Create QR Code
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="animate-fade-in-up">
          {isAtLimit ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
              <h2 className="mb-2 text-lg font-semibold text-amber-800">
                Limit Reached
              </h2>
              <p className="text-sm text-amber-700">
                You&apos;ve used all 5 QR codes. Delete an existing one to
                create a new one.
              </p>
              <Link
                href="/dashboard"
                className="mt-4 inline-block rounded-lg bg-amber-600 px-5 py-2 text-sm font-medium text-white hover:bg-amber-700"
              >
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Form */}
              <div className="rounded-xl border border-border bg-background p-6">
                <h2 className="mb-1 text-lg font-bold text-foreground">
                  New QR Code
                </h2>
                <p className="mb-6 text-sm text-muted">
                  Enter a destination URL — you can change it anytime.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="label"
                      className="mb-1.5 block text-sm font-medium text-foreground"
                    >
                      Label
                    </label>
                    <input
                      id="label"
                      type="text"
                      placeholder="e.g. My Portfolio"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      className="focus-ring w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted/60"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="targetUrl"
                      className="mb-1.5 block text-sm font-medium text-foreground"
                    >
                      Destination URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="targetUrl"
                      type="url"
                      required
                      placeholder="https://example.com"
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      className="focus-ring w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted/60"
                    />
                  </div>

                  {error && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={creating || !targetUrl.trim()}
                    className="focus-ring w-full cursor-pointer rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {creating ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </span>
                    ) : (
                      "Create QR Code"
                    )}
                  </button>
                </form>
              </div>

              {/* Live Preview */}
              <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-background p-6">
                <h3 className="mb-4 text-sm font-semibold text-muted">
                  Live Preview
                </h3>
                <div
                  className={`rounded-xl border-2 border-dashed p-4 ${
                    previewReady
                      ? "border-primary/30 bg-white"
                      : "border-border bg-surface"
                  }`}
                >
                  <canvas
                    ref={canvasRef}
                    width={200}
                    height={200}
                    className={previewReady ? "block" : "hidden"}
                  />
                  {!previewReady && (
                    <div className="flex h-[200px] w-[200px] flex-col items-center justify-center text-center">
                      <QrCode
                        className="h-8 w-8 text-gray-300"
                        strokeWidth={1.5}
                      />
                      <p className="mt-3 text-xs text-muted">
                        Enter a URL to see preview
                      </p>
                    </div>
                  )}
                </div>
                {label && previewReady && (
                  <p className="mt-3 text-sm font-medium text-foreground">
                    {label}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
