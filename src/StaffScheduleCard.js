// src/StaffScheduleCard.js
import React from "react";

const formatDateShort = (dateStr) => {
  const date = new Date(dateStr);
  const weekday = "日月火水木金土"[date.getDay()];
  return `${date.getDate()}(${weekday})`;
};

function StaffScheduleCard({ assignments }) {
  if (!assignments || assignments.length === 0) {
    return <p>今週の配置データがありません</p>;
  }

  return (
    <div style={{ padding: "1rem" }}>
      {assignments.map((a, index) => (
        <div
          key={index}
          style={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "1rem",
            marginBottom: "1rem",
            backgroundColor: "#f9f9f9",
            boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
          }}
        >
          <h3 style={{ marginTop: 0 }}>📅 {formatDateShort(a.date)}</h3>
          <p>🛏 <strong>部屋：</strong>{a.room || "未定"}</p>
          <p>🔬 <strong>術式：</strong>{a.procedure || "未定"}</p>
          <p>👤 <strong>器械出し：</strong>{a.scrubNurse}</p>
          <p>👥 <strong>外回り：</strong>{a.circulatingNurse}</p>
          {a.assist && <p>🤝 <strong>補助：</strong>{a.assist}</p>}
          {a.scrubInstructor && <p>🧑‍🏫 <strong>器械出し指導：</strong>{a.scrubInstructor}</p>}
          {a.circulatingInstructor && <p>🧑‍🏫 <strong>外回り指導：</strong>{a.circulatingInstructor}</p>}
          {a.guideLink && (
            <p>
              📘 <a href={a.guideLink} target="_blank" rel="noopener noreferrer">
                手順書を見る
              </a>
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export default StaffScheduleCard;
