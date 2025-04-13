// scripts/convertOrToRoom.js

// 🔥 Emulator用の環境変数（必須！）
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// ✅ Firebase Admin を初期化（projectIdを明示）
initializeApp({
  projectId: 'or-shift-app'
});

const db = getFirestore();

async function convertFields() {
  const snapshot = await db.collection("surgerySchedules").get();

  const batch = db.batch();
  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.or && !data.room) {
      batch.update(doc.ref, {
        room: data.or
      });
    }
  });

  await batch.commit();
  console.log("✅ or → room フィールド変換完了！");
}

convertFields().catch((err) => {
  console.error("❌ エラー:", err);
});
