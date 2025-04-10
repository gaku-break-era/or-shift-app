// src/AdminEventList.js
import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

function AdminEventList() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const querySnapshot = await getDocs(collection(db, "staffEvents"));
      const result = querySnapshot.docs.map(doc => ({
        name: doc.id,
        ...doc.data()
      }));
      setData(result);
    };
    fetchEvents();
  }, []);

  return (
    <div style={{ padding: "1rem", fontFamily: "sans-serif" }}>
      <h2>登録されたイベント一覧</h2>
      {data.map((staff) => (
        <div key={staff.name} style={{ marginBottom: "1rem" }}>
          <h3>{staff.name}</h3>
          <ul>
            {staff.events && staff.events.map((e, index) => (
              <li key={index}>
                📅{e.date}｜📝{e.title}｜⏰{e.time}｜📍{e.location}<br />
                🔔通知日: {e.notifyDate}｜🧳持ち物: {e.items}<br />
                ✍️課題: {e.notes}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default AdminEventList;
