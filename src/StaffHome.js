import React from "react";
import { Link } from "react-router-dom";
import Header from "./components/ui/Header";

const thisWeekShift = [
  { day: "月", date: "4/22", shift: "◯" },
  { day: "火", date: "4/23", shift: "/" },
  { day: "水", date: "4/24", shift: "X]" },
  { day: "木", date: "4/25", shift: "休" },
  { day: "金", date: "4/26", shift: "◯" },
  { day: "土", date: "4/27", shift: "Y" },
  { day: "日", date: "4/28", shift: "□" }
];

function StaffHome() {
  const todayIndex = 2; // 仮で水曜日（index=2）

  return (
    <div style={{ padding: "1rem", fontFamily: "sans-serif", maxWidth: "600px", margin: "0 auto" }}>
      <Header />

      {/* シフト希望提出ボタン */}
      <Link to="/form">
        <button style={{
          width: "100%",
          padding: "1rem",
          backgroundColor: "#4285F4",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "1rem",
          marginBottom: "1.5rem"
        }}>
          📅 シフト希望を提出する
        </button>
      </Link>

      {/* 今週のシフト表示 */}
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ marginBottom: "0.5rem" }}>今週のシフト</h2>
        <div style={{ display: "flex", overflowX: "auto", gap: "0.5rem" }}>
          {thisWeekShift.map((item, index) => (
            <div
              key={index}
              style={{
                minWidth: "60px",
                padding: "0.5rem",
                backgroundColor: index === todayIndex ? "#E0F2FF" : "#F4F4F4",
                borderRadius: "6px",
                textAlign: "center"
              }}
            >
              <div>{item.day}</div>
              <div style={{ fontSize: "0.8rem", color: "#666" }}>{item.date}</div>
              <div style={{ fontWeight: "bold", marginTop: "0.3rem" }}>{item.shift}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 今週の配置（仮） */}
      <section style={{ marginBottom: "2rem" }}>
        <h2>今週の手術室配置</h2>
        <div style={{
          backgroundColor: "#FAFAFA",
          padding: "1rem",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}>
          <p>🧠 OR3：腹腔鏡下胆摘（川瀬, 青木）</p>
          <p>🦴 OR2：人工膝関節置換術（山本, 田中）</p>
          <p>❤️ OR1：心臓バイパス術（川瀬, 田中, 鈴木）</p>
        </div>
      </section>

      {/* 個人スキル表ボタン */}
      <Link to="/skills">
        <button style={{
          width: "100%",
          padding: "0.8rem",
          backgroundColor: "#34A853",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "1rem",
          marginBottom: "1rem"
        }}>
          📊 自分のスキルチャートを見る
        </button>
      </Link>

      {/* 指導レビュー入力ボタン */}
      <Link to="/review">
        <button style={{
          width: "100%",
          padding: "0.8rem",
          backgroundColor: "#FBBC05",
          color: "#333",
          border: "none",
          borderRadius: "8px",
          fontSize: "1rem"
        }}>
          📝 指導レビューを入力する
        </button>
      </Link>
    </div>
  );
}

export default StaffHome;
