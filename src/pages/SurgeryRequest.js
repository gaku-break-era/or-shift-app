
import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import Header from "../components/ui/Header";
import "./SurgeryRequest.css";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc as docRef,
  deleteDoc,
  updateDoc,
  Timestamp,
  addDoc,
} from "firebase/firestore";

function SurgeryRequest() {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [modalInfo, setModalInfo] = useState(null);
  const [surgeryData, setSurgeryData] = useState({});
  const [mode, setMode] = useState("request");
  const [selectedSurgery, setSelectedSurgery] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const q = query(
        collection(db, "surgerySchedules"),
        where("date", "==", selectedDate.format("YYYY-MM-DD"))
      );
      const querySnapshot = await getDocs(q);
      const loadedData = {};
      querySnapshot.forEach((doc) => {
        const d = doc.data();
        const key = `${d.date}_${d.room}_${d.start}`;
        loadedData[key] = { ...d, docId: doc.id };
      });
      setSurgeryData(loadedData);
    };

    fetchData();
  }, [selectedDate]);

  const handlePrev = () => setSelectedDate((prev) => prev.subtract(1, "day"));
  const handleNext = () => setSelectedDate((prev) => prev.add(1, "day"));

  const openModal = (room, quarterHour) => {
    const hour = Math.floor(quarterHour / 4);
    const minute = (quarterHour % 4) * 15;
    const start = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

    const end = `${String(hour).padStart(2, "0")}:${String(minute + 15).padStart(2, "0")}`;

    setModalInfo({
      room,
      hour,
      start,
      end,
      surgeon: "",
      procedure: "",
      position: "",
      anesthesia: "",
    });
  };

  const handleCellClick = (room, quarter, surgery) => {
    if (mode === "request") {
      if (surgery) {
        setModalInfo(surgery);
      } else {
        openModal(room, quarter);
      }
    } else if (mode === "assignment" && surgery) {
      setSelectedSurgery(surgery);
      setShowAssignModal(true);
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <Header />
      <h2 className="sr-title">📝 手術申し込み画面</h2>
      <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginBottom: "1rem" }}>
        <button onClick={handlePrev}>◀ 前日</button>
        <strong>{selectedDate.format("YYYY年MM月DD日 (ddd)")}</strong>
        <button onClick={handleNext}>翌日 ▶</button>
      </div>

      <div style={{ textAlign: "center", marginBottom: "1rem" }}>
        <label>
          <input type="radio" checked={mode === "request"} onChange={() => setMode("request")} />
          手術申込モード
        </label>
        <label style={{ marginLeft: "1rem" }}>
          <input type="radio" checked={mode === "assignment"} onChange={() => setMode("assignment")} />
          配置作成モード
        </label>
      </div>

      <div className="sr-container">
        <table className="sr-table">
          <thead>
            <tr>
              <th>部屋</th>
              {Array.from({ length: 96 }, (_, i) => {
                const hour = Math.floor(i / 4);
                const minute = (i % 4) * 15;
                return (
                  <th key={i}>
                    {minute === 0 ? `${hour}:00` : ""}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 20 }, (_, orIndex) => {
              const room = `OR${orIndex + 1}`;
              return (
                <tr key={room}>
                  <td className="sr-room">{room}</td>
                  {Array.from({ length: 96 }, (_, quarter) => {
                    const hour = Math.floor(quarter / 4);
                    const minute = (quarter % 4) * 15;
                    const currentTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
                    const key = `${selectedDate.format("YYYY-MM-DD")}_${room}_${currentTime}`;
                    const surgery = surgeryData[key];
                    const isCovered = Object.values(surgeryData).some(s => {
                      if (s.room !== room) return false;
                      const start = dayjs(`${selectedDate.format("YYYY-MM-DD")} ${s.start}`);
                      const end = dayjs(`${selectedDate.format("YYYY-MM-DD")} ${s.end}`);
                      const current = dayjs(`${selectedDate.format("YYYY-MM-DD")} ${currentTime}`);
                      return current.isAfter(start) && current.isBefore(end);
                    });
                    if (isCovered && !surgery) return null;
                    if (surgery) {
                      const startHour = parseInt(surgery.start.split(":")[0]);
                      const startMin = parseInt(surgery.start.split(":")[1]);
                      const endHour = parseInt(surgery.end.split(":")[0]);
                      const endMin = parseInt(surgery.end.split(":")[1]);
                      const span = ((endHour * 60 + endMin) - (startHour * 60 + startMin)) / 15;
                      return (
                        <td key={quarter} colSpan={span} onClick={() => handleCellClick(room, quarter, surgery)} style={{
                          backgroundColor: "#d0ebff",
                          border: "1px solid #87c4ff",
                          fontSize: "0.7rem",
                          textAlign: "left"
                        }}>
                          <strong>{surgery.procedure}</strong><br />
                          {surgery.surgeon}<br />
                          {surgery.start}~{surgery.end}
                        </td>
                      );
                    }
                    return (
                      <td key={quarter} className="sr-cell" onClick={() => handleCellClick(room, quarter, null)} />
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showAssignModal && selectedSurgery && (
        <div className="sr-modal-backdrop" onClick={() => setShowAssignModal(false)}>
          <div className="sr-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{selectedSurgery.room} - {selectedSurgery.start} のAI候補</h3>
            {["scrub", "circulating"].map(role => (
              <div key={role} style={{ marginBottom: "1rem" }}>
                <h4>{role === "scrub" ? "🔧 器械出し候補" : "🚶 外回り候補"}</h4>
                {(selectedSurgery.aiCandidates?.[role] || []).map((c, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <div>
                      {c.name}（{c.experience}年目）<br />
                      <span style={{ fontSize: "0.8rem", color: "#666" }}>{c.reason}</span>
                    </div>
                    {selectedSurgery[role]?.name === c.name ? (
                      <span style={{ color: "green" }}>✅ 割り当て済み</span>
                    ) : (
                      <button
                        onClick={async () => {
                          const ref = docRef(db, "surgerySchedules", selectedSurgery.docId);
                          await updateDoc(ref, { [role]: c });
                          alert(`${c.name} さんを ${role === "scrub" ? "器械出し" : "外回り"} に割り当てました`);
                          setShowAssignModal(false);
                        }}
                      >
                        割り当て
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ))}
            <div style={{ textAlign: "right", marginTop: "1rem" }}>
              <button onClick={() => setShowAssignModal(false)} className="sr-close">閉じる</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SurgeryRequest;