// src/Admin.js
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, getDocs, setDoc, doc, getDoc } from "firebase/firestore";
import { saveAs } from "file-saver";
import emailjs from "@emailjs/browser";
import { isWeekend } from "date-fns";
import FeedbackForm from "./FeedbackForm";

function Admin() {
  const [events, setEvents] = useState({});
  const [requests, setRequests] = useState([]);
  const [uniqueNames, setUniqueNames] = useState([]);
  const [dates, setDates] = useState([]);
  const [shiftMatrix, setShiftMatrix] = useState({});
  const [hopes, setHopes] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [unsubmitted, setUnsubmitted] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);

  const EMAIL_SERVICE_ID = "service_12m5w0v";
  const EMAIL_TEMPLATE_ID = "template_gmkbnq8";
  const EMAIL_PUBLIC_KEY = "fmk7EZo2SxwG00Z7U";

  const shiftOptions = ["", "◯", "/", "X]", "休", "Y", "<", "□", "TF", "ｵC", "ｵﾛ"];

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "shiftRequests"));
        const eventSnapshot = await getDocs(collection(db, "staffEvents"));
        const eventMap = {};
        eventSnapshot.forEach((doc) => {
          const name = doc.id;
          const data = doc.data();
          if (data.events) {
            data.events.forEach((ev) => {
              const key = `${name}_${ev.date}`;
              eventMap[key] = ev.title;
            });
          }
        });
        setEvents(eventMap);

        const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setRequests(data);

        const staffSnap = await getDocs(collection(db, "staffList"));
        const staffNames = staffSnap.docs.map((doc) => doc.data().name);
        setStaffList(staffNames);

        const submittedNames = data.map((req) => req.name || req.email);
        const notSubmitted = staffNames.filter((name) => !submittedNames.includes(name));
        setUnsubmitted(notSubmitted);

        const nameSet = new Set();
        const dateSet = new Set();
        const matrix = {};
        const hopeData = {};

        data.forEach((req) => {
          const name = req.name || req.email;
          nameSet.add(name);
          req.shifts.forEach((s) => {
            dateSet.add(s.date);
            const key = `${name}_${s.date}`;
            hopeData[key] = s.selection;
            matrix[key] = "";
          });
        });

        const sortedDates = Array.from(dateSet).sort();
        const sortedNames = Array.from(nameSet).sort();

        setDates(sortedDates);
        setUniqueNames(sortedNames);
        setShiftMatrix(matrix);
        setHopes(hopeData);

        const monthKey = getMonthYearTitle(sortedDates);
        const savedDoc = await getDoc(doc(db, "shiftSchedules", monthKey));
        if (savedDoc.exists()) {
          const savedData = savedDoc.data();
          const restored = { ...matrix };
          for (const name of Object.keys(savedData)) {
            for (const date of Object.keys(savedData[name])) {
              const key = `${name}_${date}`;
              restored[key] = savedData[name][date];
            }
          }
          setShiftMatrix(restored);
        }
      } catch (error) {
        console.error("Firestore読み込みエラー:", error);
      }
    };
    fetchData();
  }, []);

  const handleChange = (name, date, value) => {
    const updated = { ...shiftMatrix };
    updated[`${name}_${date}`] = value;
    setShiftMatrix(updated);
  };

  const handleSave = async () => {
    try {
      const dataToSave = {};
      uniqueNames.forEach((name) => {
        dataToSave[name] = {};
        dates.forEach((date) => {
          const key = `${name}_${date}`;
          dataToSave[name][date] = shiftMatrix[key] || "";
        });
      });
      await setDoc(doc(db, "shiftSchedules", getMonthYearTitle(dates)), dataToSave);
      alert("シフトを保存しました！");
    } catch (error) {
      console.error("保存エラー:", error);
      alert("保存に失敗しました。");
    }
  };

  const handleLogout = () => {
    const auth = getAuth();
    signOut(auth)
      .then(() => {
        alert("ログアウトしました！");
        window.location.href = "/";
      })
      .catch((error) => {
        console.error("ログアウト失敗:", error);
      });
  };

  const handleAutoAssign = () => {
    const updated = { ...shiftMatrix };
    const nightAssigned = new Set();
    dates.forEach((date, i) => {
      uniqueNames.forEach((name) => {
        const key = `${name}_${date}`;
        if (hopes[key] === "night" && !nightAssigned.has(name)) {
          const date1 = date;
          const date2 = dates[i + 1];
          const date3 = dates[i + 2];
          if (date2 && date3) {
            updated[`${name}_${date1}`] = "/";
            updated[`${name}_${date2}`] = "X]";
            updated[`${name}_${date3}`] = "休";
            nightAssigned.add(name);
          }
        }
      });
    });

    dates.forEach((date) => {
      const dateObj = new Date(date);
      const isHoliday = isWeekend(dateObj);
      const required = {
        "/": isHoliday ? 3 : 4,
        "□": isHoliday ? 3 : 0,
        "ｵC": isHoliday ? 0 : 2,
        "ｵﾛ": isHoliday ? 0 : 2,
      };
      for (const [shiftType, count] of Object.entries(required)) {
        const unassigned = uniqueNames.filter((name) => !updated[`${name}_${date}`]);
        const selected = shuffleArray(unassigned).slice(0, count);
        selected.forEach((name) => {
          updated[`${name}_${date}`] = shiftType;
        });
      }
      uniqueNames.forEach((name) => {
        const key = `${name}_${date}`;
        if (!updated[key]) updated[key] = "◯";
      });
    });

    setShiftMatrix(updated);
    alert("AIによる仮割り当てが完了しました！");
  };

  const handleSendReminders = async () => {
    const results = [];
    for (const name of unsubmitted) {
      const staff = staffList.find((s) => s.name === name);
      const email = staff?.email;
      if (!email) {
        console.warn(`${name} にメールアドレスが登録されていません`);
        continue;
      }
      try {
        await emailjs.send(EMAIL_SERVICE_ID, EMAIL_TEMPLATE_ID, {
          name,
          to_email: email,
        }, EMAIL_PUBLIC_KEY);
        results.push(`${name} に送信成功`);
      } catch (error) {
        console.error(`送信失敗: ${name}`, error);
        results.push(`${name} に送信失敗`);
      }
    }
    alert(`送信完了：\n${results.join("\n")}`);
  };

  const handleCSVDownload = () => {
    let csv = ["名前", ...dates].join(",") + "\n";
    uniqueNames.forEach((name) => {
      const row = [name];
      dates.forEach((date) => {
        const key = `${name}_${date}`;
        row.push(shiftMatrix[key] || "");
      });
      csv += row.join(",") + "\n";
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const fileName = `${getMonthYearTitle()}_シフト表.csv`;
    saveAs(blob, fileName);
  };

  const getMonthYearTitle = (dateList = dates) => {
    if (dateList.length === 0) return "";
    const [year, month] = dateList[0].split("-");
    return `${year}年${parseInt(month)}月`;
  };

  const formatDateShort = (dateStr) => {
    const date = new Date(dateStr);
    const weekday = "日月火水木金土"[date.getDay()];
    return `${date.getDate()}(${weekday})`;
  };

  const getHopeLabel = (key) => {
    if (hopes[key] === "off") return "休み希望";
    if (hopes[key] === "night") return "夜勤希望";
    return "";
  };

  const getEventLabel = (key) => {
    return events[key] ? `🔔${events[key]}` : "";
  };

  if (!currentUser) {
    return <p>ログイン中のユーザーを確認しています...</p>;
  }

  // ✅ アクセス制限解除中
  console.log("現在のユーザー:", currentUser?.email);

  return (
    <div style={{ padding: "1rem", fontFamily: "sans-serif", overflowX: "scroll" }}>
      <h1>{getMonthYearTitle()}のシフト作成画面</h1>
      <button onClick={handleSave}>シフトを保存</button>
      <button onClick={handleAutoAssign} style={{ marginLeft: "1rem" }}>AI仮割り当て</button>
      <button onClick={handleCSVDownload} style={{ marginLeft: "1rem" }}>CSV出力</button>
      <button onClick={handleSendReminders} style={{ marginLeft: "1rem" }}>未提出者に催促</button>
      <button onClick={handleLogout} style={{ float: "right" }}>ログアウト</button>

      <div style={{ marginBottom: "1rem" }}>
        <strong>未提出者（{unsubmitted.length}名）:</strong>
        <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #ccc", padding: "0.5rem", borderRadius: "5px", backgroundColor: "#fafafa" }}>
          <ul>{unsubmitted.map((name) => <li key={name}>{name}</li>)}</ul>
        </div>
      </div>

      <table style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ccc", padding: "4px" }}>名前</th>
            {dates.map((date) => (
              <th key={date} style={{ border: "1px solid #ccc", padding: "4px" }}>{formatDateShort(date)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {uniqueNames.map((name) => (
            <tr key={name}>
              <td style={{ border: "1px solid #ccc", padding: "4px" }}>{name}</td>
              {dates.map((date) => {
                const key = `${name}_${date}`;
                const backgroundColor = hopes[key] === "off" ? "#e0f7fa" : hopes[key] === "night" ? "#fce4ec" : "white";
                return (
                  <td key={key} style={{ border: "1px solid #ccc", padding: "2px", backgroundColor }}>
                    <div style={{ fontSize: "0.7rem", color: "gray" }}>{getHopeLabel(key)} {getEventLabel(key)}</div>
                    <select value={shiftMatrix[key] || ""} onChange={(e) => handleChange(name, date, e.target.value)} style={{ width: "50px", marginTop: "2px" }}>
                      {shiftOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {showFeedback ? (
        <FeedbackForm onClose={() => setShowFeedback(false)} />
      ) : (
        <button onClick={() => setShowFeedback(true)} style={{ marginTop: "2rem" }}>
          改善提案を送る
        </button>
      )}
    </div>
  );
}

const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export default Admin;
