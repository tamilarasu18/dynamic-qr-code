import { nanoid } from "./nanoid";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  increment,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// ---------- Types ----------

export interface QRCode {
  id: string;
  userId: string;
  shortCode: string;
  targetUrl: string;
  label: string;
  createdAt: Date;
  updatedAt: Date;
  scanCount: number;
}

export interface Scan {
  id: string;
  qrCodeId: string;
  userId: string;
  timestamp: Date;
  userAgent: string;
  referrer: string;
  country: string;
}

// ---------- QR Code CRUD ----------

export async function createQRCode(
  userId: string,
  targetUrl: string,
  label: string,
): Promise<QRCode> {
  const shortCode = nanoid(8);
  const now = new Date();

  const docRef = await addDoc(collection(db, "qrCodes"), {
    userId,
    shortCode,
    targetUrl,
    label,
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
    scanCount: 0,
  });

  // Increment user's qrCodeCount (use setDoc merge to handle missing doc)
  const userRef = doc(db, "users", userId);
  await setDoc(userRef, { qrCodeCount: increment(1) }, { merge: true });

  return {
    id: docRef.id,
    userId,
    shortCode,
    targetUrl,
    label,
    createdAt: now,
    updatedAt: now,
    scanCount: 0,
  };
}

export async function getUserQRCodes(userId: string): Promise<QRCode[]> {
  const q = query(collection(db, "qrCodes"), where("userId", "==", userId));
  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        shortCode: data.shortCode,
        targetUrl: data.targetUrl,
        label: data.label,
        createdAt: data.createdAt?.toDate?.() ?? new Date(),
        updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
        scanCount: data.scanCount ?? 0,
      };
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getQRCodeByShortCode(
  shortCode: string,
): Promise<QRCode | null> {
  const q = query(
    collection(db, "qrCodes"),
    where("shortCode", "==", shortCode),
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const docSnap = snapshot.docs[0];
  const data = docSnap.data();
  return {
    id: docSnap.id,
    userId: data.userId,
    shortCode: data.shortCode,
    targetUrl: data.targetUrl,
    label: data.label,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
    scanCount: data.scanCount ?? 0,
  };
}

export async function getQRCodeById(id: string): Promise<QRCode | null> {
  const docSnap = await getDoc(doc(db, "qrCodes", id));
  if (!docSnap.exists()) return null;

  const data = docSnap.data();
  return {
    id: docSnap.id,
    userId: data.userId,
    shortCode: data.shortCode,
    targetUrl: data.targetUrl,
    label: data.label,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
    scanCount: data.scanCount ?? 0,
  };
}

export async function updateQRCodeTarget(
  id: string,
  targetUrl: string,
): Promise<void> {
  await updateDoc(doc(db, "qrCodes", id), {
    targetUrl,
    updatedAt: Timestamp.fromDate(new Date()),
  });
}

export async function deleteQRCode(id: string, userId: string): Promise<void> {
  await deleteDoc(doc(db, "qrCodes", id));
  const userRef = doc(db, "users", userId);
  await setDoc(userRef, { qrCodeCount: increment(-1) }, { merge: true });
}

// ---------- Scans ----------

export async function logScan(
  qrCodeId: string,
  userId: string,
  userAgent: string,
  referrer: string,
): Promise<void> {
  await addDoc(collection(db, "scans"), {
    qrCodeId,
    userId,
    timestamp: Timestamp.fromDate(new Date()),
    userAgent,
    referrer,
    country: "",
  });

  // Increment scan count on QR code
  const qrRef = doc(db, "qrCodes", qrCodeId);
  await updateDoc(qrRef, { scanCount: increment(1) });
}

export async function getScansForQRCode(qrCodeId: string): Promise<Scan[]> {
  const q = query(collection(db, "scans"), where("qrCodeId", "==", qrCodeId));
  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        qrCodeId: data.qrCodeId,
        userId: data.userId,
        timestamp: data.timestamp?.toDate?.() ?? new Date(),
        userAgent: data.userAgent,
        referrer: data.referrer ?? "",
        country: data.country ?? "",
      };
    })
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export async function getUserQRCodeCount(userId: string): Promise<number> {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return 0;
  return userSnap.data().qrCodeCount ?? 0;
}
