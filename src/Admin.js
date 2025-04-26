// src/Admin.js
import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "./firebase";
import { collection, getDocs, setDoc, doc, getDoc } from "firebase/firestore";
import { saveAs } from "file-saver";
import emailjs from "@emailjs/browser";
import { isWeekend } from "date-fns";
import dayjs from "dayjs";
// dayjs プラグインのインポート
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import FeedbackForm from "./FeedbackForm";
import Header from "./components/ui/Header";

// dayjs プラグインの拡張
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

// テーブルセル用スタイル
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
  const [uniqueNames, setUniqueNames] = useState([]);
  const [dates, setDates] = useState([]);
  const [shiftMatrix, setShiftMatrix] = useState({});
  const [hopes, setHopes] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [unsubmitted, setUnsubmitted] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(dayjs().month() + 1);
  const [loading, setLoading] = useState(true);
  const [submittedStaff, setSubmittedStaff] = useState(new Set()); // 希望提出済みスタッフを追跡

  const EMAIL_SERVICE_ID = "service_12m5w0v";
  const EMAIL_TEMPLATE_ID = "template_gmkbnq8";
  const EMAIL_PUBLIC_KEY = "fmk7EZo2SxwG00Z7U";

  const shiftOptions = ["", "◯", "/", "X]", "休", "Y", "<", "□", "TF", "ｵC", "ｵﾛ"];

  // ログイン状態の監視
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return () => unsubscribe();
  }, []);

  // データ読み込み（currentMonthが変わるごと）
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const year = dayjs().year();
        // ① 今表示中の月(YYYY-MM-DDリスト)を作成
        const startOfMonth = dayjs(`${year}-${String(currentMonth).padStart(2, "0")}-01`);
        const endOfMonth   = startOfMonth.endOf("month");
        const monthDates = [];
        
        // 日付リストを作成
        let currentDate = startOfMonth;
        while (currentDate.isBefore(endOfMonth) || currentDate.isSame(endOfMonth)) {
          monthDates.push(currentDate.format("YYYY-MM-DD"));
          currentDate = currentDate.add(1, "day");
        }
        
        setDates(monthDates);

        // ⑥ 先にstaffList取得
        const staffSnap = await getDocs(collection(db, "staffList"));
        const staffData = staffSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          name: `${d.data().lastName || ''} ${d.data().firstName || ''}`.trim()
        }));
        setStaffList(staffData);
        
        // 登録されているスタッフ名のリストを作成（希望未提出でも表示するため）
        const registeredStaffNames = staffData
          .filter(s => s.name) // 名前が設定されているスタッフのみ
          .map(s => s.name);
          
        console.log("登録スタッフ:", registeredStaffNames);

        // ② シフト希望データを取得
        const reqSnap = await getDocs(collection(db, "shiftRequests"));
        
        // 希望データの取得とデバッグ
        const requests = reqSnap.docs.map((d) => {
          const data = { id: d.id, ...d.data() };
          console.log(`シフト希望データ: ${data.name || data.email}`, data);
          return data;
        });

        // ③ 希望提出済みスタッフの追跡
        const submittedNames = new Set();
        requests.forEach(req => {
          const name = req.name || req.email;
          if (name) submittedNames.add(name);
        });
        setSubmittedStaff(submittedNames);
        
        // 未提出者リスト作成
        setUnsubmitted(registeredStaffNames.filter(n => !submittedNames.has(n)));

        // ④ hopeMap(希望) と 初期行列(matrix) を用意
        const matrix = {};
        const hopeMap = {};

        // まず空のマトリックスを作成（全登録スタッフ対象）
        registeredStaffNames.forEach((name) => {
          monthDates.forEach((date) => {
            matrix[`${name}_${date}`] = "";
            hopeMap[`${name}_${date}`] = "";
          });
        });

        // シフト希望を処理
        let hopesCount = 0;  // 処理した希望の数をカウント
        
        for (const req of requests) {
          const name = req.name || req.email;
          if (!name) continue;
          
          // 現在の月のリクエストかチェック
          const monthPattern = `${year}${String(currentMonth).padStart(2, '0')}`;
          if (req.id && req.id.includes(monthPattern)) {
            console.log(`${name} の希望データを処理中...`);
          }
          
          const reqShifts = req.shifts || [];
          
          // 希望データのデバッグ出力
          console.log(`${name}のシフト希望 (${reqShifts.length}件):`, JSON.stringify(reqShifts));
          
          for (const shift of reqShifts) {
            if (monthDates.includes(shift.date)) {
              // selectionを直接マッピング（off, night, noneなど）
              const key = `${name}_${shift.date}`;
              const value = shift.selection || "";
              
              hopeMap[key] = value;
              hopesCount++;
              
              console.log(`希望設定: ${key} = ${value}`);
            }
          }
        }
        
        console.log(`合計 ${hopesCount} 件の希望を設定しました`);
        console.log("希望マップ:", hopeMap);
        setHopes(hopeMap);

        // ⑤ 保存済みシフト表があれば上書き反映
        const title = `${year}年${currentMonth}月`;
        const savedSnap = await getDoc(doc(db, "shiftSchedules", title));
        if (savedSnap.exists()) {
          const saved = savedSnap.data();
          console.log("保存済みシフト表:", saved);
          Object.keys(saved).forEach(name => {
            Object.keys(saved[name]).forEach(date => {
              if (monthDates.includes(date)) {
                matrix[`${name}_${date}`] = saved[name][date] || "";
              }
            });
          });
        }
        setShiftMatrix(matrix);
        
        // ⑦ uniqueNamesを登録スタッフ名に設定
        setUniqueNames(registeredStaffNames.sort());

        // ⑧ イベント読み込み
        const evSnap = await getDocs(collection(db, "staffEvents"));
        const evMap = {};
        evSnap.docs.forEach((d) => {
          const name = d.id;
          (d.data().events || []).forEach((ev) => {
            if (ev.date && monthDates.includes(ev.date)) {
              evMap[`${name}_${ev.date}`] = ev.title;
            }
          });
        });
        setEvents(evMap);
      } catch (err) {
        console.error("読み込みエラー:", err);
        alert("データの読み込みに失敗しました: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentMonth]);

  // 値更新ハンドラ
  const handleChange = (name, date, value) => {
    setShiftMatrix((prev) => ({ ...prev, [`${name}_${date}`]: value }));
  };

  // 保存
  const handleSave = async () => {
    try {
      const dataToSave = {};
      uniqueNames.forEach((name) => {
        dataToSave[name] = {};
        dates.forEach((date) => {
          dataToSave[name][date] = shiftMatrix[`${name}_${date}`] || "";
        });
      });
      const title = `${dayjs().year()}年${currentMonth}月`;
      await setDoc(doc(db, "shiftSchedules", title), dataToSave);
      alert("シフトを保存しました！");
    } catch (err) {
      console.error(err);
      alert("保存に失敗しました。");
    }
  };

  // AI仮割り当て
  const handleAutoAssign = () => {
    const updated = { ...shiftMatrix };
    const nightAssigned = new Set();
    // 夜勤希望処理
    dates.forEach((date, i) => {
      uniqueNames.forEach((name) => {
        const key = `${name}_${date}`;
        if (hopes[key] === "night" && !nightAssigned.has(name)) {
          const d2 = dates[i + 1], d3 = dates[i + 2];
          if (d2 && d3) {
            updated[`${name}_${date}`] = "/";
            updated[`${name}_${d2}`]   = "X]";
            updated[`${name}_${d3}`]   = "休";
            nightAssigned.add(name);
          }
        }
      });
    });
    // その他の配置
    dates.forEach((date) => {
      const holiday = isWeekend(new Date(date));
      const required = { "/": holiday ? 3 : 4, "□": holiday ? 3 : 0, "ｵC": holiday ? 0 : 2, "ｵﾛ": holiday ? 0 : 2 };
      for (const [type, count] of Object.entries(required)) {
        const unassigned = uniqueNames.filter((name) => !updated[`${name}_${date}`]);
        shuffleArray(unassigned).slice(0, count).forEach((name) => {
          updated[`${name}_${date}`] = type;
        });
      }
      uniqueNames.forEach((name) => {
        if (!updated[`${name}_${date}`]) updated[`${name}_${date}`] = "◯";
      });
    });
    setShiftMatrix(updated);
    alert("AIによる仮割り当てが完了しました！");
  };

  // 催促メール送信
  const handleSendReminders = async () => {
    const results = [];
    for (const name of unsubmitted) {
      const staff = staffList.find((s) => s.name === name);
      const email = staff?.email;
      if (!email) {
        results.push(`${name}：メールアドレス未登録`);
        continue;
      }
      try {
        await emailjs.send(EMAIL_SERVICE_ID, EMAIL_TEMPLATE_ID, { name, to_email: email }, EMAIL_PUBLIC_KEY);
        results.push(`${name}：送信成功`);
      } catch (err) {
        console.error(`${name}へのメール送信エラー:`, err);
        results.push(`${name}：送信失敗`);
      }
    }
    alert("催促結果：\n" + results.join("\n"));
  };

  // CSV出力
  const handleCSVDownload = () => {
    let csv = ["名前", ...dates].join(",") + "\n";
    uniqueNames.forEach((name) => {
      const row = [name];
      dates.forEach((date) => row.push(shiftMatrix[`${name}_${date}`] || ""));
      csv += row.join(",") + "\n";
    });
    saveAs(new Blob([csv], { type: "text/csv" }), `${dayjs().year()}-${currentMonth}_shift.csv`);
  };

  // ラベル用
  const getHopeLabel = (key) => {
    if (hopes[key] === "off") return "休み希望";
    if (hopes[key] === "night") return "夜勤希望";
    if (hopes[key] === "none") return "希望なし"; // "none"を「希望なし」として表示
    return "";
  };
  
  const getEventLabel = (key) => (events[key] ? `🔔${events[key]}` : "");

  // 未ログイン時
  if (!currentUser) return <p>ログイン中...</p>;
  
  // データ読み込み中
  if (loading) return (
    <div style={{ padding: "1rem", fontFamily: "sans-serif", textAlign: "center" }}>
      <Header />
      <h2>データを読み込み中...</h2>
    </div>
  );

  return (
    <div style={{ padding: "1rem", overflowX: "auto", fontFamily: "sans-serif" }}>
      {/* 共通ヘッダー */}
      <Header />

      <div style={{ padding: "1rem", fontFamily: "sans-serif", overflowX: "scroll" }}>
        <h1>{`${dayjs().year()}年${currentMonth}月のシフト作成画面`}</h1>

        {/* 月切り替え */}
        <div style={{ margin: "0.5rem 0" }}>
          <button onClick={() => setCurrentMonth((p) => (p === 1 ? 12 : p - 1))}>◀ 前月</button>
          <span style={{ margin: "0 1rem" }}>{`${currentMonth}月`}</span>
          <button onClick={() => setCurrentMonth((p) => (p === 12 ? 1 : p + 1))}>翌月 ▶</button>
        </div>

        {/* 凡例 */}
        <div style={{ 
          display: "flex", 
          gap: "1rem", 
          margin: "1rem 0", 
          fontSize: "0.85rem",
          flexWrap: "wrap" 
        }}>
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

        {/* 操作ボタン */}
        <div style={{ 
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          margin: "1rem 0", 
        }}>
          <button
            onClick={handleSave}
            style={{
              flex: "1 1 calc(50% - 1rem)",
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

          <button
            onClick={handleAutoAssign}
            style={{
              flex: "1 1 calc(50% - 1rem)",
              padding: "1rem",
              backgroundColor: "#FBBC05",
              color: "#333",
              border: "none",
              borderRadius: "8px",
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            🤖 AI仮割り当て
          </button>

          <button
            onClick={handleCSVDownload}
            style={{
              flex: "1 1 calc(50% - 1rem)",
              padding: "1rem",
              backgroundColor: "#34A853",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            📑 CSV出力
          </button>

          <button
            onClick={handleSendReminders}
            style={{
              flex: "1 1 calc(50% - 1rem)",
              padding: "1rem",
              backgroundColor: "#EA4335",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            ✉️ 未提出者催促
          </button>
        </div>

        {/* 未提出者 */}
        <div style={{ marginBottom: "1rem" }}>
          <strong>未提出者（{unsubmitted.length}名）：</strong>
          <div style={{ maxHeight: "150px", overflowY: "auto", border: "1px solid #ccc", padding: "0.5rem" }}>
            <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
              {unsubmitted.map((n) => <li key={n}>{n}</li>)}
            </ul>
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
            {uniqueNames.map((name) => {
              const hasSubmitted = submittedStaff.has(name);
              
              return (
                <tr key={name}>
                  <td style={{ 
                    ...tdStyle, 
                    backgroundColor: hasSubmitted ? "white" : "#ffebee",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    minWidth: "150px"
                  }}>
                    <span>{name}</span>
                    {!hasSubmitted && (
                      <span style={{ 
                        fontSize: "0.7rem", 
                        color: "#e53935",
                        marginLeft: "4px",
                        whiteSpace: "nowrap"
                      }}>
                        [未提出]
                      </span>
                    )}
                  </td>
                  {dates.map((date) => {
                    const key = `${name}_${date}`;
                    // 希望マップから希望を取得
                    const hopeValue = hopes[key];
                    
                    // 背景色の決定（none も考慮）
                    const bg = 
                      !hasSubmitted ? "#fff8e1" :
                      hopeValue === "off" ? "#e0f7fa" :
                      hopeValue === "night" ? "#fce4ec" : 
                      hopeValue === "none" ? "#f9f9f9" :
                      "white";
                      
                    return (
                      <td key={key} style={{ ...tdStyle, backgroundColor: bg, textAlign: "center" }}>
                        <div style={{ fontSize: "0.7rem", color: "#666" }}>
                          {!hasSubmitted ? 
                            "希望未提出" : 
                            getHopeLabel(key)} 
                          {getEventLabel(key)}
                        </div>
                        <select
                          value={shiftMatrix[key] || ""}
                          onChange={(e) => handleChange(name, date, e.target.value)}
                          style={{ width: "50px", marginTop: "2px" }}
                        >
                          {shiftOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* 改善提案 */}
        {showFeedback
          ? <FeedbackForm onClose={() => setShowFeedback(false)} />
          : <button onClick={() => setShowFeedback(true)} style={{ marginTop: "1rem" }}>改善提案を送る</button>
        }
        
        {/* 開発者向けヘルパーボタン */}
        <div style={{ marginTop: "2rem", borderTop: "1px solid #ccc", paddingTop: "1rem" }}>
          <button 
            onClick={() => console.log("現在の希望データ:", hopes)}
            style={{ marginRight: "0.5rem", fontSize: "0.8rem" }}
          >
            希望データをログ
          </button>
          <button 
            onClick={() => console.log("提出済みスタッフ:", [...submittedStaff])}
            style={{ marginRight: "0.5rem", fontSize: "0.8rem" }}
          >
            提出者をログ
          </button>
          <button 
            onClick={() => {
              // 提出された希望のデバッグ
              Object.entries(hopes).forEach(([key, value]) => {
                if (value && value !== "") {
                  console.log(`希望あり: ${key} = ${value}`);
                }
              });
            }}
            style={{ fontSize: "0.8rem" }}
          >
            有効な希望をログ
          </button>
        </div>
      </div>
    </div>
  );
}

export default Admin;