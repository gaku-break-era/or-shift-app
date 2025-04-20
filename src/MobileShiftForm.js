import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { db } from "./firebase";
import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

// 📅 カレンダー生成
const generateDays = (year, month, limit = null) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const max = limit || daysInMonth;
  const days = [];
  for (let d = 1; d <= max; d++) {
    days.push(new Date(year, month - 1, d));
  }
  return days;
};

function MobileShiftForm() {
  const [user, setUser] = useState(null);
  const [days, setDays] = useState([]);
  const [selections, setSelections] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [comment, setComment] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;

    let dayList = [];
    if (month === 12) {
      dayList = [...generateDays(year, 12), ...generateDays(year + 1, 1, 14)];
    } else {
      dayList = generateDays(year, month + 1);
    }
    setDays(dayList);
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        const today = new Date();
        let year = today.getFullYear();
        let month = today.getMonth() + 2;
        if (month === 13) {
          year++;
          month = 1;
        }
        const docId = `${currentUser.displayName || currentUser.email}_${year}${String(month).padStart(2, "0")}`;
        const ref = doc(db, "shiftRequests", docId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const prev = {};
          snap.data().shifts.forEach((s) => {
            prev[s.date] = { selection: s.selection, comment: s.comment || "" };
          });
          setSelections(prev);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleClickDay = (date) => {
    const dateStr = date.toISOString().split("T")[0];
    setSelectedDate(dateStr);
    setComment(selections[dateStr]?.comment || "");
    setShowModal(true);
  };

  const handleSelect = (value) => {
    setSelections((prev) => ({
      ...prev,
      [selectedDate]: { selection: value, comment },
    }));
    setShowModal(false);
    setSelectedDate(null);
    setComment("");
  };

  const handleCommentChange = (e) => {
    setComment(e.target.value);
  };

  const handleSubmit = async () => {
    if (!user) return;

    const today = new Date();
    let year = today.getFullYear();
    let month = today.getMonth() + 2;
    if (month === 13) {
      year++;
      month = 1;
    }

    const docId = `${user.displayName || user.email}_${year}${String(month).padStart(2, "0")}`;
    const data = {
      name: user.displayName || "",
      email: user.email || "",
      submittedAt: Timestamp.now(),
      shifts: Object.entries(selections).map(([date, val]) => ({
        date,
        selection: val.selection,
        comment: val.comment || "",
      })),
    };

    await setDoc(doc(db, "shiftRequests", docId), data);
    alert("送信しました！");
  };

  const handleLogout = () => {
    signOut(getAuth()).then(() => navigate("/"));
  };

  return (
    <div style={{ padding: "1rem", fontFamily: "sans-serif" }}>
      {/* 🔷 上部ナビゲーション */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
        <strong style={{ fontSize: "1.2rem" }}>ScrubEdge</strong>
        <div>
          <button onClick={() => navigate("/home")} style={{ marginRight: "1rem" }}>HOME</button>
          <button onClick={handleLogout}>ログアウト</button>
        </div>
      </div>

      <h2 style={{ textAlign: "center" }}>シフト希望カレンダー</h2>

      {/* 📅 カレンダー */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: "4px",
        marginTop: "1rem"
      }}>
        {days.map((d, i) => {
          const dStr = d.toISOString().split("T")[0];
          const sel = selections[dStr]?.selection;
          const isToday = d.toDateString() === new Date().toDateString();

          return (
            <div key={i}
              onClick={() => handleClickDay(d)}
              style={{
                border: "1px solid #ccc",
                padding: "0.5rem",
                backgroundColor: sel === "off" ? "#e0f7fa" : sel === "night" ? "#fce4ec" : "#fff",
                borderRadius: "4px",
                textAlign: "center",
                fontWeight: isToday ? "bold" : "normal",
                color: isToday ? "#007bff" : "black",
                fontSize: "0.9rem",
              }}>
              {d.getDate()}
              <div style={{ fontSize: "0.65rem", color: "#888" }}>{sel === "off" ? "休" : sel === "night" ? "夜" : ""}</div>
            </div>
          );
        })}
      </div>

      {/* ✅ モーダル */}
      {showModal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.4)",
          display: "flex", justifyContent: "center", alignItems: "center",
          zIndex: 10,
        }}>
          <div style={{ backgroundColor: "white", padding: "1rem", borderRadius: "8px", width: "90%", maxWidth: "400px" }}>
            <h3>{selectedDate} の希望</h3>
            <textarea
              value={comment}
              onChange={handleCommentChange}
              placeholder="希望理由やメモ（任意）"
              style={{ width: "100%", height: "60px", marginBottom: "1rem", fontSize: "0.9rem" }}
            />
            <div style={{ display: "flex", justifyContent: "space-around" }}>
              <button onClick={() => handleSelect("none")}>希望なし</button>
              <button onClick={() => handleSelect("off")}>休み希望</button>
              <button onClick={() => handleSelect("night")}>夜勤希望</button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 送信ボタン */}
      <button onClick={handleSubmit} style={{
        marginTop: "2rem",
        width: "100%",
        padding: "1rem",
        backgroundColor: "#007bff",
        color: "white",
        border: "none",
        fontSize: "1rem",
        borderRadius: "6px"
      }}>
        シフト希望を送信する
      </button>
    </div>
  );
}

export default MobileShiftForm;
