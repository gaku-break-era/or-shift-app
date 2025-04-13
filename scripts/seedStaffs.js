// ✅ Firestore Emulator に接続するための環境変数（これが超重要！）
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// 初期化（認証なしのローカルモード）
initializeApp({
    projectId: "or-shift-app", // ← Emulator用の適当なIDでOK
  });
  
const db = getFirestore();

const sampleStaffs = [
  {
    name: "鈴木 花子",
    year: 1,
    department: "消化器外科",
    roles: {
      scrub: ["消化器外科"],
      circulating: [],
    },
    independence: {
      "腹腔鏡下胆嚢摘出術": {
        scrub: false,
        circulating: true,
      },
    },
    restrictions: {
      ngProcedures: [],
      ngPartners: [],
    },
  },
  {
    name: "田中 太郎",
    year: 3,
    department: "脳神経外科",
    roles: {
      scrub: [],
      circulating: ["脳神経外科"],
    },
    independence: {
      "慢性硬膜下血腫穿頭洗浄術": {
        scrub: true,
        circulating: true,
      },
    },
    restrictions: {
      ngProcedures: [],
      ngPartners: [],
    },
  },
];

async function seedStaffs() {
  const batch = db.batch();

  sampleStaffs.forEach((staff, i) => {
    const ref = db.collection("staffs").doc(`staff${i + 1}`);
    batch.set(ref, staff);
  });

  await batch.commit();
  console.log("✅ テスト用スタッフデータの投入完了！");
}

seedStaffs().catch((err) => {
  console.error("❌ エラー:", err);
});
