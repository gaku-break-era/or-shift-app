import React, { useState, useEffect, useRef, useMemo } from "react";
import dayjs from "dayjs";
import Header from "../components/ui/Header";
import { db } from "../firebase";
import { getDocs, collection } from "firebase/firestore";
import "./SurgeryRequest.css";
import OperatingRoomRow from "./OperatingRoomRow";

function SurgeryRequest() {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [modalInfo, setModalInfo] = useState(null);
  const [surgeryData, setSurgeryData] = useState({});
  const [departments, setDepartments] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const scrollRef = useRef(null);

  const todayStr = useMemo(() => selectedDate.format("YYYY-MM-DD"), [selectedDate]);

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
      scrollRef.current.scrollLeft = 1440;
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
    const key = `${todayStr}_${modalInfo.room}_${modalInfo.start}`;
    setSurgeryData(prev => ({
      ...prev,
      [key]: modalInfo,
    }));
    setModalInfo(null);
  };

  const filteredProcedures = procedures.filter(
    (p) => p.departmentId === modalInfo?.department
  );

  const surgeryEntries = useMemo(() => Object.entries(surgeryData), [surgeryData]);

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
              {Array.from({ length: 96 }, (_, i) => {
                const hour = Math.floor(i / 4);
                const min = (i % 4) * 15;
                return (
                  <th key={i}>{min === 0 ? `${hour}:00` : ""}</th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 20 }, (_, or) => {
              const orNumber = `OR${or + 1}`;
              return (
                <OperatingRoomRow
                  key={orNumber}
                  orNumber={orNumber}
                  todayStr={todayStr}
                  surgeryData={surgeryData}
                  surgeryEntries={surgeryEntries}
                  openModal={openModal}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {modalInfo && (
        <div className="sr-modal-backdrop" onClick={closeModal}>
          <div className="sr-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: "1rem" }}>{todayStr} {modalInfo.room} / {modalInfo.start}</h3>

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
