// src/Settings.js
import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
} from "firebase/firestore";

function Settings() {
  const [staffList, setStaffList] = useState([]);
  const [formData, setFormData] = useState({
    employeeId: "",
    lastName: "",
    firstName: "",
    email: "",
    entryYear: "",
    role: "staff",
  });
  const [error, setError] = useState("");

  const fetchStaffList = async () => {
    const snapshot = await getDocs(collection(db, "staffList"));
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setStaffList(data);
  };

  useEffect(() => {
    fetchStaffList();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.employeeId || !formData.email) {
      setError("社員番号とメールアドレスは必須です。");
      return;
    }

    const existing = staffList.find(
      (s) => s.employeeId === formData.employeeId
    );
    if (existing) {
      setError("この社員番号は既に登録されています。");
      return;
    }

    try {
      await setDoc(doc(db, "staffList", formData.employeeId), {
        ...formData,
        entryYear: parseInt(formData.entryYear),
        skills: {},
      });
      setError("");
      setFormData({
        employeeId: "",
        lastName: "",
        firstName: "",
        email: "",
        entryYear: "",
        role: "staff",
      });
      fetchStaffList();
    } catch (err) {
      console.error("登録エラー:", err);
      setError("登録に失敗しました。");
    }
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "staffList", id));
    fetchStaffList();
  };

  const handleRoleChange = async (id, newRole) => {
    const staff = staffList.find((s) => s.employeeId === id);
    if (!staff) return;

    await setDoc(doc(db, "staffList", id), { ...staff, role: newRole });
    fetchStaffList();
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif", maxWidth: "700px", margin: "auto" }}>
      <h2>スタッフ登録・管理</h2>

      <form onSubmit={handleSubmit} style={{ marginBottom: "2rem" }}>
        <h3>新規登録</h3>
        <input name="employeeId" placeholder="社員番号" value={formData.employeeId} onChange={handleChange} required />
        <input name="lastName" placeholder="姓" value={formData.lastName} onChange={handleChange} />
        <input name="firstName" placeholder="名" value={formData.firstName} onChange={handleChange} />
        <input name="email" placeholder="メールアドレス" value={formData.email} onChange={handleChange} required />
        <input name="entryYear" placeholder="入職年 (例: 2022)" value={formData.entryYear} onChange={handleChange} />
        <select name="role" value={formData.role} onChange={handleChange}>
          <option value="admin">管理者</option>
          <option value="shift_manager">シフト管理者</option>
          <option value="assignment_manager">配置管理者</option>
          <option value="staff">スタッフ</option>
        </select>
        <button type="submit">登録</button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>

      <h3>登録済みスタッフ一覧</h3>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>社員番号</th>
            <th>氏名</th>
            <th>メール</th>
            <th>入職年</th>
            <th>権限</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {staffList.map((staff) => (
            <tr key={staff.employeeId}>
              <td>{staff.employeeId}</td>
              <td>{staff.lastName} {staff.firstName}</td>
              <td>{staff.email}</td>
              <td>{staff.entryYear}</td>
              <td>
                <select
                  value={staff.role}
                  onChange={(e) => handleRoleChange(staff.employeeId, e.target.value)}
                >
                  <option value="admin">管理者</option>
                  <option value="shift_manager">シフト管理者</option>
                  <option value="assignment_manager">配置管理者</option>
                  <option value="staff">スタッフ</option>
                </select>
              </td>
              <td>
                <button onClick={() => handleDelete(staff.employeeId)}>削除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Settings;
