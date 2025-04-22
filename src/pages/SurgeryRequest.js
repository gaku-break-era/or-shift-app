import React, { useState, useEffect, useRef, useMemo } from "react";
import dayjs from "dayjs";
import Header from "../components/ui/Header";
import { db } from "../firebase";
import { getDocs, collection } from "firebase/firestore";
import "./SurgeryRequest.css";
import OperatingRoomRow from "./OperatingRoomRow";
import { useVirtualizer } from '@tanstack/react-virtual';

function SurgeryRequest() {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [modalInfo, setModalInfo] = useState(null);
  const [surgeryData, setSurgeryData] = useState({});
  const [departments, setDepartments] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const scrollRef = useRef(null);
  const orScrollParentRef = useRef(null);

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
      scrollRef.current.scrollLeft = 60 * 36; // 9:00 = index 36 × 60px
    }
  }, []);

  const scrollToCurrentHour = () => {
    const now = dayjs();
    const quarter = now.hour() * 4 + Math.floor(now.minute() / 15);
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 60 * quarter;
    }
  };

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

  const surgeryMap = useMemo(() => {
    const map = new Map();
    for (const [key, value] of Object.entries(surgeryData)) {
      const [_, room, time] = key.split("_");
      if (!map.has(room)) map.set(room, new Map());
      map.get(room).set(time, value);
    }
    return map;
  }, [surgeryData]);

  const rowVirtualizer = useVirtualizer({
    count: 20,
    getScrollElement: () => orScrollParentRef.current,
    estimateSize: () => 82,
    overscan: 5,
  });

  const currentQuarterIndex = useMemo(() => {
    const now = dayjs();
    return now.hour() * 4 + Math.floor(now.minute() / 15);
  }, []);

  const blinkingLineStyle = {
    left: `${60 * currentQuarterIndex}px`,
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "2px",
    background: "red",
    animation: "blink 1s infinite",
    zIndex: 5,
  };
  return (
    <div style={{ padding: "1rem" }}>
      <Header />
      <h2 className="sr-title">📝 手術申し込み画面</h2>

      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "1rem",
        marginBottom: "1rem",
        flexWrap: "wrap"
      }}>
        <button onClick={handlePrev}>◀ 前日</button>
        <strong style={{ fontSize: "1.2rem" }}>
          {selectedDate.format("YYYY年MM月DD日 (ddd)")}
        </strong>
        <button onClick={handleNext}>翌日 ▶</button>
        <button onClick={scrollToCurrentHour}>🕒 現在時刻へ</button>
      </div>

      {/* 時間ラベルヘッダー */}
      <div style={{ display: "flex", position: "relative", zIndex: 1 }}>
        <div style={{ width: 60, background: "#fff" }}></div>
        <div
          style={{
            overflowX: "scroll",
            flexGrow: 1,
            position: "relative",
          }}
          ref={scrollRef}
        >
          <div style={{ display: "flex", width: 60 * 96 }}>
            {Array.from({ length: 96 }, (_, i) => {
              const hour = Math.floor(i / 4);
              const min = (i % 4) * 15;
              return (
                <div
                  key={i}
                  style={{
                    width: 60,
                    height: 30,
                    textAlign: "center",
                    fontSize: "0.75rem",
                    color: "#666",
                    borderRight: "1px solid #eee",
                  }}
                >
                  {min === 0 ? `${hour}:00` : ""}
                </div>
              );
            })}
            <div className="blinking-line" style={blinkingLineStyle} />
          </div>
        </div>
      </div>

      {/* OR行表示 */}
      <div style={{ display: "flex" }}>
        {/* 左列：OR番号 */}
        <div style={{ width: 60 }}>
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={i}
              style={{
                height: 82,
                textAlign: "center",
                lineHeight: "82px",
                background: "#f9f9f9",
                borderBottom: "1px solid #ddd",
                fontWeight: "bold"
              }}
            >
              OR{i + 1}
            </div>
          ))}
        </div>

        {/* 右列：ORセル */}
        <div
          ref={orScrollParentRef}
          style={{ overflowY: "auto", height: "800px", position: "relative", flexGrow: 1 }}
        >
          <div
            style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: "relative" }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const orNumber = `OR${virtualRow.index + 1}`;
              return (
                <div
                  key={orNumber}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    transform: `translateY(${virtualRow.start}px)`,
                    height: `${virtualRow.size}px`,
                    width: "100%",
                  }}
                >
                  <OperatingRoomRow
                    orNumber={orNumber}
                    todayStr={todayStr}
                    surgeryMap={surgeryMap}
                    openModal={openModal}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* モーダル */}
      {modalInfo && (
        <div className="sr-modal-backdrop" onClick={closeModal}>
          <div className="sr-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: "1rem" }}>
              {todayStr} {modalInfo.room} / {modalInfo.start}
            </h3>

            <select
              value={modalInfo.department}
              onChange={(e) =>
                setModalInfo({
                  ...modalInfo,
                  department: e.target.value,
                  procedure: ""
                })
              }
              className="sr-input"
            >
              <option value="">診療科を選択</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>

            <select
              value={modalInfo.procedure}
              onChange={(e) =>
                setModalInfo({ ...modalInfo, procedure: e.target.value })
              }
              className="sr-input"
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
              type="text"
              placeholder="執刀医"
              value={modalInfo.surgeon}
              onChange={(e) =>
                setModalInfo({ ...modalInfo, surgeon: e.target.value })
              }
              className="sr-input"
            />
            <input
              type="text"
              placeholder="体位"
              value={modalInfo.position}
              onChange={(e) =>
                setModalInfo({ ...modalInfo, position: e.target.value })
              }
              className="sr-input"
            />
            <input
              type="text"
              placeholder="麻酔方法"
              value={modalInfo.anesthesia}
              onChange={(e) =>
                setModalInfo({ ...modalInfo, anesthesia: e.target.value })
              }
              className="sr-input"
            />

            <div
              style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}
            >
              <input
                type="time"
                step="900"
                value={modalInfo.start}
                onChange={(e) =>
                  setModalInfo({ ...modalInfo, start: e.target.value })
                }
                style={{ flex: 1 }}
              />
              <input
                type="time"
                step="900"
                value={modalInfo.end}
                onChange={(e) =>
                  setModalInfo({ ...modalInfo, end: e.target.value })
                }
                style={{ flex: 1 }}
              />
            </div>

            <div style={{ textAlign: "right" }}>
              <button
                onClick={saveSurgery}
                style={{ marginRight: "0.5rem" }}
              >
                保存
              </button>
              <button className="sr-close" onClick={closeModal}>
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
