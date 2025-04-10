// src/FeedbackForm.js
import React, { useState } from "react";
import { db } from "./firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";

function FeedbackForm({ onClose }) {
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async () => {
    if (!content.trim()) {
      alert("内容を入力してください");
      return;
    }

    try {
      const user = getAuth().currentUser;
      await addDoc(collection(db, "feedback"), {
        user: user?.email || "未ログイン",
        content,
        createdAt: Timestamp.now(),
      });
      setStatus("送信しました。ご協力ありがとうございます！");
      setContent("");
    } catch (error) {
      console.error("送信エラー:", error);
      setStatus("送信に失敗しました");
    }
  };

  return (
    <div style={{ padding: "1rem", background: "#fff", border: "1px solid #ccc", maxWidth: "500px", margin: "1rem auto", borderRadius: "8px" }}>
      <h2>フィードバックを送る</h2>
      <textarea
        rows={5}
        style={{ width: "100%", marginBottom: "1rem" }}
        placeholder="改善点・不具合・アイデアなどご自由にどうぞ！"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <button onClick={handleSubmit} style={{ marginRight: "1rem" }}>送信</button>
      {onClose && <button onClick={onClose}>閉じる</button>}
      <div style={{ marginTop: "0.5rem", color: "green" }}>{status}</div>
    </div>
  );
}

export default FeedbackForm;
