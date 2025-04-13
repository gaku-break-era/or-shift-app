// src/StaffHome.js
import React from "react";
import { Link } from "react-router-dom";
import StaffScheduleCard from "./StaffScheduleCard";

const testAssignments = [
  {
    date: "2025-04-11",
    room: "OR1",
    procedure: "心臓バイパス術",
    scrubNurse: "川瀬",
    circulatingNurse: "田中",
    assist: "鈴木",
    scrubInstructor: "佐藤",
    circulatingInstructor: "高橋",
    guideLink: "https://example.com/heart-bypass"
  },
  {
    date: "2025-04-12",
    room: "OR2",
    procedure: "人工膝関節置換術",
    scrubNurse: "山本",
    circulatingNurse: "田中",
    guideLink: "https://example.com/knee"
  },
  {
    date: "2025-04-13",
    room: "OR3",
    procedure: "腹腔鏡下胆摘",
    scrubNurse: "川瀬",
    circulatingNurse: "青木",
    assist: "中村"
  }
];

function StaffHome() {
  return (
    <div style={{ padding: "1rem", fontFamily: "sans-serif",maxWidth: "600px", margin: "0 auto",overflowX: "hidden" }}>
      <h1 style={{ textAlign: "center" }}>スタッフホーム画面</h1>

      <section style={{ marginBottom: "2rem" }}>
        <h2>今週の配置</h2>
        <StaffScheduleCard assignments={testAssignments} />
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>各種メニュー</h2>
        <ul style={{ listStyle: "none", padding: 0 }}>
          <li><Link to="/procedure-guides">📘 術式手順書一覧</Link></li>
          <li><Link to="/skills">📊 スキルチャートを見る</Link></li>
          <li><Link to="/manuals">📂 マニュアル検索</Link></li>
          <li><Link to="/">📅 シフト希望を提出</Link></li>
          <li><Link to="/calendar">🗓 イベントカレンダー</Link></li>
          <li><Link to="/assignments">📌 e-learning・提出課題</Link></li>
        </ul>
        <Link to="/procedures">
         <button style={{ marginTop: "1rem" }}>術式手順書を見る</button>
        </Link>

      </section>
    </div>
  );
}

export default StaffHome;
