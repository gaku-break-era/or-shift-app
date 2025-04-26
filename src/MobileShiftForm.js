// src/MobileShiftForm.js - 簡素化・デバッグ強化版（employeeId対応＆安全化）
import React, { useState, useEffect } from "react";
import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "./firebase";
import "./CalendarStyles.css";
import Header from "./components/ui/Header";

function MobileShiftForm() {
  // 日付関連の状態を管理
  const [targetMonth, setTargetMonth] = useState(null);
  const [isEditable, setIsEditable] = useState(false);
  const [calendarData, setCalendarData] = useState([]);
  
  // ユーザー関連の状態
  const [user, setUser] = useState(null);
  const [staffInfo, setStaffInfo] = useState(null);
  
  // UI関連の状態
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedType, setSelectedType] = useState("none");
  const [comment, setComment] = useState("");
  const [shiftData, setShiftData] = useState({});
  const [submitStatus, setSubmitStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState("");

  const auth = getAuth();

  // ユーザー情報取得
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const staffDocs = await getDoc(doc(db, "staffList", currentUser.uid));
          if (staffDocs.exists()) {
            setStaffInfo(staffDocs.data());
          }
        } catch (err) {
          console.error("スタッフ情報取得エラー:", err);
        }
      } else {
        setUser(null);
        setStaffInfo(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // 対象月と編集可能判定の設定
  useEffect(() => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth(); // 0-11
    const currentYear = today.getFullYear();
    let year = currentYear;
    let month = currentDay <= 10 ? currentMonth + 1 : currentMonth + 2;
    if (month > 11) {
      month -= 12;
      year += 1;
    }
    setTargetMonth({ year, month, firstDay: new Date(year, month, 1) });

    let deadlineMonth = month - 1;
    let deadlineYear = year;
    if (deadlineMonth < 0) {
      deadlineMonth = 11;
      deadlineYear -= 1;
    }
    const deadline = new Date(deadlineYear, deadlineMonth, 10, 23, 59, 59);
    setIsEditable(today <= deadline);

    setDebugInfo(`
      今日: ${today.toLocaleDateString()}
      対象月: ${year}年${month + 1}月
      提出期限: ${deadlineYear}年${deadlineMonth + 1}月10日
      編集可能: ${today <= deadline ? "はい" : "いいえ"}
    `);
  }, []);

  // カレンダーデータの生成
  useEffect(() => {
    if (!targetMonth) return;
    setIsLoading(true);

    const { year, month, firstDay } = targetMonth;
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
    fetchPreviousData();
  }, [targetMonth, user, staffInfo]);

  // 過去データの読み込み
  const fetchPreviousData = async () => {
    if (!user || !targetMonth || !staffInfo) {
      setIsLoading(false);
      return;
    }
    try {
      const staffName = `${staffInfo.lastName || ''} ${staffInfo.firstName || ''}`.trim();
      const { year, month } = targetMonth;
      const monthStr = `${year}${String(month + 1).padStart(2, "0")}`;
      const docId = `${staffName}_${monthStr}`;
      const docSnap = await getDoc(doc(db, "shiftRequests", docId));
      if (docSnap.exists()) {
        const data = docSnap.data();
        const convertedData = {};
        (data.shifts || []).forEach(shift => {
          if (shift.date && shift.selection) {
            convertedData[shift.date] = { type: shift.selection, comment: shift.comment || "" };
          }
        });
        setShiftData(convertedData);
        setSubmitStatus("以前の提出データを読み込みました。");
      } else {
        setSubmitStatus("新規データを作成できます。");
      }
    } catch (err) {
      console.error("過去データ読み込みエラー:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 日付クリック処理
  const handleClickDay = (date) => {
    if (!date || !isEditable) return;
    const iso = date.toISOString().split("T")[0];
    const existing = shiftData[iso] || { type: "none", comment: "" };
    setSelectedDate(iso);
    setSelectedType(existing.type);
    setComment(existing.comment);
  };

  // 選択保存処理
  const handleSave = () => {
    if (!isEditable || !selectedDate) return;
    const newData = { ...shiftData, [selectedDate]: { type: selectedType, comment } };
    const offCount = Object.values(newData).filter(d => d.type === "off").length;
    const nightCount = Object.values(newData).filter(d => d.type === "night").length;
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

  // データ送信処理
  const handleSubmit = async () => {
    if (!user || !isEditable || !targetMonth || !staffInfo) {
      if (!user) alert("ログインが必要です");
      if (!isEditable) alert("提出期限を過ぎています");
      if (!targetMonth) alert("対象月が設定されていません");
      if (!staffInfo) alert("スタッフ情報が取得できていません");
      return;
    }

    const staffName = `${staffInfo.lastName || ''} ${staffInfo.firstName || ''}`.trim();
    const { year, month } = targetMonth;
    const monthStr = `${year}${String(month + 1).padStart(2, "0")}`;
    const docId = `${staffName}_${monthStr}`;
    const shifts = Object.entries(shiftData).map(([date, value]) => ({
      date,
      selection: value.type,
      comment: value.comment || "",
    }));

    const dataToSend = {
      employeeId: staffInfo.employeeId,
      name: staffName,
      email: user.email || "",
      submittedAt: Timestamp.now(),
      shifts,
    };

    try {
      await setDoc(doc(db, "shiftRequests", docId), dataToSend);
      setSubmitStatus("送信が完了しました！");
    } catch (err) {
      console.error("送信エラー:", err);
      setSubmitStatus("送信に失敗しました。");
    }
  };

  const getLabelStyle = (type) => {
    switch (type) {
      case "off": return { backgroundColor: "#ffeaea", color: "#d00" };
      case "night": return { backgroundColor: "#e1ecff", color: "#005" };
      default: return {};
    }
  };

  if (isLoading || !targetMonth) {
    return (
      <div className="mobile-form">
        <Header />
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>データを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-form">
      <Header />
      <h2 className="month-title">{targetMonth.year}年{targetMonth.month + 1}月 シフト希望</h2>

      <details style={{ marginBottom: "1rem", fontSize: "0.8rem", color: "#666" }}>
        <summary>デバッグ情報</summary>
        <pre style={{ whiteSpace: "pre-wrap" }}>{debugInfo}</pre>
      </details>

      <div style={{
        backgroundColor: isEditable ? "#e0f7fa" : "#ffebee",
        padding: "0.5rem",
        marginBottom: "1rem",
        borderRadius: "4px",
        fontSize: "0.9rem"
      }}>
        {isEditable
          ? <p style={{ margin: 0 }}><strong>✅ 編集可能期間</strong>：10日までシフト希望を提出できます</p>
          : <p style={{ margin: 0 }}><strong>⚠️ 閲覧のみ</strong>：提出期限を過ぎています</p>}
      </div>

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
                  <td
                    key={idx}
                    className="calendar-cell"
                    onClick={() => handleClickDay(date)}
                    style={{ cursor: isEditable && date ? "pointer" : "default" }}
                  >
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

      <button
        onClick={handleSubmit}
        className="save-btn"
        style={{
          marginBottom: "1rem",
          opacity: isEditable ? 1 : 0.5,
          cursor: isEditable ? "pointer" : "not-allowed"
        }}
        disabled={!isEditable}
      >
        {isEditable ? "この内容で送信" : "提出期限が過ぎています"}
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
                <button className={selectedType === "none" ? "selected" : ""} onClick={() => setSelectedType("none")}>希望なし</button>
                <button className={selectedType === "off" ? "selected" : ""} onClick={() => setSelectedType("off")}>休み希望</button>
                <button className={selectedType === "night" ? "selected" : ""} onClick={() => setSelectedType("night")}>夜勤希望</button>
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
