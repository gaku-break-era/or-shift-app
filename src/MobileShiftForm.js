import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { db } from "./firebase";
import { setDoc, doc, Timestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function MobileShiftForm() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [shiftData, setShiftData] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selection, setSelection] = useState("none");
  const [comment, setComment] = useState("");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  const handleDayClick = (date) => {
    const iso = date.toISOString().split("T")[0];
    const existing = shiftData[iso];
    setSelectedDate(date);
    setSelection(existing?.selection || "none");
    setComment(existing?.comment || "");
    setModalOpen(true);
  };

  const handleSave = () => {
    const iso = selectedDate.toISOString().split("T")[0];
    setShiftData((prev) => ({
      ...prev,
      [iso]: { selection, comment },
    }));
    setModalOpen(false);
  };

  const handleSubmit = async () => {
    if (!user) {
      alert("ログインしてください！");
      return;
    }

    const sortedEntries = Object.entries(shiftData).map(([date, value]) => ({
      date,
      selection: value.selection,
      comment: value.comment || "",
    }));

    const today = new Date();
    let year = today.getFullYear();
    let month = today.getMonth() + 2;
    if (month === 13) {
      month = 1;
      year++;
    }
    const docId = `${user.displayName || user.email}_${year}${String(month).padStart(2, "0")}`;

    try {
      await setDoc(doc(db, "shiftRequests", docId), {
        name: user.displayName || "",
        email: user.email || "",
        submittedAt: Timestamp.now(),
        shifts: sortedEntries,
      });
      alert("送信が完了しました！");
    } catch (error) {
      console.error("送信エラー:", error);
      alert("送信に失敗しました。");
    }
  };

  const handleLogout = () => {
    const auth = getAuth();
    signOut(auth);
    navigate("/login");
  };

  const tileContent = ({ date }) => {
    const iso = date.toISOString().split("T")[0];
    const item = shiftData[iso];
    if (!item) return null;
    let emoji = "";
    if (item.selection === "off") emoji = "🟦";
    else if (item.selection === "night") emoji = "🌙";
    return (
      <div style={{ fontSize: "0.75rem", color: "gray" }}>
        {emoji} {item.comment || ""}
      </div>
    );
  };

  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  return (
    <div style={{ padding: "1rem", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <strong style={{ fontSize: "1.5rem" }}>ScrubEdge</strong>
        <div>
          <button onClick={() => navigate("/home")} style={{ marginRight: "1rem" }}>HOME</button>
          <button onClick={handleLogout}>ログアウト</button>
        </div>
      </div>

      <h2>シフト希望を提出</h2>

      <div style={{ marginBottom: "1rem" }}>
        <Calendar
          value={currentMonth}
          onClickDay={handleDayClick}
          tileContent={tileContent}
          locale="ja-JP"
          calendarType="gregory"
        />
        <Calendar
          value={nextMonth}
          onClickDay={handleDayClick}
          tileContent={tileContent}
          locale="ja-JP"
          calendarType="gregory"
        />
      </div>

      {modalOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center"
        }}>
          <div style={{ background: "white", padding: "2rem", borderRadius: "8px", width: "90%", maxWidth: "400px" }}>
            <h3>{selectedDate?.toLocaleDateString("ja-JP")}</h3>

            <div>
              <label>
                <input type="radio" value="none" checked={selection === "none"} onChange={() => setSelection("none")} />
                希望なし
              </label>
              <br />
              <label>
                <input type="radio" value="off" checked={selection === "off"} onChange={() => setSelection("off")} />
                休み希望
              </label>
              <br />
              <label>
                <input type="radio" value="night" checked={selection === "night"} onChange={() => setSelection("night")} />
                夜勤希望
              </label>
            </div>

            <textarea
              placeholder="コメント（任意）"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{ width: "100%", marginTop: "1rem" }}
            />

            <div style={{ marginTop: "1rem", display: "flex", justifyContent: "space-between" }}>
              <button onClick={() => setModalOpen(false)}>閉じる</button>
              <button onClick={handleSave}>保存</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <button onClick={handleSubmit} style={{ padding: "0.75rem 1.5rem", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px" }}>
          提出
        </button>
      </div>
    </div>
  );
}

export default MobileShiftForm;
