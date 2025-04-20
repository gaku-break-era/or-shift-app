import React from "react";
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
import Header from "../components/ui/Header";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

// ステータスと数値の対応
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

// ダミーの進捗データ（全科）
const departmentProgress = {
  "心臓外科": 60,
  "整形外科": 80,
  "消化器外科": 40,
  "脳神経外科": 30,
  "泌尿器科": 50,
  "呼吸器外科": 35,
  "眼科": 70,
  "耳鼻科": 55,
  "産婦人科": 65,
  "形成外科": 45,
};

// 各診療科に属する術式と習得状況（ダミー）
const dummyProcedures = {
  "心臓外科": {
    "冠動脈バイパス": "独り立ち",
    "弁形成術": "経験3回以上",
    "心房中隔欠損修復": "見学済み",
    "大動脈置換術": "未経験",
    "ペースメーカー植え込み": "指導可",
  },
  "整形外科": {
    "人工股関節置換": "経験2回",
    "人工膝関節置換": "独り立ち",
    "脊椎固定術": "経験1回",
    "骨折観血的整復": "見学済み",
    "関節鏡視下手術": "指導可",
  },
};

function SkillChart() {
  // 全科の進捗レーダーチャート
  const chartDataAll = {
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
  };

  const renderProcedureCharts = () => {
    return Object.entries(dummyProcedures).map(([dept, procedures], idx) => {
      const labels = Object.keys(procedures);
      const values = labels.map((proc) => statusMap[procedures[proc]]);
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
          }
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
                legend: { position: "top" }
              }
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

      {/* 全科の進捗チャート */}
      <div style={{ maxWidth: "400px", margin: "0 auto", height: "400px" }}>
  <Radar
    data={chartDataAll}
    options={{
      maintainAspectRatio: false, // アスペクト比に縛られず明示的サイズが有効に
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


      {/* 診療科別チャート */}
      <h2 style={{ textAlign: "center", marginTop: "3rem" }}>
        診療科別：術式ごとの習得状況
      </h2>
      {renderProcedureCharts()}
    </div>
  );
}

export default SkillChart;
