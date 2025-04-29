import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import Header from "../components/ui/Header";
import dayjs from "dayjs"; // 年次判定用に追加

function SkillsList() {
  const [staffList, setStaffList] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");
  const [years, setYears] = useState([]);
  const navigate = useNavigate();
  const currentYear = dayjs().year();

  useEffect(() => {
    const fetchStaff = async () => {
      const querySnapshot = await getDocs(collection(db, "staffList"));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        generation: currentYear - Number(doc.data().year || currentYear), // 年次を算出
      }));

      // 学年のリスト生成（昇順）例: [1, 2, 3, 4]
      const uniqueYears = [...new Set(data.map(d => d.generation))]
        .sort((a, b) => a - b);

      setStaffList(data);
      setYears(uniqueYears);
      setFilteredStaff(data);
    };

    fetchStaff();
  }, []);

  useEffect(() => {
    let filtered = [...staffList];

    if (selectedYear !== "all") {
      filtered = filtered.filter((s) => s.generation === Number(selectedYear));
    }

    if (searchKeyword.trim() !== "") {
      const lower = searchKeyword.toLowerCase();
      filtered = filtered.filter((s) =>
        `${s.lastName}${s.firstName}`.toLowerCase().includes(lower)
      );
    }

    // 入職年順にソート
    filtered.sort((a, b) => a.generation - b.generation);

    setFilteredStaff(filtered);
  }, [staffList, selectedYear, searchKeyword]);

  return (
    <div className="skills-list-container">
      <Header />
      <h2 style={{ margin: "1rem 0" }}>スキル進捗一覧</h2>

      {/* 🔍 フィルターUI追加 */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          <option value="all">すべての年次</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y + 1}年目（{currentYear - y}年入職）
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="氏名検索"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
        />
      </div>

      <table className="staff-list-table" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>社員番号</th>
            <th>氏名</th>
            <th>年次</th>
            <th>スキルページ</th>
          </tr>
        </thead>
        <tbody>
          {filteredStaff.map((staff) => (
            <tr key={staff.id}>
              <td>{staff.employeeId}</td>
              <td>{staff.lastName} {staff.firstName}</td>
              <td>{staff.generation + 1}年目</td>
              <td>
                <button
                  onClick={() => navigate(`/skills/${staff.id}`)}
                  style={{ padding: "0.3rem 0.6rem", background: "#007bff", color: "white", border: "none", borderRadius: "4px" }}
                >
                  スキルを見る
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SkillsList;
