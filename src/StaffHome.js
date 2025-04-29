import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "./components/ui/Header";
import { db } from "./firebase";
import { collection, getDoc, getDocs, doc } from "firebase/firestore";
import dayjs from "dayjs";
import { getAuth } from "firebase/auth";

const StaffHome = () => {
  const [thisWeekShift, setThisWeekShift] = useState([]);
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [mySurgeries, setMySurgeries] = useState([]);
  const [myEmployeeId, setMyEmployeeId] = useState("");
  const [weeklyShiftMap, setWeeklyShiftMap] = useState({});

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const staffDoc = await getDoc(doc(db, "staffList", user.uid));
          if (staffDoc.exists()) {
            setMyEmployeeId(staffDoc.data().employeeId);
          } else {
            console.error("スタッフ情報が見つかりませんでした");
          }
        } catch (err) {
          console.error("スタッフ情報取得エラー:", err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const today = dayjs();
    const dates = Array.from({ length: 7 }, (_, i) => today.add(i - 3, "day"));
    const formatted = dates.map(d => ({
      label: d.format("dd"),
      date: d.format("YYYY-MM-DD"),
      short: d.format("M/D"),
      dayOfWeek: d.day()
    }));
    setThisWeekShift(formatted);
    setSelectedDate(today.format("YYYY-MM-DD"));
  }, []);

  useEffect(() => {
    const fetchWeeklyShift = async () => {
      if (!myEmployeeId) return;

      const today = dayjs();
      const monthDocId = `${today.year()}年${today.month() + 1}月`;

      try {
        const shiftDocSnap = await getDoc(doc(db, "shiftSchedules", monthDocId));
        const dates = Array.from({ length: 7 }, (_, i) => today.add(i - 3, "day"));
        const weeklyData = {};

        if (!shiftDocSnap.exists()) {
          // 🔥 まだシフト作成されてない月なら、全部「ー」
          dates.forEach(d => {
            weeklyData[d.format("YYYY-MM-DD")] = "ー";
          });
        } else {
          // 🔥 シフト作成済みならデータ反映
          const shiftData = shiftDocSnap.data();
          const myShiftData = shiftData[myEmployeeId] || {};
          dates.forEach(d => {
            const dateStr = d.format("YYYY-MM-DD");
            const shiftType = myShiftData[dateStr] || "◯"; // 🔥なければデフォルトは「◯」
            weeklyData[dateStr] = shiftType;
          });
        }

        setWeeklyShiftMap(weeklyData);
      } catch (err) {
        console.error("今週のシフト取得エラー:", err);
      }
    };

    fetchWeeklyShift();
  }, [myEmployeeId]);

  useEffect(() => {
    const fetchMySurgeries = async () => {
      if (!selectedDate || !myEmployeeId) return;
      try {
        const surgerySnap = await getDocs(collection(db, "surgerySchedules"));
        const selectedDaySurgeries = surgerySnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(doc => doc.date === selectedDate);

        const myAssigned = selectedDaySurgeries.filter(s =>
          s.scrub?.id === myEmployeeId ||
          s.circulating?.id === myEmployeeId ||
          s.scrubInstructor?.id === myEmployeeId ||
          s.circulatingInstructor?.id === myEmployeeId
        );
        setMySurgeries(myAssigned);
      } catch (err) {
        console.error("手術情報読み込みエラー:", err);
        setMySurgeries([]);
      }
    };
    fetchMySurgeries();
  }, [selectedDate, myEmployeeId]);

  const getWeekdayLabel = (dayOfWeek) => {
    const labels = ["日", "月", "火", "水", "木", "金", "土"];
    return labels[dayOfWeek];
  };

  const getWeekdayColor = (dayOfWeek) => {
    if (dayOfWeek === 0) return "red";
    if (dayOfWeek === 6) return "blue";
    return "#333";
  };

  return (
    <div style={{ padding: "1rem", fontFamily: "sans-serif", maxWidth: "600px", margin: "0 auto" }}>
      <Header />

      {/* 今週のシフト */}
      <section style={{ marginBottom: "2rem" }}>
        <h2>今週のシフト</h2>
        <div style={{ display: "flex", overflowX: "auto", gap: "0.5rem" }}>
          {thisWeekShift.map((item, index) => (
            <div
              key={index}
              onClick={() => setSelectedDate(item.date)}
              style={{
                minWidth: "60px",
                padding: "0.5rem",
                backgroundColor: item.date === selectedDate ? "#E0F2FF" : "#F4F4F4",
                borderRadius: "6px",
                textAlign: "center",
                cursor: "pointer"
              }}
            >
              <div style={{ color: getWeekdayColor(item.dayOfWeek), fontWeight: "bold" }}>
                {getWeekdayLabel(item.dayOfWeek)}
              </div>
              <div style={{ fontSize: "0.8rem", color: "#666" }}>{item.short}</div>
              <div style={{ fontSize: "0.9rem", fontWeight: "bold" }}>
                {weeklyShiftMap[item.date] || "ー"}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 当日の手術配置 */}
      <section style={{ marginBottom: "2rem" }}>
        <h2>{dayjs(selectedDate).format("M月D日")}の手術配置</h2>
        {mySurgeries.length > 0 ? (
          mySurgeries.map((surg, i) => (
            <div key={i} style={{ marginBottom: "1rem", background: "#FAFAFA", padding: "0.8rem", borderRadius: "8px" }}>
              <p><strong>{surg.department}</strong>：{surg.procedure}</p>
              <p>🧑‍⚕️ 執刀医: {surg.surgeon}</p>
              <p>👩‍⚕️ 器械出し: {surg.scrub?.name}（指導: {surg.scrubInstructor?.name || "なし"}）</p>
              <p>👟 外回り: {surg.circulating?.name}（指導: {surg.circulatingInstructor?.name || "なし"}）</p>
              <p>💉 麻酔: {surg.anesthesia}</p>
              <p>🛌 体位: {surg.position}</p>
            </div>
          ))
        ) : (
          <p>この日に割り当てられている手術はありません。</p>
        )}
      </section>

      {/* スキルチャート */}
      <Link to="/skills">
        <button style={{
          width: "100%",
          padding: "0.8rem",
          backgroundColor: "#34A853",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "1rem",
          marginBottom: "1rem"
        }}>
          📊 自分のスキルチャートを見る
        </button>
      </Link>

      {/* 指導レビュー */}
      <Link to="/review">
        <button style={{
          width: "100%",
          padding: "0.8rem",
          backgroundColor: "#FBBC05",
          color: "#333",
          border: "none",
          borderRadius: "8px",
          fontSize: "1rem",
          marginBottom: "1.5rem"
        }}>
          📝 指導レビューを入力する
        </button>
      </Link>

      {/* シフト希望提出 */}
      <Link to="/form">
        <button style={{
          width: "100%",
          padding: "1rem",
          backgroundColor: "#4285F4",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "1rem"
        }}>
          📅 シフト希望を提出する
        </button>
      </Link>
    </div>
  );
};

export default StaffHome;
