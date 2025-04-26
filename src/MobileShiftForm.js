// src/MobileShiftForm.js - 修正版
import React, { useState, useEffect } from "react";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "./firebase";
import "./CalendarStyles.css";
import Header from "./components/ui/Header";

function MobileShiftForm() {
  const today = new Date();
  const targetMonth =
    today.getDate() <= 10
      ? new Date(today.getFullYear(), today.getMonth() + 1, 1)
      : new Date(today.getFullYear(), today.getMonth() + 2, 1);

  const [calendarData, setCalendarData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedType, setSelectedType] = useState("none");
  const [comment, setComment] = useState("");
  const [shiftData, setShiftData] = useState({});
  const [user, setUser] = useState(null);
  const [submitStatus, setSubmitStatus] = useState("");

  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const year = targetMonth.getFullYear();
    const month = targetMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const matrix = [];
    let week = [];

    for (let i = 0; i < firstDay.getDay(); i++) week.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      week.push(new Date(year, month, d));
      if (week.length === 7) {
        matrix.push(week);
        week = [];
      }
    }
    if (week.length) {
      while (week.length < 7) week.push(null);
      matrix.push(week);
    }

    setCalendarData(matrix);
  }, [targetMonth]);

  const handleClickDay = (date) => {
    if (!date) return;
    const iso = date.toISOString().split("T")[0];
    const existing = shiftData[iso] || { type: "none", comment: "" };
    setSelectedDate(iso);
    setSelectedType(existing.type);
    setComment(existing.comment);
  };

  const handleSave = () => {
    const newData = { ...shiftData, [selectedDate]: { type: selectedType, comment } };

    const offCount = Object.values(newData).filter((d) => d.type === "off").length;
    const nightCount = Object.values(newData).filter((d) => d.type === "night").length;

    if (offCount + nightCount > 3) {
      alert("休み希望（夜勤含む）は最大3日までです。");
      return;
    }
    if (nightCount > 1) {
      alert("夜勤希望は最大1回までです。");
      return;
    }

    setShiftData(newData);
    setSelectedDate(null);
  };

  const handleSubmit = async () => {
    if (!user) {
      alert("ログインが必要です");
      return;
    }

    const year = targetMonth.getFullYear();
    const month = targetMonth.getMonth() + 1;
    const docId = `${user.displayName || user.email}_${year}${String(month).padStart(2, "0")}`;

    // 変更点: shiftsの構造を修正して一貫性を保つ
    const shifts = Object.entries(shiftData).map(([date, value]) => ({
      date, // date はシンプルに YYYY-MM-DD 形式の文字列
      selection: value.type,
      comment: value.comment || "",
    }));

    const dataToSend = {
      name: user.displayName || "",
      email: user.email || "",
      submittedAt: Timestamp.now(),
      shifts,
    };

    try {
      await setDoc(doc(db, "shiftRequests", docId), dataToSend);
      console.log("送信データ:", dataToSend); // デバッグ用
      setSubmitStatus("送信が完了しました！");
    } catch (err) {
      console.error("送信エラー:", err);
      setSubmitStatus("送信に失敗しました。");
    }
  };

  const getLabelStyle = (type) => {
    switch (type) {
      case "off":
        return { backgroundColor: "#ffeaea", color: "#d00" };
      case "night":
        return { backgroundColor: "#e1ecff", color: "#005" };
      default:
        return {};
    }
  };

  return (
    <div className="mobile-form">
      <Header />

      <h2 className="month-title">
        {targetMonth.getFullYear()}年{targetMonth.getMonth() + 1}月 シフト希望
      </h2>

      <div className="weekday-row">
        {["日", "月", "火", "水", "木", "金", "土"].map((d, i) => (
          <div key={i} className={`weekday ${i === 0 ? "sun" : i === 6 ? "sat" : ""}`}>
            {d}
          </div>
        ))}
      </div>

      <table className="calendar">
        <tbody>
          {calendarData.map((week, i) => (
            <tr key={i}>
              {week.map((date, idx) => {
                const iso = date ? date.toISOString().split("T")[0] : "";
                const shift = shiftData[iso];
                return (
                  <td key={idx} className="calendar-cell" onClick={() => handleClickDay(date)}>
                    {date && (
                      <>
                        <div className="day-number">{date.getDate()}</div>
                        {shift && shift.type !== "none" && (
                          <div className="shift-type" style={getLabelStyle(shift.type)}>
                            {shift.type === "off" ? "休み希望" : "夜勤希望"}
                          </div>
                        )}
                        {shift && shift.comment && (
                          <div className="shift-comment">{shift.comment.slice(0, 8)}...</div>
                        )}
                      </>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={handleSubmit} className="save-btn" style={{ marginBottom: "1rem" }}>
        この内容で送信
      </button>
      {submitStatus && <p style={{ color: "green", textAlign: "center" }}>{submitStatus}</p>}

      {/* モーダル */}
      {selectedDate && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>{selectedDate}</h3>
              <button onClick={() => setSelectedDate(null)} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <div className="select-buttons">
                <button
                  className={selectedType === "none" ? "selected" : ""}
                  onClick={() => setSelectedType("none")}
                >
                  希望なし
                </button>
                <button
                  className={selectedType === "off" ? "selected" : ""}
                  onClick={() => setSelectedType("off")}
                >
                  休み希望
                </button>
                <button
                  className={selectedType === "night" ? "selected" : ""}
                  onClick={() => setSelectedType("night")}
                >
                  夜勤希望
                </button>
              </div>
              <textarea
                rows={3}
                placeholder="コメント（任意）"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="comment-box"
              />
              <button onClick={handleSave} className="save-btn">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MobileShiftForm;