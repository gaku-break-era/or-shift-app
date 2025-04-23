import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "./components/ui/Header";
import { db } from "./firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import dayjs from "dayjs";

const StaffHome = () => {
  const [thisWeekShift, setThisWeekShift] = useState([]);
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [todayIndex, setTodayIndex] = useState(null);
  const [mySurgeries, setMySurgeries] = useState([]);
  const staffId = "kawase"; // 仮ユーザーID

  useEffect(() => {
    const start = dayjs().startOf("week").add(1, "day"); // 月曜スタート
    const dates = Array.from({ length: 7 }, (_, i) => start.add(i, "day"));
    const formatted = dates.map(d => ({
      label: d.format("dd"),
      date: d.format("YYYY-MM-DD"),
      short: d.format("M/D")
    }));
    setThisWeekShift(formatted);
    const today = dayjs().format("YYYY-MM-DD");
    const todayIdx = formatted.findIndex(f => f.date === today);
    setTodayIndex(todayIdx);
    setSelectedDate(today);
  }, []);

  useEffect(() => {
    const fetchShiftAndSurgeries = async () => {
      if (!selectedDate) return;

      // Shift 取得
      const shiftSnap = await getDocs(query(
        collection(db, "shifts"),
        where("staffId", "==", staffId),
        where("date", "==", selectedDate)
      ));
      const shiftData = shiftSnap.docs[0]?.data()?.type || "ー";

      // 手術スケジュール取得
      const surgerySnap = await getDocs(query(
        collection(db, "surgerySchedules"),
        where("date", "==", selectedDate)
      ));
      const myAssigned = surgerySnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(s => 
          s.scrub?.id === staffId || 
          s.circulating?.id === staffId || 
          s.scrubInstructor?.id === staffId || 
          s.circulatingInstructor?.id === staffId
        );
      setMySurgeries(myAssigned);
    };
    fetchShiftAndSurgeries();
  }, [selectedDate]);

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
              <div>{item.label}</div>
              <div style={{ fontSize: "0.8rem", color: "#666" }}>{item.short}</div>
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