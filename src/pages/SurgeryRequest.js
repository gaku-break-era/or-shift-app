import React, { useState } from "react";
import dayjs from "dayjs";
import Header from "../components/ui/Header";

function SurgeryRequest() {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [modalInfo, setModalInfo] = useState(null); // {room, hour}
  const [surgeryData, setSurgeryData] = useState({}); // {date-room-hour: {...}}

  const handlePrev = () => setSelectedDate(prev => prev.subtract(1, "day"));
  const handleNext = () => setSelectedDate(prev => prev.add(1, "day"));

  const openModal = (room, hour) => {
    setModalInfo({
      room,
      hour,
      department: "",
      procedure: "",
      surgeon: "",
      start: `${String(hour).padStart(2, "0")}:00`,
      end: `${String(hour + 1).padStart(2, "0")}:00`,
    });
  };

  const closeModal = () => setModalInfo(null);

  const saveSurgery = () => {
    const key = `${selectedDate.format("YYYY-MM-DD")}_${modalInfo.room}_${modalInfo.hour}`;
    setSurgeryData({
      ...surgeryData,
      [key]: modalInfo
    });
    setModalInfo(null);
  };

  return (
    <div style={{ padding: "1rem", fontFamily: "sans-serif" }}>
      <Header />
      <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>📝 手術申し込み画面</h2>

      {/* 日付切り替え */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
        <button onClick={handlePrev}>◀ 前日</button>
        <strong style={{ fontSize: "1.2rem" }}>
          {selectedDate.format("YYYY年MM月DD日 (ddd)")}
        </strong>
        <button onClick={handleNext}>翌日 ▶</button>
      </div>

      {/* OR × 時間テーブル */}
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
            {Array.from({ length: 20 }, (_, or) => {
              const orNumber = `OR${or + 1}`;
              return (
                <tr key={or}>
                  <td style={{ position: "sticky", left: 0, background: "#f9f9f9", border: "1px solid #ccc", padding: "4px" }}>
                    {orNumber}
                  </td>
                  {Array.from({ length: 24 }, (_, hour) => {
  const key = `${selectedDate.format("YYYY-MM-DD")}_${orNumber}_${hour}`;
  const surgery = Object.values(surgeryData).find(s =>
    s.room === orNumber &&
    selectedDate.format("YYYY-MM-DD") === key.split("_")[0] &&
    parseInt(s.start.split(":")[0]) === hour
  );

  const isSurgeryRunning = Object.values(surgeryData).some(s =>
    s.room === orNumber &&
    selectedDate.format("YYYY-MM-DD") === key.split("_")[0] &&
    parseInt(s.start.split(":")[0]) < hour &&
    parseInt(s.end.split(":")[0]) > hour
  );

  if (surgery) {
    const start = parseInt(surgery.start.split(":")[0]);
    const end = parseInt(surgery.end.split(":")[0]);
    const span = end - start;

    return (
      <td
        key={hour}
        colSpan={span}
        style={{
          background: "#d0ebff",
          border: "1px solid #87c4ff",
          minWidth: `${80 * span}px`,
          position: "relative",
          fontSize: "0.75rem",
          cursor: "pointer"
        }}
        onClick={() => openModal(orNumber, hour)}
      >
        {surgery.procedure}（{surgery.start}〜{surgery.end}）
      </td>
    );
  } else if (isSurgeryRunning) {
    return null; // スキップ：colSpanで表示済み
  } else {
    return (
      <td
        key={hour}
        style={{
          border: "1px solid #eee",
          height: "40px",
          minWidth: "80px",
          cursor: "pointer"
        }}
        onClick={() => openModal(orNumber, hour)}
      />
    );
  }
})}

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* モーダル */}
      {modalInfo && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.4)", display: "flex", justifyContent: "center", alignItems: "center"
        }}
          onClick={closeModal}
        >
          <div
            style={{ background: "#fff", padding: "1.5rem", borderRadius: "8px", width: "90%", maxWidth: "400px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: "1rem" }}>
              {selectedDate.format("YYYY-MM-DD")} {modalInfo.room} / {modalInfo.hour}:00
            </h3>
            <input
              type="text"
              placeholder="術式名"
              value={modalInfo.procedure}
              onChange={(e) => setModalInfo({ ...modalInfo, procedure: e.target.value })}
              style={{ width: "100%", marginBottom: "0.5rem", padding: "0.5rem" }}
            />
            <input
              type="text"
              placeholder="診療科"
              value={modalInfo.department}
              onChange={(e) => setModalInfo({ ...modalInfo, department: e.target.value })}
              style={{ width: "100%", marginBottom: "0.5rem", padding: "0.5rem" }}
            />
            <input
              type="text"
              placeholder="執刀医"
              value={modalInfo.surgeon}
              onChange={(e) => setModalInfo({ ...modalInfo, surgeon: e.target.value })}
              style={{ width: "100%", marginBottom: "0.5rem", padding: "0.5rem" }}
            />
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <input
                type="time"
                value={modalInfo.start}
                onChange={(e) => setModalInfo({ ...modalInfo, start: e.target.value })}
                style={{ flex: 1 }}
              />
              <input
                type="time"
                value={modalInfo.end}
                onChange={(e) => setModalInfo({ ...modalInfo, end: e.target.value })}
                style={{ flex: 1 }}
              />
            </div>
            <div style={{ textAlign: "right" }}>
              <button onClick={saveSurgery} style={{ marginRight: "0.5rem" }}>保存</button>
              <button onClick={closeModal}>キャンセル</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SurgeryRequest;
