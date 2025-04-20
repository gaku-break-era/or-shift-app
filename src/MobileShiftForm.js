// src/MobileShiftForm.js
import React, { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "./firebase";

const MAX_OFF_DAYS = 3;
const MAX_NIGHT_SHIFTS = 1;

function MobileShiftForm() {
  const [shiftData, setShiftData] = useState([]);
  const [user, setUser] = useState(null);
  const [submitStatus, setSubmitStatus] = useState("");

  useEffect(() => {
    const today = new Date();
    let year = today.getFullYear();
    let month = today.getMonth() + 1;

    if (month === 12) {
      const dec = generateMonthDates(year, 12);
      const jan = generateMonthDates(year + 1, 1, 14); // 1月は1〜14日まで
      setShiftData([...dec, ...jan]);
    } else {
      const nextMonth = generateMonthDates(year, month + 1);
      setShiftData(nextMonth);
    }

    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const generateMonthDates = (year, month, maxDay = null) => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const lastDay = maxDay || daysInMonth;
    const arr = [];
    for (let day = 1; day <= lastDay; day++) {
      const date = new Date(year, month - 1, day);
      arr.push({ date, selection: "none" });
    }
    return arr;
  };

  const toggleSelection = (index) => {
    const newData = [...shiftData];
    const current = newData[index].selection;
    const { off, night } = countSelections(newData);

    let next;
    if (current === "none") {
      if (off + night >= MAX_OFF_DAYS) {
        alert(`休み希望（夜勤含む）は最大 ${MAX_OFF_DAYS} 日です`);
        return;
      }
      next = "off";
    } else if (current === "off") {
      if (night >= MAX_NIGHT_SHIFTS) {
        alert(`夜勤希望は最大 ${MAX_NIGHT_SHIFTS} 回です`);
        next = "none";
      } else {
        next = "night";
      }
    } else {
      next = "none";
    }

    newData[index].selection = next;
    setShiftData(newData);
  };

  const countSelections = (data) => {
    let off = 0, night = 0;
    data.forEach((d) => {
      if (d.selection === "off") off++;
      if (d.selection === "night") night++;
    });
    return { off, night };
  };

  const getLabel = (sel) => {
    if (sel === "off") return "休";
    if (sel === "night") return "夜";
    return "";
  };

  const handleSubmit = async () => {
    if (!user) {
      alert("ログインしてください");
      return;
    }

    try {
      const today = new Date();
      let year = today.getFullYear();
      let month = today.getMonth() + 2;
      if (month === 13) {
        month = 1;
        year++;
      }

      const docId = `${user.displayName || user.email}_${year}${String(month).padStart(2, "0")}`;

      const dataToSave = {
        name: user.displayName || "",
        email: user.email || "",
        submittedAt: Timestamp.now(),
        shifts: shiftData.map((d) => ({
          date: d.date.toISOString().split("T")[0],
          selection: d.selection,
        })),
      };

      await setDoc(doc(db, "shiftRequests", docId), dataToSave);
      setSubmitStatus("送信完了！お疲れさまでした！");
    } catch (err) {
      console.error(err);
      setSubmitStatus("送信失敗。再試行してください");
    }
  };

  const formatDay = (date) => {
    return `${date.getDate()}（${"日月火水木金土"[date.getDay()]}）`;
  };

  return (
    <div style={{ padding: "1rem", fontFamily: "sans-serif", maxWidth: 500, margin: "auto" }}>
      <h2>シフト希望（スマホ版）</h2>
      {!user && <p>ログイン中のユーザー情報を確認しています...</p>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {shiftData.map((item, i) => (
          <div
            key={i}
            onClick={() => toggleSelection(i)}
            style={{
              width: "22%",
              border: "1px solid #ccc",
              borderRadius: "6px",
              padding: "6px",
              textAlign: "center",
              backgroundColor:
                item.selection === "off" ? "#e0f7fa" :
                item.selection === "night" ? "#fce4ec" : "white",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            <div>{formatDay(item.date)}</div>
            <div style={{ fontWeight: "bold", marginTop: "4px" }}>{getLabel(item.selection)}</div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        style={{
          marginTop: "1.5rem",
          padding: "0.75rem 1.5rem",
          backgroundColor: "#1976d2",
          color: "white",
          border: "none",
          borderRadius: "4px",
          width: "100%",
          fontSize: "1rem",
        }}
      >
        送信する
      </button>

      {submitStatus && (
        <p style={{ marginTop: "1rem", fontWeight: "bold", color: "green" }}>{submitStatus}</p>
      )}
    </div>
  );
}

export default MobileShiftForm;
