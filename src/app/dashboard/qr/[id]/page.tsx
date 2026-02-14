"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  getQRCodeById,
  updateQRCodeTarget,
  getScansForQRCode,
  deleteQRCode,
  type QRCode,
  type Scan,
} from "@/lib/firestore";
import QRCodeLib from "qrcode";
import Link from "next/link";
import {
  ChevronLeft,
  Trash2,
  Download,
  Pencil,
  Save,
  X,
  Loader2,
} from "lucide-react";

export default function QRDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const qrId = params.id as string;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [qrCode, setQRCode] = useState<QRCode | null>(null);
  const [scans, setScans] = useState<Scan[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [editUrl, setEditUrl] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [user, loading, router]);

  const fetchData = useCallback(async () => {
    if (!user || !qrId) return;
    setLoadingData(true);
    try {
      const [qr, scanData] = await Promise.all([
        getQRCodeById(qrId),
        getScansForQRCode(qrId),
      ]);
      if (!qr || qr.userId !== user.uid) {
        router.push("/dashboard");
        return;
      }
      setQRCode(qr);
      setScans(scanData);
      setEditUrl(qr.targetUrl);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  }, [user, qrId, router]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  // Render QR to canvas
  useEffect(() => {
    if (!canvasRef.current || !qrCode) return;
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    QRCodeLib.toCanvas(
      canvasRef.current,
      `${baseUrl}/api/scan/${qrCode.shortCode}`,
      { width: 240, margin: 2, color: { dark: "#111827", light: "#ffffff" } },
    );
  }, [qrCode]);

  const handleSaveUrl = async () => {
    if (!qrCode) return;
    setError("");
    try {
      new URL(editUrl);
    } catch {
      setError("Please enter a valid URL");
      return;
    }
    setSaving(true);
    try {
      await updateQRCodeTarget(qrCode.id, editUrl);
      setQRCode((prev) => (prev ? { ...prev, targetUrl: editUrl } : null));
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setError("Failed to update URL");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!qrCode || !user) return;
    if (!confirm("Delete this QR code? All scan data will be lost.")) return;
    await deleteQRCode(qrCode.id, user.uid);
    router.push("/dashboard");
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `${qrCode?.label || "qrcode"}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  // Scan chart data — last 7 days
  const getLast7DaysData = () => {
    const days: { label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayLabel = d.toLocaleDateString("en", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      const dayStart = new Date(d.setHours(0, 0, 0, 0));
      const dayEnd = new Date(d.setHours(23, 59, 59, 999));
      const count = scans.filter(
        (s) => s.timestamp >= dayStart && s.timestamp <= dayEnd,
      ).length;
      days.push({ label: dayLabel, count });
    }
    return days;
  };

  const getDeviceBreakdown = () => {
    const devices: Record<string, number> = {};
    scans.forEach((s) => {
      let device = "Unknown";
      const ua = s.userAgent.toLowerCase();
      if (
        ua.includes("mobile") ||
        ua.includes("android") ||
        ua.includes("iphone")
      )
        device = "Mobile";
      else if (ua.includes("tablet") || ua.includes("ipad")) device = "Tablet";
      else if (
        ua.includes("mozilla") ||
        ua.includes("chrome") ||
        ua.includes("safari")
      )
        device = "Desktop";
      devices[device] = (devices[device] || 0) + 1;
    });
    return Object.entries(devices);
  };

  if (loading || loadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!qrCode) return null;

  const chartData = getLast7DaysData();
  const maxCount = Math.max(...chartData.map((d) => d.count), 1);
  const deviceData = getDeviceBreakdown();
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/dashboard"
            className="focus-ring flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-muted hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <button
            onClick={handleDelete}
            className="focus-ring flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete QR
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="animate-fade-in-up">
          {/* Top section: QR code + info */}
          <div className="mb-8 grid gap-6 lg:grid-cols-3">
            {/* QR Code Card */}
            <div className="flex flex-col items-center rounded-xl border border-border bg-background p-6">
              <canvas
                ref={canvasRef}
                width={240}
                height={240}
                className="mb-4 rounded-lg"
              />
              <button
                onClick={handleDownload}
                className="focus-ring flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:border-primary/30 hover:bg-primary-light/50"
              >
                <Download className="h-4 w-4" />
                Download PNG
              </button>
            </div>

            {/* Info */}
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-xl border border-border bg-background p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h1 className="text-xl font-bold text-foreground">
                    {qrCode.label || "Untitled QR"}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary-light px-3 py-1 text-sm font-semibold text-primary">
                    {qrCode.scanCount} scans
                  </span>
                </div>

                {/* Redirect URL */}
                <div className="mb-4 rounded-lg bg-surface p-3">
                  <p className="mb-1 text-xs font-medium text-muted">
                    Redirect URL
                  </p>
                  <p className="break-all font-mono text-xs text-foreground">
                    {baseUrl}/api/scan/{qrCode.shortCode}
                  </p>
                </div>

                {/* Target URL */}
                <div className="rounded-lg border border-border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-medium text-muted">
                      Destination URL
                    </p>
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex cursor-pointer items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="url"
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        className="focus-ring w-full rounded-lg border border-border px-3 py-2 text-sm"
                      />
                      {error && <p className="text-xs text-red-600">{error}</p>}
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveUrl}
                          disabled={saving}
                          className="focus-ring flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-white hover:bg-primary-hover disabled:opacity-50"
                        >
                          {saving ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Save className="h-3 w-3" />
                          )}
                          {saving ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setEditUrl(qrCode.targetUrl);
                            setError("");
                          }}
                          className="flex cursor-pointer items-center gap-1 rounded-lg border border-border px-4 py-1.5 text-xs font-medium text-muted hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="break-all text-sm text-foreground">
                      {qrCode.targetUrl}
                    </p>
                  )}
                </div>

                <p className="mt-3 text-xs text-muted">
                  Created{" "}
                  {qrCode.createdAt.toLocaleDateString("en", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Analytics Section */}
          <h2 className="mb-4 text-lg font-bold text-foreground">
            Scan Analytics
          </h2>

          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-background p-5">
              <p className="text-xs font-medium text-muted">Total Scans</p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {qrCode.scanCount}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background p-5">
              <p className="text-xs font-medium text-muted">Last 7 Days</p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {chartData.reduce((a, b) => a + b.count, 0)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background p-5">
              <p className="text-xs font-medium text-muted">Top Device</p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {deviceData.length > 0
                  ? deviceData.sort((a, b) => b[1] - a[1])[0][0]
                  : "—"}
              </p>
            </div>
          </div>

          {/* Bar Chart — Last 7 Days */}
          <div className="mb-6 rounded-xl border border-border bg-background p-6">
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              Scans — Last 7 Days
            </h3>
            {scans.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">
                No scans yet. Share your QR code to start tracking!
              </p>
            ) : (
              <div className="flex items-end gap-2" style={{ height: 160 }}>
                {chartData.map((day) => (
                  <div
                    key={day.label}
                    className="flex flex-1 flex-col items-center gap-1"
                  >
                    <span className="text-xs font-semibold text-foreground">
                      {day.count > 0 ? day.count : ""}
                    </span>
                    <div
                      className="w-full rounded-t-md bg-primary/80 transition-all hover:bg-primary"
                      style={{
                        height: `${Math.max((day.count / maxCount) * 120, 4)}px`,
                      }}
                    />
                    <span className="mt-1 text-[10px] text-muted">
                      {day.label.split(",")[0]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Device Breakdown */}
          {deviceData.length > 0 && (
            <div className="mb-6 rounded-xl border border-border bg-background p-6">
              <h3 className="mb-4 text-sm font-semibold text-foreground">
                Device Breakdown
              </h3>
              <div className="space-y-3">
                {deviceData.map(([device, count]) => (
                  <div key={device}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm text-foreground">{device}</span>
                      <span className="text-sm font-medium text-muted">
                        {count} ({Math.round((count / scans.length) * 100)}%)
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-primary-light/50">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${(count / scans.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Scans Table */}
          <div className="rounded-xl border border-border bg-background p-6">
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              Recent Scans
            </h3>
            {scans.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted">
                No scans recorded yet
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pb-2 pr-4 text-xs font-medium text-muted">
                        Time
                      </th>
                      <th className="pb-2 pr-4 text-xs font-medium text-muted">
                        Device
                      </th>
                      <th className="pb-2 text-xs font-medium text-muted">
                        Referrer
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {scans.slice(0, 20).map((scan) => {
                      const ua = scan.userAgent.toLowerCase();
                      let device = "Unknown";
                      if (
                        ua.includes("mobile") ||
                        ua.includes("android") ||
                        ua.includes("iphone")
                      )
                        device = "Mobile";
                      else if (ua.includes("tablet") || ua.includes("ipad"))
                        device = "Tablet";
                      else if (ua.includes("mozilla") || ua.includes("chrome"))
                        device = "Desktop";

                      return (
                        <tr key={scan.id} className="border-b border-border/50">
                          <td className="py-2.5 pr-4 text-xs text-foreground">
                            {scan.timestamp.toLocaleString()}
                          </td>
                          <td className="py-2.5 pr-4 text-xs text-muted">
                            {device}
                          </td>
                          <td className="py-2.5 text-xs text-muted">
                            {scan.referrer || "Direct"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
