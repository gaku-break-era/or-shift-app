// src/ProcedureList.js
import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { useNavigate } from "react-router-dom";

function ProcedureList() {
  const [procedures, setProcedures] = useState([]);
  const [selectedDept, setSelectedDept] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProcedures = async () => {
      const querySnapshot = await getDocs(collection(db, "procedures"));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProcedures(data);
    };
    fetchProcedures();
  }, []);

  const departments = Array.from(new Set(procedures.map((p) => p.department))).sort();

  const filtered = selectedDept
    ? procedures.filter((p) => p.department === selectedDept)
    : procedures;

  return (
    <div style={{ padding: "1rem", fontFamily: "sans-serif" }}>
      <h1>術式手順書一覧</h1>

      <label style={{ marginBottom: "1rem", display: "block" }}>
        診療科で絞り込み：
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          style={{ marginLeft: "1rem" }}
        >
          <option value="">すべて</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      </label>

      <ul style={{ listStyle: "none", paddingLeft: 0 }}>
        {filtered.map((proc) => (
          <li
            key={proc.id}
            onClick={() => navigate(`/procedures/${proc.id}`)}
            style={{
              margin: "0.5rem 0",
              padding: "0.8rem",
              border: "1px solid #ddd",
              borderRadius: "5px",
              cursor: "pointer",
              backgroundColor: "#f9f9f9",
            }}
          >
            <strong>{proc.name}</strong>（{proc.department}）
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ProcedureList;
