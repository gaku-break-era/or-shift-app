import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import Header from "../components/ui/Header";

function SkillsList() {
  const [staffList, setStaffList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStaff = async () => {
      const querySnapshot = await getDocs(collection(db, "staffList"));
      const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setStaffList(data);
    };

    fetchStaff();
  }, []);

  return (
    <div className="skills-list-container">
      <Header />
      <h2 style={{ margin: "1rem 0" }}>スキル進捗一覧</h2>
      <table className="staff-list-table" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>社員番号</th>
            <th>氏名</th>
            <th>スキルページ</th>
          </tr>
        </thead>
        <tbody>
          {staffList.map((staff) => (
            <tr key={staff.id}>
              <td>{staff.employeeId}</td>
              <td>{staff.lastName} {staff.firstName}</td>
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
