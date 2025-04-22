import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import Header from "../components/ui/Header";
import "./SurgeryRequest.css";

function SurgeryRequest() {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [modalInfo, setModalInfo] = useState(null);
  const [surgeryData, setSurgeryData] = useState({});

  const openModal = (room, hour) => {
    setModalInfo({
      room,
      hour,
      procedure: "",
      surgeon: "",
      position: "",
      anesthesia: "",
      start: `${String(hour).padStart(2, "0")}:00`,
      end: `${String(hour + 1).padStart(2, "0")}:00`,
    });
  };

  const closeModal = () => setModalInfo(null);

  const saveSurgery = () => {
    const key = `${selectedDate.format("YYYY-MM-DD")}_${modalInfo.room}_${modalInfo.hour}`;
    setSurgeryData((prev) => ({ ...prev, [key]: modalInfo }));
    setModalInfo(null);
  };

  const handlePrev = () => setSelectedDate((prev) => prev.subtract(1, "day"));
  const handleNext = () => setSelectedDate((prev) => prev.add(1, "day"));

  return (
    <div style={{ padding: "1rem" }}>
      <Header />
      <h2 className="sr-title">📝 手術申し込み画面</h2>

      <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginBottom: "1rem" }}>
        <button onClick={handlePrev}>◀ 前日</button>
        <strong>{selectedDate.format("YYYY年MM月DD日 (ddd)")}</strong>
        <button onClick={handleNext}>翌日 ▶</button>
      </div>

      <div className="sr-container">
        <table className="sr-table">
          <thead>
            <tr>
              <th>部屋</th>
              {Array.from({ length: 24 }, (_, i) => (
                <th key={i}>{`${i}:00`}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 20 }, (_, i) => {
              const orNumber = `OR${i + 1}`;
              return (
                <tr key={orNumber}>
                  <td className="sr-room">{orNumber}</td>
                  {Array.from({ length: 24 }, (_, hour) => {
                    const key = `${selectedDate.format("YYYY-MM-DD")}_${orNumber}_${hour}`;
                    const surgery = surgeryData[key];
                    return (
                      <td
                        key={hour}
                        className="sr-cell"
                        onClick={() => openModal(orNumber, hour)}
                      >
                        {surgery ? (
                          <div style={{ textAlign: "left", fontSize: "0.7rem" }}>
                            <strong>{surgery.procedure}</strong><br />
                            {surgery.surgeon}<br />
                            {surgery.position}<br />
                            {surgery.anesthesia}<br />
                            {surgery.start}~{surgery.end}
                          </div>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modalInfo && (
        <div className="sr-modal-backdrop" onClick={closeModal}>
          <div className="sr-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{modalInfo.room} - {modalInfo.start}</h3>
            <input
              className="sr-input"
              placeholder="術式名"
              value={modalInfo.procedure}
              onChange={(e) => setModalInfo({ ...modalInfo, procedure: e.target.value })}
            />
            <input
              className="sr-input"
              placeholder="執刀医"
              value={modalInfo.surgeon}
              onChange={(e) => setModalInfo({ ...modalInfo, surgeon: e.target.value })}
            />
            <input
              className="sr-input"
              placeholder="体位"
              value={modalInfo.position}
              onChange={(e) => setModalInfo({ ...modalInfo, position: e.target.value })}
            />
            <input
              className="sr-input"
              placeholder="麻酔方法"
              value={modalInfo.anesthesia}
              onChange={(e) => setModalInfo({ ...modalInfo, anesthesia: e.target.value })}
            />
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="time"
                value={modalInfo.start}
                onChange={(e) => setModalInfo({ ...modalInfo, start: e.target.value })}
              />
              <input
                type="time"
                value={modalInfo.end}
                onChange={(e) => setModalInfo({ ...modalInfo, end: e.target.value })}
              />
            </div>
            <div style={{ textAlign: "right", marginTop: "1rem" }}>
              <button onClick={saveSurgery}>保存</button>
              <button onClick={closeModal} className="sr-close">キャンセル</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SurgeryRequest;
