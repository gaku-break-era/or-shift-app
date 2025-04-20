import React, { useState, useEffect } from "react";
import "./CalendarStyles.css"; // カスタムスタイル用のCSSを追加（別途作成）

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
  const [shiftData, setShiftData] = useState({}); // { "2025-06-01": {type, comment} }

  useEffect(() => {
    const year = targetMonth.getFullYear();
    const month = targetMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const matrix = [];
    let week = [];

    // 空白マス埋め（前月分）
    for (let i = 0; i < firstDay.getDay(); i++) {
      week.push(null);
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      week.push(new Date(year, month, d));
      if (week.length === 7) {
        matrix.push(week);
        week = [];
      }
    }

    // 空白マス埋め（翌月分）
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
    if (offCount > 3) {
      alert("休み希望（夜勤含む）は最大3日までです。");
      return;
    }
    setShiftData(newData);
    setSelectedDate(null);
  };

  const getLabelStyle = (type) => {
    switch (type) {
      case "off":
        return { backgroundColor: "#ffdddd", color: "#d00" };
      case "night":
        return { backgroundColor: "#ddeeff", color: "#007" };
      default:
        return {};
    }
  };

  return (
    <div style={{ padding: "1rem", fontFamily: "sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div style={{ fontWeight: "bold", fontSize: "1.2rem" }}>ScrubEdge</div>
        <div>
          <button onClick={() => (window.location.href = "/home")}>HOME</button>
          <button onClick={() => alert("ログアウト処理（仮）")}>ログアウト</button>
        </div>
      </header>

      <h2>{targetMonth.getFullYear()}年{targetMonth.getMonth() + 1}月 シフト希望</h2>

      <table className="calendar">
        <thead>
          <tr>
            {["日", "月", "火", "水", "木", "金", "土"].map((d) => (
              <th key={d}>{d}</th>
            ))}
          </tr>
        </thead>
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

      {/* モーダル */}
      {selectedDate && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>{selectedDate} の希望</h3>
            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
              <option value="none">希望なし</option>
              <option value="off">休み希望</option>
              <option value="night">夜勤希望</option>
            </select>
            <textarea
              rows={3}
              placeholder="コメント（任意）"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{ width: "100%", marginTop: "0.5rem" }}
            />
            <div style={{ marginTop: "1rem" }}>
              <button onClick={handleSave}>保存</button>
              <button onClick={() => setSelectedDate(null)} style={{ marginLeft: "1rem" }}>
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MobileShiftForm;
