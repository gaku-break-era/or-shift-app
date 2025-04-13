// src/WeeklyAssignments.js
import React from "react";
import { useNavigate } from "react-router-dom";

const rooms = [...Array(5)].map((_, i) => `手術室 ${i + 1}`); // 仮で5部屋分

function WeeklyAssignments() {
  const today = new Date();
  const startOfWeek = getStartOfWeek(today);
  const days = [...Array(7)].map((_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(date.getDate() + i);
    return {
      date: date.toISOString().split("T")[0],
      label: `${date.getDate()}（${"日月火水木金土"[date.getDay()]}）`,
    };
  });

  return (
    <div style={{ padding: "1rem", fontFamily: "sans-serif", overflowX: "auto" }}>
      <h2>今週の担当配置</h2>
      <table style={{ borderCollapse: "collapse", minWidth: "800px" }}>
        <thead>
          <tr>
            <th style={thStyle}>日付</th>
            {rooms.map((room) => (
              <th key={room} style={thStyle}>{room}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map(({ date, label }) => (
            <tr key={date}>
              <td style={tdStyle}>{label}</td>
              {rooms.map((room) => (
                <td key={room} style={tdStyle}>
                  <div><strong>術式:</strong> 膝関節鏡</div>
                  <div>器械出し: 山田</div>
                  <div>外回り: 佐藤</div>
                  <div>器械指導: 鈴木</div>
                  <div>外回り指導: 高橋</div>
                  <div><a href="/procedures/knee-scope" style={{ fontSize: "0.9rem" }}>手順書</a></div>
                  <div style={{ color: "red", fontSize: "0.8rem" }}>📝「展開の正確さ」に注目</div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const getStartOfWeek = (date) => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // 月曜始まり
  return new Date(date.setDate(diff));
};

const thStyle = {
  border: "1px solid #ccc",
  padding: "8px",
  backgroundColor: "#f5f5f5",
};

const tdStyle = {
  border: "1px solid #ccc",
  padding: "8px",
  fontSize: "0.85rem",
  verticalAlign: "top",
};

export default WeeklyAssignments;
