import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Initialize Firebase Admin (server-side)
function getAdminDb() {
  if (!getApps().length) {
    // Use application default credentials or project ID for Firestore
    initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }
  return getFirestore();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  try {
    const db = getAdminDb();
    const snapshot = await db
      .collection("qrCodes")
      .where("shortCode", "==", code)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return new NextResponse("QR code not found", { status: 404 });
    }

    const qrDoc = snapshot.docs[0];
    const qrData = qrDoc.data();
    const targetUrl = qrData.targetUrl;

    // Log the scan asynchronously (don't block the redirect)
    const userAgent = request.headers.get("user-agent") || "";
    const referrer = request.headers.get("referer") || "";

    // Fire-and-forget: log scan + increment count
    Promise.all([
      db.collection("scans").add({
        qrCodeId: qrDoc.id,
        userId: qrData.userId,
        timestamp: new Date(),
        userAgent,
        referrer,
        country: "",
      }),
      qrDoc.ref.update({ scanCount: FieldValue.increment(1) }),
    ]).catch((err) => console.error("Scan logging error:", err));

    // Redirect to target URL
    return NextResponse.redirect(targetUrl, { status: 302 });
  } catch (error) {
    console.error("Scan route error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
