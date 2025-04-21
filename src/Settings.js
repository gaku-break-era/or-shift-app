import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import "./Settings.css";
import Header from "./components/ui/Header";

function Settings() {
  const [staff, setStaff] = useState({
    id: "",
    lastName: "",
    firstName: "",
    email: "",
    year: "",
    role: "staff",
  });
  const [staffList, setStaffList] = useState([]);
  const [filter, setFilter] = useState("");
  const [editingStaff, setEditingStaff] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const fetchStaff = async () => {
    const querySnapshot = await getDocs(collection(db, "staffList"));
    const data = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setStaffList(data);
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleAdd = async () => {
    try {
      const exists = staffList.some((s) => s.employeeId === staff.id);
      if (exists) {
        alert("その社員番号はすでに登録されています。");
        return;
      }

      const newStaffRef = await addDoc(collection(db, "staffList"), {
        employeeId: staff.id,
        lastName: staff.lastName,
        firstName: staff.firstName,
        email: staff.email,
        year: staff.year,
        role: staff.role,
      });

      console.log("新規スタッフID:", newStaffRef.id);

      const proceduresRef = collection(db, "procedures");
      console.log("🟡 proceduresRef:", proceduresRef);

      const procSnap = await getDocs(proceduresRef);
      console.log("✅ procSnap.docs.length:", procSnap.docs.length);

      if (procSnap.docs.length === 0) {
        console.warn("⚠️ procedures にデータが存在しません！");
      }

      for (const proc of procSnap.docs) {
        const recordId = `${newStaffRef.id}_${proc.id}`;
        console.log("→ skillRecord 作成:", recordId);

        await setDoc(doc(db, "skillRecords", recordId), {
          userId: newStaffRef.id,
          procedureId: proc.id,
          level: "未経験",
        });
      }

      setStaff({
        id: "",
        lastName: "",
        firstName: "",
        email: "",
        year: "",
        role: "staff",
      });
      fetchStaff();
    } catch (err) {
      console.error("❌ エラー発生:", err);
    }
  };

  const handleDelete = async (docId) => {
    if (window.confirm("本当に削除しますか？")) {
      await deleteDoc(doc(db, "staffList", docId));
      fetchStaff();
    }
  };

  const handleEdit = (staff) => {
    setEditingStaff({ ...staff });
    setEditModalOpen(true);
  };

  const saveEdit = async () => {
    const ref = doc(db, "staffList", editingStaff.id);
    const { id, ...data } = editingStaff;
    await updateDoc(ref, data);
    setEditModalOpen(false);
    fetchStaff();
  };

  const filteredList = staffList.filter((s) =>
    [s.employeeId, s.lastName, s.firstName].some((field) =>
      (field || "").toLowerCase().includes(filter.toLowerCase())
    )
  );

  return (
    <div className="settings-container">
      <Header />
      <h2 className="settings-title">スタッフ登録・管理</h2>

      <table className="staff-form-table">
        <tbody>
          <tr>
            <td>社員番号</td>
            <td>
              <input
                type="text"
                value={staff.id}
                onChange={(e) => setStaff({ ...staff, id: e.target.value })}
              />
            </td>
          </tr>
          <tr>
            <td>姓</td>
            <td>
              <input
                type="text"
                value={staff.lastName}
                onChange={(e) => setStaff({ ...staff, lastName: e.target.value })}
              />
            </td>
          </tr>
          <tr>
            <td>名</td>
            <td>
              <input
                type="text"
                value={staff.firstName}
                onChange={(e) => setStaff({ ...staff, firstName: e.target.value })}
              />
            </td>
          </tr>
          <tr>
            <td>メールアドレス</td>
            <td>
              <input
                type="email"
                value={staff.email}
                onChange={(e) => setStaff({ ...staff, email: e.target.value })}
              />
            </td>
          </tr>
          <tr>
            <td>入職年</td>
            <td>
              <input
                type="text"
                value={staff.year}
                onChange={(e) => setStaff({ ...staff, year: e.target.value })}
              />
            </td>
          </tr>
          <tr>
            <td>権限</td>
            <td>
              <select
                value={staff.role}
                onChange={(e) => setStaff({ ...staff, role: e.target.value })}
              >
                <option value="admin">管理者</option>
                <option value="shift_manager">シフト管理者</option>
                <option value="assignment_manager">配置管理者</option>
                <option value="staff">スタッフ</option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>

      <button className="add-btn" onClick={handleAdd}>
        スタッフを追加
      </button>

      <div className="filter-input">
        <input
          type="text"
          placeholder="社員番号または氏名で検索"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="staff-list-scroll">
        <table className="staff-list-table">
          <thead>
            <tr>
              <th>社員番号</th>
              <th>氏名</th>
              <th>メール</th>
              <th>入職年</th>
              <th>権限</th>
              <th>変更</th>
              <th>削除</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.map((s) => (
              <tr key={s.id}>
                <td>{s.employeeId}</td>
                <td>{s.lastName} {s.firstName}</td>
                <td>{s.email}</td>
                <td>{s.year}</td>
                <td>{s.role}</td>
                <td>
                  <button className="edit-btn" onClick={() => handleEdit(s)}>変更</button>
                </td>
                <td>
                  <button className="delete-btn" onClick={() => handleDelete(s.id)}>削除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editModalOpen && (
        <div className="modal-backdrop" onClick={() => setEditModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>スタッフ情報の変更</h3>
              <button className="close-btn" onClick={() => setEditModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              {["employeeId", "lastName", "firstName", "email", "year"].map((field) => (
                <div key={field} style={{ marginBottom: "1rem" }}>
                  <label>{{
                    employeeId: "社員番号",
                    lastName: "姓",
                    firstName: "名",
                    email: "メール",
                    year: "入職年",
                  }[field]}</label>
                  <input
                    type="text"
                    value={editingStaff[field]}
                    onChange={(e) =>
                      setEditingStaff({ ...editingStaff, [field]: e.target.value })
                    }
                    style={{ width: "100%", padding: "0.5rem", border: "1px solid #ccc" }}
                  />
                </div>
              ))}
              <div>
                <label>権限</label>
                <select
                  value={editingStaff.role}
                  onChange={(e) =>
                    setEditingStaff({ ...editingStaff, role: e.target.value })
                  }
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid #ccc" }}
                >
                  <option value="admin">管理者</option>
                  <option value="shift_manager">シフト管理者</option>
                  <option value="assignment_manager">配置管理者</option>
                  <option value="staff">スタッフ</option>
                </select>
              </div>
              <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
                <button onClick={saveEdit} className="save-btn">確定</button>
                <button onClick={() => setEditModalOpen(false)} style={{ marginLeft: "1rem" }}>
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;
