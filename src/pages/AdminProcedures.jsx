// src/pages/AdminProcedures.js
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  setDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import Header from "../components/ui/Header";

const skillLevels = [
  "未経験",
  "見学済み",
  "経験1回",
  "経験2回",
  "経験3回以上",
  "外から見守り",
  "独り立ち",
  "指導可",
];

function AdminProcedures() {
  const [departments, setDepartments] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [skillMap, setSkillMap] = useState({});
  const user = getAuth().currentUser;

  useEffect(() => {
    const fetchMasterData = async () => {
      const deptSnap = await getDocs(collection(db, "departments"));
      const procSnap = await getDocs(collection(db, "procedures"));

      const depts = deptSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const procs = procSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      setDepartments(depts);
      setProcedures(procs);
    };

    const fetchSkillRecords = async () => {
      if (!user) return;
      const q = query(
        collection(db, "skillRecords"),
        where("userId", "==", user.uid)
      );
      const snapshot = await getDocs(q);
      const data = {};
      snapshot.docs.forEach((doc) => {
        data[doc.data().procedureId] = doc.data().level;
      });
      setSkillMap(data);
    };

    fetchMasterData();
    fetchSkillRecords();
  }, [user]);

  const handleChange = async (procedureId, level) => {
    if (!user) return;
    const recordRef = doc(db, "skillRecords", `${user.uid}_${procedureId}`);
    await setDoc(recordRef, {
      userId: user.uid,
      procedureId,
      level,
    });
    setSkillMap((prev) => ({ ...prev, [procedureId]: level }));
  };

  return (
    <div>
      <Header />
      <h2 style={{ textAlign: "center", fontSize: "1.5rem", margin: "1rem" }}>📝 術式ごとのスキル進捗登録</h2>
      <div style={{ padding: "1rem" }}>
        {departments.map((dept) => {
          const deptProcedures = procedures.filter((p) => p.departmentId === dept.id);
          return (
            <div key={dept.id} style={{ marginBottom: "2rem" }}>
              <h3 style={{ marginBottom: "0.5rem" }}>{dept.name}</h3>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f0f0f0" }}>
                    <th style={{ padding: "0.5rem", border: "1px solid #ccc" }}>術式名</th>
                    <th style={{ padding: "0.5rem", border: "1px solid #ccc" }}>現在のステータス</th>
                    <th style={{ padding: "0.5rem", border: "1px solid #ccc" }}>選択</th>
                  </tr>
                </thead>
                <tbody>
                  {deptProcedures.map((proc) => (
                    <tr key={proc.id}>
                      <td style={{ padding: "0.5rem", border: "1px solid #ccc" }}>{proc.name}</td>
                      <td style={{ padding: "0.5rem", border: "1px solid #ccc" }}>
                        {skillMap[proc.id] || "未登録"}
                      </td>
                      <td style={{ padding: "0.5rem", border: "1px solid #ccc" }}>
                        <select
                          value={skillMap[proc.id] || ""}
                          onChange={(e) => handleChange(proc.id, e.target.value)}
                        >
                          <option value="">-- 選択 --</option>
                          {skillLevels.map((level) => (
                            <option key={level} value={level}>
                              {level}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AdminProcedures;
