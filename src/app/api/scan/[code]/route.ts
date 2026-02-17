import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  query,
  where,
  limit,
  getDocs,
  addDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  try {
    // Guard: if Firebase is not initialized (no API key), return error
    if (!db) {
      return new NextResponse("Service unavailable", { status: 503 });
    }

    const q = query(
      collection(db, "qrCodes"),
      where("shortCode", "==", code),
      limit(1),
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return new NextResponse("QR code not found", { status: 404 });
    }

    const qrDoc = snapshot.docs[0];
    const qrData = qrDoc.data();
    const targetUrl = qrData.targetUrl;

    // Log the scan and increment count before redirecting
    const userAgent = request.headers.get("user-agent") || "";
    const referrer = request.headers.get("referer") || "";

    // Await the writes so they complete before the serverless function exits
    await Promise.all([
      addDoc(collection(db, "scans"), {
        qrCodeId: qrDoc.id,
        userId: qrData.userId,
        timestamp: new Date(),
        userAgent,
        referrer,
        country: "",
      }),
      updateDoc(qrDoc.ref, { scanCount: increment(1) }),
    ]);

    // Redirect to target URL
    return NextResponse.redirect(targetUrl, { status: 302 });
  } catch (error) {
    console.error("Scan route error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
