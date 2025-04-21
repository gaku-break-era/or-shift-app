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
  "未経験",
  "見学済み",
  "経験1回",
  "経験2回",
  "経験3回以上",
  "外から見守り",
  "独り立ち",
  "指導可",
];

const statusMap = Object.fromEntries(statusOptions.map((v, i) => [v, i]));

function SkillChart() {
  const { staffId } = useParams();
  const [staffName, setStaffName] = useState("");
  const [chartDataByDept, setChartDataByDept] = useState([]);
  const [procedureByDept, setProcedureByDept] = useState({});
  const [skillsById, setSkillsById] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      const [deptSnap, procSnap, skillSnap, staffSnap] = await Promise.all([
        getDocs(collection(db, "departments")),
        getDocs(collection(db, "procedures")),
        getDocs(query(collection(db, "skillRecords"), where("userId", "==", staffId))),
        getDocs(collection(db, "staffList")),
      ]);

      const departments = deptSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const procedures = procSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const skills = skillSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const skillMap = {};
      skills.forEach(s => { skillMap[s.procedureId] = { ...s, id: s.id }; });
      setSkillsById(skillMap);

      const staffDoc = staffSnap.docs.find(doc => doc.id === staffId);
      if (staffDoc) {
        const s = staffDoc.data();
        setStaffName(`${s.lastName} ${s.firstName}`);
      }

      const chartArr = [];
      const proceduresGrouped = {};

      departments.forEach(dept => {
        const procs = procedures.filter(p => p.departmentId === dept.id);
        const labels = procs.map(p => p.name);
        const values = procs.map(p => {
            const level = skillMap[p.id]?.level;
            return statusMap[level] ?? 0;
          });
          


        chartArr.push({
          deptName: dept.name,
          chart: {
            labels,
            datasets: [
              {
                label: `${dept.name} の習得状況`,
                data: values,
                backgroundColor: "rgba(255, 99, 132, 0.2)",
                borderColor: "rgba(255, 99, 132, 1)",
                borderWidth: 2,
              },
              {
                label: "独り立ちライン",
                data: new Array(labels.length).fill(statusMap["独り立ち"]),
                borderColor: "rgba(0, 200, 83, 1)",
                borderWidth: 3,
                pointRadius: 0,
                fill: false,
              },
            ],
          },
        });

        proceduresGrouped[dept.name] = procs.map(p => ({
          procedureId: p.id,
          name: p.name,
          level: skillMap[p.id]?.level || "未経験",
          docId: skillMap[p.id]?.id,
        }));
      });

      setChartDataByDept(chartArr);
      setProcedureByDept(proceduresGrouped);
    };

    fetchData();
  }, [staffId]);

  const handleChange = (dept, procedureId, newLevel) => {
    setProcedureByDept(prev => {
      const updated = { ...prev };
      updated[dept] = updated[dept].map(p =>
        p.procedureId === procedureId ? { ...p, level: newLevel } : p
      );
      return updated;
    });
  };

  const handleSave = async () => {
    for (const dept in procedureByDept) {
      for (const p of procedureByDept[dept]) {
        if (p.docId) {
          await updateDoc(doc(db, "skillRecords", p.docId), {
            level: p.level,
          });
        }
      }
    }
    alert("保存しました！");
  };

  return (
    <div style={{ padding: "1rem" }}>
      <Header />
      <h2 style={{ textAlign: "center", fontSize: "1.5rem", marginBottom: "0.5rem" }}>
        🧠 {staffName || "スタッフ"} のスキル進捗表
      </h2>
      <p style={{ textAlign: "center", color: "#888" }}>ID: {staffId} のスキルページです。</p>

      {chartDataByDept.map(({ deptName, chart }, idx) => (
        <div key={idx} style={{ maxWidth: "800px", margin: "3rem auto" }}>
          <h3 style={{ textAlign: "center", marginBottom: "0.5rem" }}>{deptName}</h3>
          <Radar
            data={chart}
            options={{
              scales: {
                r: {
                  min: 0,
                  max: 7,
                  ticks: {
                    stepSize: 1,
                    callback: (val) =>
                      Object.entries(statusMap).find(([k, v]) => v === val)?.[0] || val,
                  },
                },
              },
              plugins: {
                legend: { position: "top" },
              },
            }}
          />

          {/* 編集フォーム */}
          <div style={{ marginTop: "1rem" }}>
            {procedureByDept[deptName]?.map((p) => (
              <div key={p.procedureId} style={{ margin: "0.5rem 0" }}>
                {p.name}
                <select
                  value={p.level}
                  onChange={(e) => handleChange(deptName, p.procedureId, e.target.value)}
                  style={{ marginLeft: "1rem" }}
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <button onClick={handleSave} className="save-btn">保存する</button>
      </div>
    </div>
  );
}

export default SkillChart;
