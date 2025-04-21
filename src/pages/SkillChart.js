import React, { useEffect, useState } from "react";
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
import { getAuth } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import Header from "../components/ui/Header";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const statusMap = {
  "未経験": 0,
  "見学済み": 1,
  "経験1回": 2,
  "経験2回": 3,
  "経験3回以上": 4,
  "外から見守り": 5,
  "独り立ち": 6,
  "指導可": 7,
};

function SkillChart() {
  const [departmentProgress, setDepartmentProgress] = useState({});
  const [procedureDetails, setProcedureDetails] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      const user = getAuth().currentUser;
      if (!user) return;

      const [deptSnap, procSnap, skillSnap] = await Promise.all([
        getDocs(collection(db, "departments")),
        getDocs(collection(db, "procedures")),
        getDocs(query(collection(db, "skillRecords"), where("userId", "==", user.uid))),
      ]);

      const departments = deptSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const procedures = procSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const skills = skillSnap.docs.map(doc => doc.data());

      const deptProgress = {};
      const procedureByDept = {};

      departments.forEach(dept => {
        const procs = procedures.filter(p => p.departmentId === dept.id);
        procedureByDept[dept.name] = {};
        const levels = [];

        procs.forEach(proc => {
          const skill = skills.find(s => s.procedureId === proc.id);
          const levelStr = skill?.level || "未経験";
          const levelVal = statusMap[levelStr];
          procedureByDept[dept.name][proc.name] = levelStr;
          levels.push(levelVal);
        });

        const avg = levels.length ? Math.round((levels.reduce((a, b) => a + b, 0) / levels.length) * 100 / 7) : 0;
        deptProgress[dept.name] = avg;
      });

      setDepartmentProgress(deptProgress);
      setProcedureDetails(procedureByDept);
    };

    fetchData();
  }, []);

  const renderProcedureCharts = () => {
    return Object.entries(procedureDetails).map(([dept, procedures], idx) => {
      const labels = Object.keys(procedures);
      const values = labels.map(proc => statusMap[procedures[proc]]);
      const idealLine = new Array(labels.length).fill(statusMap["独り立ち"]);

      const chartData = {
        labels,
        datasets: [
          {
            label: `${dept} の習得状況`,
            data: values,
            backgroundColor: "rgba(255, 99, 132, 0.2)",
            borderColor: "rgba(255, 99, 132, 1)",
            borderWidth: 2,
          },
          {
            label: "独り立ちライン",
            data: idealLine,
            borderColor: "rgba(0, 200, 83, 1)",
            borderWidth: 3,
            pointRadius: 0,
            fill: false,
          },
        ],
      };

      return (
        <div key={idx} style={{ maxWidth: "600px", margin: "2rem auto" }}>
          <h3 style={{ textAlign: "center", marginBottom: "0.5rem" }}>{dept}</h3>
          <Radar
            data={chartData}
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
        </div>
      );
    });
  };

  return (
    <div style={{ padding: "1rem" }}>
      <Header />
      <h2 style={{ textAlign: "center", fontSize: "1.5rem", marginBottom: "2rem" }}>
        🧠 スキル進捗表
      </h2>

      <div style={{ maxWidth: "400px", margin: "0 auto", height: "400px" }}>
        <Radar
          data={{
            labels: Object.keys(departmentProgress),
            datasets: [
              {
                label: "独り立ち進捗（%）",
                data: Object.values(departmentProgress),
                backgroundColor: "rgba(54, 162, 235, 0.2)",
                borderColor: "rgba(54, 162, 235, 1)",
                borderWidth: 2,
              },
            ],
          }}
          options={{
            maintainAspectRatio: false,
            responsive: true,
            scales: {
              r: {
                min: 0,
                max: 100,
                ticks: { stepSize: 20 },
              },
            },
            plugins: {
              legend: { position: "top" },
            },
          }}
        />
      </div>

      <h2 style={{ textAlign: "center", marginTop: "3rem" }}>
        診療科別：術式ごとの習得状況
      </h2>
      {renderProcedureCharts()}
    </div>
  );
}

export default SkillChart;
