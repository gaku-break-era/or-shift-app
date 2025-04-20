import React, { useState } from "react";
import dayjs from "dayjs";
import Header from "../components/ui/Header"; // 共通ヘッダーがあれば

function SurgeryRequest() {
  const [selectedDate, setSelectedDate] = useState(dayjs());

  const handlePrev = () => {
    setSelectedDate(prev => prev.subtract(1, "day"));
  };

  const handleNext = () => {
    setSelectedDate(prev => prev.add(1, "day"));
  };

  return (
    <div style={{ padding: "1rem", fontFamily: "sans-serif" }}>
      <Header />

      <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>📝 手術申し込み画面</h2>

      {/* 日付切り替え */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "1rem",
        marginBottom: "1rem"
      }}>
        <button onClick={handlePrev}>◀ 前日</button>
        <strong style={{ fontSize: "1.2rem" }}>
          {selectedDate.format("YYYY年MM月DD日 (ddd)")}
        </strong>
        <button onClick={handleNext}>翌日 ▶</button>
      </div>

      {/* ここからOR × 時間テーブル（仮置き） */}
      <div style={{ overflowX: "scroll", border: "1px solid #ccc", padding: "1rem" }}>
        <table style={{ minWidth: "2000px", borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={{ position: "sticky", left: 0, background: "#fff", border: "1px solid #ccc", padding: "4px" }}>部屋</th>
              {Array.from({ length: 24 }, (_, i) => (
                <th key={i} style={{ border: "1px solid #ccc", padding: "4px", minWidth: "80px" }}>
                  {i}:00
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 20 }, (_, or) => (
              <tr key={or}>
                <td style={{ position: "sticky", left: 0, background: "#f9f9f9", border: "1px solid #ccc", padding: "4px" }}>
                  OR{or + 1}
                </td>
                {Array.from({ length: 24 }, (_, hour) => (
                  <td key={hour} style={{ border: "1px solid #eee", height: "40px", minWidth: "80px" }}>
                    {/* ✅ ここにクリックでモーダル開くなどを入れていく */}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SurgeryRequest;
