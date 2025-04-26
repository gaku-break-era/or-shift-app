// src/Admin.js - 夜勤/当直人数カウント＆保存後即反映版
import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "./firebase";
import { collection, getDocs, setDoc, doc, getDoc } from "firebase/firestore";
import { saveAs } from "file-saver";
import emailjs from "@emailjs/browser";
import { isWeekend } from "date-fns";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import FeedbackForm from "./FeedbackForm";
import Header from "./components/ui/Header";
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const today = dayjs();
const defaultMonth = today.date() <= 10
  ? today.add(1, "month").month() + 1
  : today.add(2, "month").month() + 1;

const thStyle = { border: "1px solid #ccc", padding: "4px", background: "#fafafa" };
const tdStyle = { border: "1px solid #ccc", padding: "4px" };

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function Admin() {
  const [events, setEvents] = useState({});
  const [uniqueEmployeeIds, setUniqueEmployeeIds] = useState([]);
  const [dates, setDates] = useState([]);
  const [shiftMatrix, setShiftMatrix] = useState({});
  const [hopes, setHopes] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [unsubmitted, setUnsubmitted] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submittedStaffIds, setSubmittedStaffIds] = useState(new Set());
  const [nightDutyCount, setNightDutyCount] = useState({});
  const [onCallDutyCount, setOnCallDutyCount] = useState({});
  const [dayShiftCount, setDayShiftCount] = useState({});
