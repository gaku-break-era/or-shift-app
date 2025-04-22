import React, { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import Header from "../components/ui/Header";
import { db } from "../firebase";
import { getDocs, collection } from "firebase/firestore";
import "./SurgeryRequest.css";

function SurgeryRequest() {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [modalInfo, setModalInfo] = useState(null);
  const [surgeryData, setSurgeryData] = useState({});
  const [departments, setDepartments] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      const deptSnap = await getDocs(collection(db, "departments"));
      const procSnap = await getDocs(collection(db, "procedures"));
      setDepartments(deptSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setProcedures(procSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 720;
    }
  }, []);

  const scrollToCurrentHour = () => {
    const now = dayjs();
    const quarter = now.hour() * 4 + Math.floor(now.minute() / 15);
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = quarter * 40;
    }
  };

  const handlePrev = () => setSelectedDate(prev => prev.subtract(1, "day"));
  const handleNext = () => setSelectedDate(prev => prev.add(1, "day"));

  const openModal = (room, quarter) => {
    const hour = Math.floor(quarter / 4);
    const minutes = (quarter % 4) * 15;
    const start = dayjs().hour(hour).minute(minutes).format("HH:mm");
    const end = dayjs().hour(hour).minute(minutes + 15).format("HH:mm");
    setModalInfo({
      room,
      quarter,
      department: "",
      procedure: "",
      surgeon: "",
      anesthesia: "",
      position: "",
      start,
      end,
    });
  };

  const closeModal = () => setModalInfo(null);

  const saveSurgery = () => {
    const key = `${selectedDate.format("YYYY-MM-DD")}_${modalInfo.room}_${modalInfo.start}`;
    setSurgeryData({
      ...surgeryData,
      [key]: modalInfo,
    });
    setModalInfo(null);
  };

  const filteredProcedures = procedures.filter(
    (p) => p.departmentId === modalInfo?.department
  );

  return (
    <div style={{ padding: "1rem" }}>
      <Header />
      <h2 className="sr-title">📝 手術申し込み画面</h2>

      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <button onClick={handlePrev}>◀ 前日</button>
        <strong style={{ fontSize: "1.2rem" }}>{selectedDate.format("YYYY年MM月DD日 (ddd)")}</strong>
        <button onClick={handleNext}>翌日 ▶</button>
        <button onClick={scrollToCurrentHour}>🕒 現在時刻へ</button>
      </div>

      <div ref={scrollRef} className="sr-container">
        <table className="sr-table">
          <thead>
            <tr>
              <th>部屋</th>
              {Array.from({ length: 96 }, (_, i) => (
                <th key={i}>{Math.floor(i / 4)}:{(i % 4) * 15 === 0 ? "00" : (i % 4) * 15}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 20 }, (_, or) => {
              const orNumber = `OR${or + 1}`;
              return (
                <tr key={or}>
                  <td className="sr-room" style={{ height: "80px" }}>{orNumber}</td>
                  {Array.from({ length: 96 }, (_, quarter) => {
                    const hour = Math.floor(quarter / 4);
                    const min = (quarter % 4) * 15;
                    const currentKey = `${selectedDate.format("YYYY-MM-DD")}_${orNumber}_${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
                    const surgery = Object.values(surgeryData).find(s =>
                      s.room === orNumber &&
                      selectedDate.format("YYYY-MM-DD") === selectedDate.format("YYYY-MM-DD") &&
                      s.start === `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`
                    );

                    const isRunning = Object.values(surgeryData).some(s => {
                      if (s.room !== orNumber) return false;
                      const sStart = dayjs(`${selectedDate.format("YYYY-MM-DD")} ${s.start}`);
                      const sEnd = dayjs(`${selectedDate.format("YYYY-MM-DD")} ${s.end}`);
                      const t = dayjs(`${selectedDate.format("YYYY-MM-DD")} ${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
                      return t.isAfter(sStart.subtract(1, 'minute')) && t.isBefore(sEnd);
                    });

                    if (surgery) {
                      const start = dayjs(`${selectedDate.format("YYYY-MM-DD")} ${surgery.start}`);
                      const end = dayjs(`${selectedDate.format("YYYY-MM-DD")} ${surgery.end}`);
                      const span = end.diff(start, "minute") / 15;
                      return (
                        <td
                          key={quarter}
                          colSpan={span}
                          style={{
                            background: "#d0ebff",
                            border: "1px solid #87c4ff",
                            minWidth: `${40 * span}px`,
                            fontSize: "0.7rem",
                            whiteSpace: "pre-line",
                            lineHeight: 1.3,
                            padding: "4px",
                            cursor: "pointer",
                            height: "80px",
                            verticalAlign: "top"
                          }}
                          onClick={() => openModal(orNumber, quarter)}
                        >
                          <div style={{ fontWeight: "bold", fontSize: "0.85rem" }}>{surgery.procedure}</div>
                          {`${surgery.start}〜${surgery.end}\n${surgery.surgeon}\n${surgery.position}\n${surgery.anesthesia}`}
                        </td>
                      );
                    } else if (isRunning) {
                      return null;
                    } else {
                      return <td key={quarter} className="sr-cell" style={{ height: "80px" }} onClick={() => openModal(orNumber, quarter)} />;
                    }
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
            <h3 style={{ marginBottom: "1rem" }}>{selectedDate.format("YYYY-MM-DD")} {modalInfo.room} / {modalInfo.start}</h3>

            <select value={modalInfo.department} onChange={(e) => setModalInfo({ ...modalInfo, department: e.target.value, procedure: "" })} className="sr-input">
              <option value="">診療科を選択</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>

            <select value={modalInfo.procedure} onChange={(e) => setModalInfo({ ...modalInfo, procedure: e.target.value })} className="sr-input">
              <option value="">術式を選択</option>
              {filteredProcedures.map((proc) => (
                <option key={proc.id} value={proc.name}>{proc.name}</option>
              ))}
            </select>

            <input type="text" placeholder="執刀医" value={modalInfo.surgeon} onChange={(e) => setModalInfo({ ...modalInfo, surgeon: e.target.value })} className="sr-input" />
            <input type="text" placeholder="体位" value={modalInfo.position} onChange={(e) => setModalInfo({ ...modalInfo, position: e.target.value })} className="sr-input" />
            <input type="text" placeholder="麻酔方法" value={modalInfo.anesthesia} onChange={(e) => setModalInfo({ ...modalInfo, anesthesia: e.target.value })} className="sr-input" />

            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <input type="time" step="900" value={modalInfo.start} onChange={(e) => setModalInfo({ ...modalInfo, start: e.target.value })} style={{ flex: 1 }} />
              <input type="time" step="900" value={modalInfo.end} onChange={(e) => setModalInfo({ ...modalInfo, end: e.target.value })} style={{ flex: 1 }} />
            </div>

            <div style={{ textAlign: "right" }}>
              <button onClick={saveSurgery} style={{ marginRight: "0.5rem" }}>保存</button>
              <button className="sr-close" onClick={closeModal}>キャンセル</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SurgeryRequest;
