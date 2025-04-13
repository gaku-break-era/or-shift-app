// ✅ Firestore Emulator に接続するための環境変数（これが超重要！）
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

import { readFile } from "fs/promises";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// ✅ ここで projectId を明示指定！（ポイント）
initializeApp({
  projectId: 'or-shift-app'
});

const db = getFirestore();

async function seedData() {
  try {
    const dataBuffer = await readFile('./scripts/surgerySchedules.json');
    const schedules = JSON.parse(dataBuffer.toString());

    const batch = db.batch();

    schedules.forEach((schedule) => {
      const docRef = db.collection("surgerySchedules").doc();
      batch.set(docRef, schedule);
    });

    await batch.commit();
    console.log("✅ Firestoreにデータを投入しました！");
  } catch (error) {
    console.error("❌ エラーが発生しました:", error);
  }
}

seedData();