const [nightShiftCount, setNightShiftCount] = useState({});
const [lateCShiftCount, setLateCShiftCount] = useState({});
const [onCallShiftCount, setOnCallShiftCount] = useState({});
const [freeShiftCount, setFreeShiftCount] = useState({});


  const [currentMonth, setCurrentMonth] = useState(defaultMonth);

  const EMAIL_SERVICE_ID = "service_12m5w0v";
  const EMAIL_TEMPLATE_ID = "template_gmkbnq8";
  const EMAIL_PUBLIC_KEY = "fmk7EZo2SxwG00Z7U";

  const shiftOptions = ["", "◯", "/", "X]", "休", "Y", "<", "□", "TF", "ｵC", "ｵﾛ"];

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return () => unsubscribe();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const year = dayjs().year();
      const startOfMonth = dayjs(`${year}-${String(currentMonth).padStart(2, "0")}-01`);
      const endOfMonth = startOfMonth.endOf("month");
      const monthDates = [];
      let currentDate = startOfMonth;
      while (currentDate.isSameOrBefore(endOfMonth)) {
        monthDates.push(currentDate.format("YYYY-MM-DD"));
        currentDate = currentDate.add(1, "day");
      }
      setDates(monthDates);

      const staffSnap = await getDocs(collection(db, "staffList"));
      const staffData = staffSnap.docs.map((d) => ({
        id: d.id,
        employeeId: d.data().employeeId,
        lastName: d.data().lastName,
        firstName: d.data().firstName,
        email: d.data().email || "",
      }));
      setStaffList(staffData);

      const registeredEmployeeIds = staffData.map((s) => s.employeeId);
      setUniqueEmployeeIds(registeredEmployeeIds);

      const reqSnap = await getDocs(collection(db, "shiftRequests"));
      const hopeMap = {};
      const matrix = {};

      registeredEmployeeIds.forEach((empId) => {
        monthDates.forEach((date) => {
          matrix[`${empId}_${date}`] = "";
        });
      });

      const submittedIds = new Set();
      for (const docSnap of reqSnap.docs) {
        const req = docSnap.data();
        const empId = req.employeeId;
        if (!empId) continue;
        submittedIds.add(empId);

        const shifts = req.shifts || [];
        for (const shift of shifts) {
          const shiftDate = typeof shift.date === "string"
            ? shift.date
            : dayjs(shift.date).format("YYYY-MM-DD");
          const month = parseInt(shiftDate.slice(5, 7));
          if (month === currentMonth) {
            const key = `${empId}_${shiftDate}`;
            hopeMap[key] = shift.selection || "";
          }
        }
      }

      setSubmittedStaffIds(submittedIds);
      setUnsubmitted(registeredEmployeeIds.filter(id => !submittedIds.has(id)));
      setHopes(hopeMap);

      const title = `${year}年${currentMonth}月`;
      const savedSnap = await getDoc(doc(db, "shiftSchedules", title));
      if (savedSnap.exists()) {
        const saved = savedSnap.data();
        Object.keys(saved).forEach(empId => {
          Object.keys(saved[empId]).forEach(date => {
            if (monthDates.includes(date)) {
              matrix[`${empId}_${date}`] = saved[empId][date] || "";
            }
          });
        });
      }
      setShiftMatrix(matrix);

      // ここで夜勤/当直人数カウントも再計算
      const nightCount = {};
      const onCallDutyCount = {};
      const dayCount = {};
      const lateCCount = {};
      const oncallShift = {};
      const freeCount = {};

      monthDates.forEach(date => {
        let day = 0, night = 0, oncall = 0, latec = 0, oncallsh = 0, free = 0;
        registeredEmployeeIds.forEach(empId => {
          const value = matrix[`${empId}_${date}`];
          if (value === "◯") day++;
          if (value === "/") night++;
          if (value === "□") oncall++;
          if (value === "ｵC") latec++;
          if (value === "ｵﾛ") oncallsh++;
          if (value === "TF") free++;
        });
        dayCount[date] = day;
        nightCount[date] = night;
        onCallDutyCount[date] = oncall;
        lateCCount[date] = latec;
        oncallShift[date] = oncallsh;
        freeCount[date] = free;
      });
      
      setDayShiftCount(dayCount);
      setNightShiftCount(nightCount);
      setOnCallDutyCount(onCallDutyCount);
      setLateCShiftCount(lateCCount);
      setOnCallShiftCount(oncallShift);
      setFreeShiftCount(freeCount);

    } catch (err) {
      console.error("読み込みエラー:", err);
      alert("データの読み込みに失敗しました: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentMonth]);

  const handleSave = async () => {
    try {
      const dataToSave = {};
      uniqueEmployeeIds.forEach((empId) => {
        dataToSave[empId] = {};
        dates.forEach((date) => {
          dataToSave[empId][date] = shiftMatrix[`${empId}_${date}`] || "";
        });
      });
      const title = `${dayjs().year()}年${currentMonth}月`;
      await setDoc(doc(db, "shiftSchedules", title), dataToSave);
      alert("シフトを保存しました！");

      // 保存後に再取得！！
      fetchData();
    } catch (err) {
      console.error(err);
      alert("保存に失敗しました。");
    }
  };

  const handleChange = (empId, date, value) => {
    setShiftMatrix((prev) => ({
      ...prev,
      [`${empId}_${date}`]: value,
    }));
  };

  const getDisplayName = (empId) => {
    const staff = staffList.find((s) => s.employeeId === empId);
    return staff ? `${staff.lastName} ${staff.firstName}` : empId;
  };

  const getHopeLabel = (key) => {
    if (hopes[key] === "off") return "休み希望";
    if (hopes[key] === "night") return "夜勤希望";
    if (hopes[key] === "none") return "希望なし";
    return "";
  };

  const getEventLabel = (key) => (events[key] ? `🔔${events[key]}` : "");

  if (!currentUser) return <p>ログイン中...</p>;

  if (loading) return (
    <div style={{ padding: "1rem", fontFamily: "sans-serif", textAlign: "center" }}>
      <Header />
      <h2>データを読み込み中...</h2>
    </div>
  );

  return (
    <div style={{ padding: "1rem", overflowX: "auto", fontFamily: "sans-serif" }}>
      <Header />
      <div style={{ padding: "1rem" }}>
        <h1>{`${dayjs().year()}年${currentMonth}月のシフト作成画面`}</h1>

        {/* 月切り替え */}
        <div style={{ margin: "0.5rem 0" }}>
          <button onClick={() => setCurrentMonth((p) => (p === 1 ? 12 : p - 1))}>◀ 前月</button>
          <span style={{ margin: "0 1rem" }}>{`${currentMonth}月`}</span>
          <button onClick={() => setCurrentMonth((p) => (p === 12 ? 1 : p + 1))}>翌月 ▶</button>
        </div>

        {/* 保存ボタン */}
        <div style={{ margin: "1rem 0" }}>
          <button
            onClick={handleSave}
            style={{
              padding: "1rem",
              backgroundColor: "#4285F4",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            💾 シフトを保存
          </button>
        </div>

        {/* 凡例 */}
        <div style={{ display: "flex", gap: "1rem", margin: "1rem 0", fontSize: "0.85rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ width: "16px", height: "16px", backgroundColor: "#ffebee", marginRight: "4px", border: "1px solid #ccc" }}></div>
            <span>希望未提出スタッフ</span>
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ width: "16px", height: "16px", backgroundColor: "#e0f7fa", marginRight: "4px", border: "1px solid #ccc" }}></div>
            <span>休み希望</span>
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ width: "16px", height: "16px", backgroundColor: "#fce4ec", marginRight: "4px", border: "1px solid #ccc" }}></div>
            <span>夜勤希望</span>
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ width: "16px", height: "16px", backgroundColor: "#f9f9f9", marginRight: "4px", border: "1px solid #ccc" }}></div>
            <span>希望なし</span>
          </div>
        </div>

        

        {/* シフト表 */}
        <table style={{ borderCollapse: "collapse", minWidth: "800px" }}>
          <thead>
            <tr>
              <th style={thStyle}>名前</th>
              {dates.map((date) => (
                <th key={date} style={thStyle}>
                  {dayjs(date).date()}({["日","月","火","水","木","金","土"][dayjs(date).day()]})
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {uniqueEmployeeIds.map((empId) => {
              const hasSubmitted = submittedStaffIds.has(empId);
              return (
                <tr key={empId}>
                  <td style={{ ...tdStyle, backgroundColor: hasSubmitted ? "white" : "#ffebee" }}>
                    {getDisplayName(empId)}
                  </td>
                  {dates.map((date) => {
                    const key = `${empId}_${date}`;
                    const hopeValue = hopes[key];
                    const bg =
                      !hasSubmitted ? "#fff8e1" :
                      hopeValue === "off" ? "#e0f7fa" :
                      hopeValue === "night" ? "#fce4ec" :
                      hopeValue === "none" ? "#f9f9f9" : "white";
                    return (
                      <td key={key} style={{ ...tdStyle, backgroundColor: bg }}>
                        <div style={{ fontSize: "0.7rem", color: "#666" }}>
                          {!hasSubmitted ? "希望未提出" : getHopeLabel(key)}
                          {getEventLabel(key)}
                        </div>
                        <select
                          value={shiftMatrix[key] || ""}
                          onChange={(e) => handleChange(empId, date, e.target.value)}
                          style={{ width: "50px", marginTop: "2px" }}
                        >
                          {shiftOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {/* ▼▼▼ 人数カウント行 ▼▼▼ */}
<tr>
  <td style={{ ...tdStyle, fontWeight: "bold", backgroundColor: "#e0f7fa" }}>
    日
  </td>
  {dates.map((date) => (
    <td key={`day_${date}`} style={{ ...tdStyle, backgroundColor: "#e0f7fa", textAlign: "center", fontWeight: "bold" }}>
      {dayShiftCount[date] || 0}
    </td>
  ))}
</tr>

<tr>
  <td style={{ ...tdStyle, fontWeight: "bold", backgroundColor: "#fce4ec" }}>
    夜
  </td>
  {dates.map((date) => (
    <td key={`night_${date}`} style={{ ...tdStyle, backgroundColor: "#fce4ec", textAlign: "center", fontWeight: "bold" }}>
      {nightShiftCount[date] || 0}
    </td>
  ))}
</tr>

<tr>
  <td style={{ ...tdStyle, fontWeight: "bold", backgroundColor: "#fce4ec" }}>
    当
  </td>
  {dates.map((date) => (
    <td key={`oncall_${date}`} style={{ ...tdStyle, backgroundColor: "#fce4ec", textAlign: "center", fontWeight: "bold" }}>
      {onCallDutyCount[date] || 0}
    </td>
  ))}
</tr>

<tr>
  <td style={{ ...tdStyle, fontWeight: "bold", backgroundColor: "#e8f5e9" }}>
    遅C
  </td>
  {dates.map((date) => (
    <td key={`latec_${date}`} style={{ ...tdStyle, backgroundColor: "#e8f5e9", textAlign: "center", fontWeight: "bold" }}>
      {lateCShiftCount[date] || 0}
    </td>
  ))}
</tr>

<tr>
  <td style={{ ...tdStyle, fontWeight: "bold", backgroundColor: "#fff3e0" }}>
    ｵﾛ
  </td>
  {dates.map((date) => (
    <td key={`oncallsh_${date}`} style={{ ...tdStyle, backgroundColor: "#fff3e0", textAlign: "center", fontWeight: "bold" }}>
      {onCallShiftCount[date] || 0}
    </td>
  ))}
</tr>

<tr>
  <td style={{ ...tdStyle, fontWeight: "bold", backgroundColor: "#ede7f6" }}>
    F
  </td>
  {dates.map((date) => (
    <td key={`free_${date}`} style={{ ...tdStyle, backgroundColor: "#ede7f6", textAlign: "center", fontWeight: "bold" }}>
      {freeShiftCount[date] || 0}
    </td>
  ))}
</tr>

          </tbody>
        </table>

        {/* 改善提案 */}
        {showFeedback
          ? <FeedbackForm onClose={() => setShowFeedback(false)} />
          : <button onClick={() => setShowFeedback(true)} style={{ marginTop: "1rem" }}>
              改善提案を送る
            </button>
        }
      </div>
    </div>
  );
}

export default Admin;
