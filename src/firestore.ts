import {
  collection,
  getDocs,
  query,
  where,
  serverTimestamp, // Perbaikan: Menggunakan serverTimestamp lebih aman dibanding Timestamp.now()
  deleteDoc,
  doc,
  setDoc
} from 'firebase/firestore';
import { db } from './firebase'; // Pastikan path ke file inisialisasi firebase kamu sudah benar
import { FastingLog } from './types';

// Nama koleksi di Firestore
const FASTING_LOGS_COLLECTION = 'fastingLogs';

/**
 * Menyimpan atau memperbarui catatan puasa di Firestore
 */
export async function upsertFastingLog(userId: string, logData: FastingLog) {
  try {
    // Gunakan kombinasi userId dan date sebagai ID dokumen agar unik per user
    const docId = `${userId}_${logData.date}`;

    await setDoc(doc(db, FASTING_LOGS_COLLECTION, docId), {
      ...logData,
      id: docId, // Menyimpan docId ke dalam field 'id' agar data konsisten
      userId,
      updatedAt: serverTimestamp() // Menggunakan serverTimestamp dari Firestore
    });
  } catch (error) {
    console.error("Error upserting fasting log: ", error);
    throw error;
  }
}

/**
 * Mengambil semua catatan puasa untuk user tertentu, diurutkan dari yang terbaru
 */
export async function getFastingLogsForUser(userId: string): Promise<FastingLog[]> {
  try {
    const q = query(
      collection(db, FASTING_LOGS_COLLECTION),
      where("userId", "==", userId)
    );

    const querySnapshot = await getDocs(q);
    const logs: FastingLog[] = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();

      logs.push({
        id: docSnap.id, // PERBAIKAN UTAMA: Ambil id langsung dari properti bawaan dokumen Firestore (bukan data.id)
        date: data.date,
        dayType: data.dayType,
        completed: data.completed,
        sahurCompleted: data.sahurCompleted,
        mood: data.mood,
        notes: data.notes
      } as FastingLog);
    });

    // Sort secara manual berdasarkan string tanggal (YYYY-MM-DD) dari yang terbaru
    return logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error("Error getting fasting logs: ", error);
    throw error;
  }
}

/**
 * Menghapus catatan puasa berdasarkan log date (ID)
 */
export async function deleteFastingLog(userId: string, dateStr: string) {
  try {
    const docId = `${userId}_${dateStr}`;
    await deleteDoc(doc(db, FASTING_LOGS_COLLECTION, docId));
  } catch (error) {
    console.error("Error deleting fasting log: ", error);
    throw error;
  }
}