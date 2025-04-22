import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import Header from "../components/ui/Header";
import "./SurgeryRequest.css";

import {
  db
} from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  doc as docRef,
} from "firebase/firestore";

function SurgeryRequest() {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [modalInfo, setModalInfo] = useState(null);
  const [surgeryData, setSurgeryData] = useState({});
  const [departments, setDepartments] = useState([]);
  const [procedures, setProcedures] = useState([]);

  const openModal = (room, hour, existingData = null) => {
    if (existingData) {
      setModalInfo(existingData);
    } else {
      setModalInfo({
        room,
        hour,
        department: "",
        procedure: "",
        surgeon: "",
        position: "",
        anesthesia: "",
        start: `${String(hour).padStart(2, "0")}:00`,
        end: `${String(hour + 1).padStart(2, "0")}:00`,
      });
    }
  };

  const closeModal = () => setModalInfo(null);

  const saveSurgery = async () => {
    const key = `${selectedDate.format("YYYY-MM-DD")}_${modalInfo.room}_${modalInfo.start}`;

    if (modalInfo.docId) {
      const ref = docRef(db, "surgerySchedules", modalInfo.docId);
      await updateDoc(ref, {
        ...modalInfo,
        updatedAt: Timestamp.now(),
      });
    } else {
      const docSnap = await addDoc(collection(db, "surgerySchedules"), {
        ...modalInfo,
        date: selectedDate.format("YYYY-MM-DD"),
        createdAt: Timestamp.now(),
      });
      modalInfo.docId = docSnap.id;
    }

    setSurgeryData((prev) => ({ ...prev, [key]: modalInfo }));
    setModalInfo(null);
  };

  const handleDelete = async () => {
    if (!modalInfo.docId) return;
    const ref = docRef(db, "surgerySchedules", modalInfo.docId);
    await deleteDoc(ref);

    const key = `${selectedDate.format("YYYY-MM-DD")}_${modalInfo.room}_${modalInfo.start}`;
    const newData = { ...surgeryData };
    delete newData[key];
    setSurgeryData(newData);
    setModalInfo(null);
  };

  const handlePrev = () => setSelectedDate((prev) => prev.subtract(1, "day"));
  const handleNext = () => setSelectedDate((prev) => prev.add(1, "day"));

  useEffect(() => {
    const fetchSurgeryData = async () => {
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

    fetchSurgeryData();
  }, [selectedDate]);

  useEffect(() => {
    const fetchMaster = async () => {
      const deptSnap = await getDocs(collection(db, "departments"));
      const procSnap = await getDocs(collection(db, "procedures"));
      setDepartments(deptSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setProcedures(procSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchMaster();
  }, []);

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
                    const targetTime = `${String(hour).padStart(2, "0")}:00`;
                    const key = `${selectedDate.format("YYYY-MM-DD")}_${orNumber}_${targetTime}`;
                    const surgery = surgeryData[key];

                    const isCovered = Object.values(surgeryData).some(s => {
                      if (s.room !== orNumber) return false;
                      const start = dayjs(`${selectedDate.format("YYYY-MM-DD")} ${s.start}`);
                      const end = dayjs(`${selectedDate.format("YYYY-MM-DD")} ${s.end}`);
                      const current = dayjs(`${selectedDate.format("YYYY-MM-DD")} ${targetTime}`);
                      return current.isAfter(start) && current.isBefore(end);
                    });
                    if (isCovered && !surgery) return null;

                    if (surgery) {
                      const startHour = parseInt(surgery.start.split(":")[0]);
                      const endHour = parseInt(surgery.end.split(":")[0]);
                      const span = endHour - startHour;

                      return (
                        <td
                          key={hour}
                          colSpan={span}
                          onClick={() => openModal(orNumber, startHour, surgery)}
                          style={{
                            backgroundColor: "#d0ebff",
                            border: "1px solid #87c4ff",
                            padding: "4px",
                            fontSize: "0.7rem",
                            textAlign: "left"
                          }}
                        >
                          <strong>{surgery.procedure}</strong><br />
                          {surgery.surgeon}<br />
                          {surgery.position}<br />
                          {surgery.anesthesia}<br />
                          {surgery.start}~{surgery.end}
                        </td>
                      );
                    }

                    return (
                      <td
                        key={hour}
                        className="sr-cell"
                        onClick={() => openModal(orNumber, hour)}
                      />
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

            <select
              className="sr-input"
              value={modalInfo.department}
              onChange={(e) =>
                setModalInfo({
                  ...modalInfo,
                  department: e.target.value,
                  procedure: "", // 診療科変わったらリセット
                })
              }
            >
              <option value="">診療科を選択</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>

            <select
              className="sr-input"
              value={modalInfo.procedure}
              onChange={(e) =>
                setModalInfo({
                  ...modalInfo,
                  procedure: e.target.value,
                })
              }
            >
              <option value="">術式を選択</option>
              {procedures
                .filter((p) => p.departmentId === modalInfo.department)
                .map((proc) => (
                  <option key={proc.id} value={proc.name}>
                    {proc.name}
                  </option>
                ))}
            </select>

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
              {modalInfo.docId && (
                <button
                  onClick={handleDelete}
                  style={{
                    marginRight: "0.5rem",
                    background: "#f66",
                    color: "#fff",
                    border: "none",
                    padding: "0.5rem 1rem",
                    cursor: "pointer",
                  }}
                >
                  削除
                </button>
              )}
              <button onClick={saveSurgery} style={{ marginRight: "0.5rem" }}>
                保存
              </button>
              <button onClick={closeModal} className="sr-close">
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SurgeryRequest;
