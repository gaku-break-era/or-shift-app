import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  setDoc,
} from "firebase/firestore";
import Header from "../components/ui/Header";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const statusOptions = [
  "未経験", "見学済み", "経験1回", "経験2回",
  "経験3回以上", "外から見守り", "独り立ち", "指導可",
];

const statusMap = Object.fromEntries(statusOptions.map((v, i) => [v, i]));

function SkillChart() {
  const { staffId } = useParams();
  const [staffName, setStaffName] = useState("");
  const [departments, setDepartments] = useState([]);
  const [proceduresByDept, setProceduresByDept] = useState({});
  const [skillsByKey, setSkillsByKey] = useState({});

  const fetchData = async () => {
    const [deptSnap, procSnap, skillSnap, staffSnap] = await Promise.all([
      getDocs(collection(db, "departments")),
      getDocs(collection(db, "procedures")),
      getDocs(query(collection(db, "skillRecords"), where("userId", "==", staffId))),
      getDocs(collection(db, "staffList")),
    ]);

    const deptList = deptSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const procList = procSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const skillList = skillSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const skillMap = {};
    skillList.forEach(skill => {
      skillMap[`${skill.procedureId}_${skill.role}`] = { ...skill };
    });
    setSkillsByKey(skillMap);

    const staff = staffSnap.docs.find(doc => doc.id === staffId)?.data();
    if (staff) setStaffName(`${staff.lastName} ${staff.firstName}`);

    const grouped = {};
    deptList.forEach(dept => {
      const procs = procList.filter(p => p.departmentId === dept.id);
      grouped[dept.name] = procs.map(p => ({
        id: p.id,
        name: p.name,
        scrub: skillMap[`${p.id}_scrub`]?.level || "未経験",
        circulating: skillMap[`${p.id}_circulating`]?.level || "未経験",
        scrubId: skillMap[`${p.id}_scrub`]?.id,
        circulatingId: skillMap[`${p.id}_circulating`]?.id,
      }));
    });

    setDepartments(deptList);
    setProceduresByDept(grouped);
  };
  useEffect(() => {
    fetchData();
  }, [staffId]);

  const handleChange = (dept, procId, role, newLevel) => {
    setProceduresByDept(prev => {
      const updated = { ...prev };
      updated[dept] = updated[dept].map(p =>
        p.id === procId ? { ...p, [role]: newLevel } : p
      );
      return updated;
    });
  };

  const handleSave = async (dept) => {
    for (const p of proceduresByDept[dept]) {
      const base = { userId: staffId, procedureId: p.id };

      const scrubRef = p.scrubId ? doc(db, "skillRecords", p.scrubId) : doc(collection(db, "skillRecords"));
      await setDoc(scrubRef, { ...base, role: "scrub", level: p.scrub });

      const circRef = p.circulatingId ? doc(db, "skillRecords", p.circulatingId) : doc(collection(db, "skillRecords"));
      await setDoc(circRef, { ...base, role: "circulating", level: p.circulating });
    }
    alert("保存しました！");
    await fetchData();
  };

  const createRadarData = (role) => {
    const labels = [];
    const values = [];

    for (const dept in proceduresByDept) {
      const procs = proceduresByDept[dept];
      const nums = procs.map(p => statusMap[p[role]] ?? 0);
      const avg = nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100 / 7) : 0;
      labels.push(dept);
      values.push(avg);
    }

    return {
      labels,
      datasets: [
        {
          label: role === "scrub" ? "器械出し 全診療科" : "外回り 全診療科",
          data: values,
          backgroundColor: role === "scrub" ? "rgba(54,162,235,0.2)" : "rgba(255,99,132,0.2)",
          borderColor: role === "scrub" ? "#36a2eb" : "#ff6384",
          borderWidth: 2,
        },
      ],
    };
  };

  return (
    <div style={{ padding: "1rem" }}>
      <Header />
      <h2 style={{ textAlign: "center" }}>🧠 {staffName} のスキル進捗表</h2>

      <div style={{ display: "flex", justifyContent: "center", gap: "2rem", flexWrap: "wrap" }}>
        <div style={{ width: "300px", height: "300px" }}>
          <Radar data={createRadarData("scrub")} options={{ scales: { r: { min: 0, max: 100 } } }} />
        </div>
        <div style={{ width: "300px", height: "300px" }}>
          <Radar data={createRadarData("circulating")} options={{ scales: { r: { min: 0, max: 100 } } }} />
        </div>
      </div>

      {Object.entries(proceduresByDept).map(([dept, procs], idx) => (
        <div key={idx} style={{ maxWidth: "800px", margin: "3rem auto" }}>
          <h3 style={{ textAlign: "center" }}>{dept}</h3>
          <div style={{ display: "flex", justifyContent: "center", gap: "2rem", flexWrap: "wrap" }}>
            {["scrub", "circulating"].map(role => (
              <div key={role} style={{ width: "300px", height: "300px" }}>
                <Radar
                  data={{
                    labels: procs.map(p => p.name),
                    datasets: [
                      {
                        label: `${role === "scrub" ? "器械出し" : "外回り"}（${dept}）`,
                        data: procs.map(p => statusMap[p[role]] ?? 0),
                        backgroundColor: "rgba(255,206,86,0.2)",
                        borderColor: role === "scrub" ? "#36a2eb" : "#ff6384",
                        borderWidth: 2,
                      },
                      {
                        label: "独り立ちライン",
                        data: procs.map(() => 6),
                        borderColor: "rgba(0,200,83,1)",
                        borderWidth: 2,
                        pointRadius: 0,
                        fill: false,
                      },
                    ],
                  }}
                  options={{ scales: { r: { min: 0, max: 7, ticks: { stepSize: 1 } } } }}
                />
              </div>
            ))}
          </div>

          <div style={{ marginTop: "1rem" }}>
            {procs.map((p) => (
              <div key={p.id} style={{ margin: "1rem 0" }}>
                <div style={{ fontWeight: "bold" }}>{p.name}</div>
                {["scrub", "circulating"].map(role => (
                  <div key={role} style={{ display: "flex", alignItems: "center", margin: "0.25rem 0" }}>
                    <span style={{ width: "80px" }}>{role === "scrub" ? "器械出し" : "外回り"}</span>
                    <div style={{ flexGrow: 1, height: "10px", background: "#eee", margin: "0 0.5rem" }}>
                      <div style={{
                        width: `${(statusMap[p[role]] / 7) * 100}%`,
                        background: role === "scrub" ? "#36a2eb" : "#ff6384",
                        height: "100%",
                      }} />
                    </div>
                    <select
                      value={p[role]}
                      onChange={(e) => handleChange(dept, p.id, role, e.target.value)}
                      style={{ marginLeft: "0.5rem" }}
                    >
                      {statusOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            ))}
            <div style={{ textAlign: "center", marginTop: "1rem" }}>
              <button className="save-btn" onClick={() => handleSave(dept)}>保存する</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default SkillChart;
