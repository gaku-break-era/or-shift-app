// src/AdminEvents.js
import React, { useState } from "react";
import { db } from "./firebase";
import { collection, doc, setDoc } from "firebase/firestore";

function AdminEvents() {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState("");
  const [notifyDate, setNotifyDate] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !date || !title) {
      alert("名前、日付、タイトルは必須です");
      return;
    }

    try {
      const docRef = doc(db, "staffEvents", name);
      await setDoc(docRef, {
        name,
        events: [
          {
            date,
            title,
            time,
            location,
            notes,
            items,
            notifyDate,
          },
        ],
      }, { merge: true });

      alert("イベントを登録しました！");
      setDate(""); setTitle(""); setTime(""); setLocation("");
      setNotes(""); setItems(""); setNotifyDate("");
    } catch (error) {
      console.error("登録失敗:", error);
      alert("登録に失敗しました");
    }
  };

  return (
    <div style={{ padding: "1rem", fontFamily: "sans-serif" }}>
      <h2>イベント登録画面</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "400px" }}>
        <input type="text" placeholder="スタッフ名" value={name} onChange={(e) => setName(e.target.value)} required />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <input type="text" placeholder="イベント名（例: 研修）" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <input type="text" placeholder="時間（例: 13:00〜17:00）" value={time} onChange={(e) => setTime(e.target.value)} />
        <input type="text" placeholder="場所" value={location} onChange={(e) => setLocation(e.target.value)} />
        <input type="text" placeholder="事前課題・メモ" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <input type="text" placeholder="持ち物" value={items} onChange={(e) => setItems(e.target.value)} />
        <input type="date" placeholder="通知予定日" value={notifyDate} onChange={(e) => setNotifyDate(e.target.value)} />
        <button type="submit" style={{ marginTop: "1rem" }}>登録</button>
      </form>
    </div>
  );
}

export default AdminEvents;
