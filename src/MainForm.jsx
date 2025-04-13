// src/MainForm.jsx
import React, { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider } from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import { Link } from "react-router-dom";

function MainForm() {
  const MAX_OFF_DAYS = 3;
  const MAX_NIGHT_SHIFTS = 1;

  const [shiftData, setShiftData] = useState([]);
  const [submitStatus, setSubmitStatus] = useState("");
  const [user, setUser] = useState(null);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    const today = new Date();
    let year = today.getFullYear();
    let month = today.getMonth() + 1;

    if (month === 12) {
      const decDays = generateDays(year, 12);
      const janDays = generateDays(year + 1, 1, 14);
      setShiftData([...decDays, ...janDays]);
    } else {
      const nextMonth = month + 1;
      const days = generateDays(year, nextMonth);
      setShiftData(days);
    }
  }, []);

  const generateDays = (year, month, maxDay = null) => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const limit = maxDay || daysInMonth;
    const list = [];
    for (let day = 1; day <= limit; day++) {
      list.push({
        date: new Date(year, month - 1, day),
        selection: "none",
      });
    }
    return list;
  };

  const formatDate = (date) =>
    `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}（${
      "日月火水木金土"[date.getDay()]
    }）`;

  const countSelectionsFrom = (data) => {
    let off = 0;
    let night = 0;
    data.forEach((item) => {
      if (item.selection === "off") off++;
      if (item.selection === "night") night++;
    });
    return { off, night };
  };

  const handleChange = (index, value) => {
    const updated = [...shiftData];
    const previousValue = updated[index].selection;
    updated[index].selection = value;

    const temp = [...updated];
    const { off, night } = countSelectionsFrom(temp);

    if (value === "off" && previousValue !== "off" && off + night > MAX_OFF_DAYS) {
      alert(`休み希望（夜勤含む）は最大 ${MAX_OFF_DAYS} 日までです`);
      return;
    }

    if (value === "night" && previousValue !== "night" && night > MAX_NIGHT_SHIFTS) {
      alert(`夜勤希望は最大 ${MAX_NIGHT_SHIFTS} 回までです`);
      return;
    }

    setShiftData(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!user) {
      alert("ログインしてください！");
      return;
    }
  
    // 送信年月（来月）
    const today = new Date();
    let year = today.getFullYear();
    let month = today.getMonth() + 2;
    if (month === 13) {
      month = 1;
      year++;
    }
    const docId = `${user.displayName || user.email}_${year}${String(month).padStart(2, "0")}`;
  
    try {
      const dataToSend = {
        name: user.displayName || "",
        email: user.email || "",
        submittedAt: Timestamp.now(),
        shifts: shiftData.map((item) => ({
          date: item.date.toISOString().split("T")[0],
          selection: item.selection,
        })),
      };
  
      await setDoc(doc(db, "shiftRequests", docId), dataToSend); // ← ここで上書き保存
      setSubmitStatus("送信が完了しました！おつかれさまです！（2回目以降は上書きされます）");
    } catch (error) {
      console.error("送信エラー:", error);
      setSubmitStatus("送信に失敗しました。もう一度お試しください。");
    }
  };
  

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("ログインエラー:", error);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif", maxWidth: 600, margin: "auto" }}>
      <h1>シフト希望フォーム</h1>

      {!user ? (
        <div>
          <p>Googleアカウントでログインしてください</p>
          <button onClick={handleLogin}>ログイン</button>
        </div>
      ) : (
        <div>
          <p>ログイン中：{user.displayName || user.email}</p>
          <button onClick={handleLogout}>ログアウト</button>

          <p style={{ fontSize: "14px", color: "gray", marginTop: "1rem" }}>
            ※休み希望（夜勤含む）は最大 {MAX_OFF_DAYS} 日、夜勤希望は {MAX_NIGHT_SHIFTS} 回までです
          </p>

          <form onSubmit={handleSubmit}>
            {shiftData.map((item, index) => (
              <div key={index} style={{ marginBottom: "0.5rem" }}>
                <strong>{formatDate(item.date)}</strong>
                <div>
                  <label>
                    <input
                      type="radio"
                      name={`shift-${index}`}
                      value="none"
                      checked={item.selection === "none"}
                      onChange={() => handleChange(index, "none")}
                    />
                    希望なし
                  </label>
                  <label style={{ marginLeft: "1rem" }}>
                    <input
                      type="radio"
                      name={`shift-${index}`}
                      value="off"
                      checked={item.selection === "off"}
                      onChange={() => handleChange(index, "off")}
                    />
                    休み希望
                  </label>
                  <label style={{ marginLeft: "1rem" }}>
                    <input
                      type="radio"
                      name={`shift-${index}`}
                      value="night"
                      checked={item.selection === "night"}
                      onChange={() => handleChange(index, "night")}
                    />
                    夜勤希望
                  </label>
                </div>
              </div>
            ))}

            <button type="submit" style={{ marginTop: "1.5rem" }}>
              送信
            </button>
          </form>

          {submitStatus && (
            <p style={{ marginTop: "1rem", color: "green", fontWeight: "bold" }}>{submitStatus}</p>
          )}

          <div style={{ marginTop: "2rem" }}>
            <Link to="/admin">→ 管理者画面へ</Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainForm;