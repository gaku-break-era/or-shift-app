// AutoAssignmentScreen.jsx
import React from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase"; // Firebaseの初期化ファイル
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";

const AutoAssignmentScreen = () => {
  const surgery = {
    id: "cholecystectomy_2025-04-12_OR1",
    date: "2025-04-12",
    room: "OR1",
    procedure: "腹腔鏡下胆嚢摘出術",
    department: "消化器外科"
  };

  const scrubNurse = {
    id: "suzuki_hanako",
    name: "鈴木 花子",
    score: 92,
    reason: "教育優先度高 + レベル1手術経験あり + NGなし"
  };

  const circulatingNurse = {
    id: "tanaka_taro",
    name: "田中 太郎",
    score: 85,
    reason: "独り立ち済み + 他指導歴豊富"
  };

  const saveAssignment = async () => {
    try {
      await setDoc(doc(db, "assignments", surgery.id), {
        ...surgery,
        scrubNurse,
        circulatingNurse,
        timestamp: serverTimestamp()
      });
      alert("✅ Firestoreに保存されました！");
    } catch (error) {
      console.error("❌ 保存エラー:", error);
      alert("保存に失敗しました");
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-4">🧠 AIによる手術自動割り当て</h1>

      <Card className="mb-6">
        <CardContent>
          <p className="text-sm">手術情報</p>
          <p className="font-semibold text-lg">{surgery.procedure}</p>
          <p className="text-sm text-gray-600">
            診療科: {surgery.department} / OR: {surgery.room} / 時間: 09:00 - 10:30
          </p>
        </CardContent>
      </Card>

      <div className="mb-4">
        <p className="font-semibold">🔧 器械出し候補</p>
        <Card className="mb-2">
          <CardContent>
            <p>{scrubNurse.name}（1年目）</p>
            <Progress value={scrubNurse.score} className="my-2" />
            <Badge>{scrubNurse.reason}</Badge>
            <Button className="mt-2" onClick={saveAssignment}>
              このスタッフを割り当てて保存
            </Button>
          </CardContent>
        </Card>

        <p className="font-semibold">🚶 外回り候補</p>
        <Card>
          <CardContent>
            <p>{circulatingNurse.name}（3年目）</p>
            <Progress value={circulatingNurse.score} className="my-2" />
            <Badge>{circulatingNurse.reason}</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AutoAssignmentScreen;
