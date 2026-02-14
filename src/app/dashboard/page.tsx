"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { getUserQRCodes, deleteQRCode, type QRCode } from "@/lib/firestore";
import Link from "next/link";
import {
  QrCode,
  Plus,
  AlertTriangle,
  Activity,
  Loader2,
  Trash2,
  LogOut,
  ExternalLink,
} from "lucide-react";

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [qrCodes, setQRCodes] = useState<QRCode[]>([]);
  const [loadingQR, setLoadingQR] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  const fetchQRCodes = useCallback(async () => {
    if (!user) return;
    setLoadingQR(true);
    try {
      const codes = await getUserQRCodes(user.uid);
      setQRCodes(codes);
    } catch (error) {
      console.error("Error fetching QR codes:", error);
    } finally {
      setLoadingQR(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchQRCodes();
  }, [user, fetchQRCodes]);

  const handleDelete = async (id: string) => {
    if (!user || !confirm("Delete this QR code? This cannot be undone."))
      return;
    setDeletingId(id);
    try {
      await deleteQRCode(id, user.uid);
      setQRCodes((prev) => prev.filter((qr) => qr.id !== id));
    } catch (error) {
      console.error("Error deleting QR code:", error);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isAtLimit = qrCodes.length >= 5;
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <QrCode className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-semibold text-foreground">
              Dynamic QR
            </span>
            <a
              href="https://tamilarasu-portfolio.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted hover:border-primary/30 hover:text-primary sm:flex"
            >
              by Tamilarasu
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </div>

          <div className="flex items-center gap-3">
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt={user.displayName ?? "User"}
                className="h-8 w-8 rounded-full"
                referrerPolicy="no-referrer"
              />
            )}
            <span className="hidden text-sm font-medium text-foreground sm:block">
              {user.displayName}
            </span>
            <button
              onClick={signOut}
              className="focus-ring flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Top bar */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Your QR Codes
            </h1>
            <p className="mt-1 text-sm text-muted">
              {qrCodes.length} of 5 QR codes used
            </p>
          </div>
          {isAtLimit ? (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
              <AlertTriangle className="h-4 w-4" />
              Limit reached (5/5)
            </div>
          ) : (
            <Link
              href="/dashboard/create"
              className="focus-ring inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              Create QR Code
            </Link>
          )}
        </div>

        {/* Usage bar */}
        <div className="mb-8 overflow-hidden rounded-full bg-primary-light/50">
          <div
            className="h-2 rounded-full bg-primary"
            style={{ width: `${(qrCodes.length / 5) * 100}%` }}
          />
        </div>

        {/* Content */}
        {loadingQR ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : qrCodes.length === 0 ? (
          /* Empty state */
          <div className="animate-fade-in-up flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-20">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light">
              <QrCode className="h-7 w-7 text-primary" strokeWidth={1.5} />
            </div>
            <h3 className="mb-1 text-lg font-semibold text-foreground">
              No QR codes yet
            </h3>
            <p className="mb-6 text-sm text-muted">
              Create your first dynamic QR code to get started
            </p>
            <Link
              href="/dashboard/create"
              className="focus-ring cursor-pointer rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
            >
              Create your first QR code
            </Link>
          </div>
        ) : (
          /* QR Code Grid */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {qrCodes.map((qr, i) => (
              <div
                key={qr.id}
                className="animate-fade-in-up group overflow-hidden rounded-xl border border-border bg-background hover:border-primary/20 hover:shadow-md"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="p-5">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold text-foreground">
                        {qr.label || "Untitled QR"}
                      </h3>
                      <p
                        className="mt-0.5 truncate text-xs text-muted"
                        title={qr.targetUrl}
                      >
                        {qr.targetUrl}
                      </p>
                    </div>
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-primary-light px-2.5 py-1 text-xs font-semibold text-primary">
                      <Activity className="h-3 w-3" strokeWidth={2.5} />
                      {qr.scanCount}
                    </span>
                  </div>

                  <div className="mb-3 rounded-lg bg-surface p-2">
                    <p className="truncate text-xs font-mono text-muted">
                      {baseUrl}/api/scan/{qr.shortCode}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/qr/${qr.id}`}
                      className="focus-ring flex-1 cursor-pointer rounded-lg border border-border px-3 py-2 text-center text-xs font-medium text-foreground hover:border-primary/30 hover:bg-primary-light/50"
                    >
                      View Details
                    </Link>
                    <button
                      onClick={() => handleDelete(qr.id)}
                      disabled={deletingId === qr.id}
                      className="focus-ring flex cursor-pointer items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      {deletingId === qr.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
