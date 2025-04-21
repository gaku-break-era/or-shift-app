import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import Header from "../components/ui/Header";
import "./ProcedureMaster.css";

function ProcedureMaster() {
  const [departments, setDepartments] = useState([]);
  const [procedures, setProcedures] = useState([]);

  const [showDeptModal, setShowDeptModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [editingDept, setEditingDept] = useState(null);

  const [newProcedure, setNewProcedure] = useState({ name: "", departmentId: "" });
  const [editingProc, setEditingProc] = useState(null);

  const [showProcModal, setShowProcModal] = useState(false);

  useEffect(() => {
    fetchDepartments();
    fetchProcedures();
  }, []);

  const fetchDepartments = async () => {
    const snapshot = await getDocs(collection(db, "departments"));
    setDepartments(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  const fetchProcedures = async () => {
    const snapshot = await getDocs(collection(db, "procedures"));
    setProcedures(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  const handleAddOrUpdateDepartment = async () => {
    if (!newDeptName.trim()) return;
    if (editingDept) {
      await updateDoc(doc(db, "departments", editingDept.id), { name: newDeptName });
    } else {
      await addDoc(collection(db, "departments"), { name: newDeptName });
    }
    setNewDeptName("");
    setEditingDept(null);
    setShowDeptModal(false);
    fetchDepartments();
  };

  const handleDeleteDepartment = async (id) => {
    if (window.confirm("本当に削除しますか？")) {
      await deleteDoc(doc(db, "departments", id));
      fetchDepartments();
    }
  };

  const handleAddOrUpdateProcedure = async () => {
    if (!newProcedure.name || !newProcedure.departmentId) return;
    if (editingProc) {
      await updateDoc(doc(db, "procedures", editingProc.id), newProcedure);
    } else {
      await addDoc(collection(db, "procedures"), newProcedure);
    }
    setNewProcedure({ name: "", departmentId: "" });
    setEditingProc(null);
    setShowProcModal(false);
    fetchProcedures();
  };

  const handleDeleteProcedure = async (id) => {
    if (window.confirm("本当に削除しますか？")) {
      await deleteDoc(doc(db, "procedures", id));
      fetchProcedures();
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = "name,departmentName\n術式A,消化器外科\n術式B,整形外科";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "procedure_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCsvUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split("\n").slice(1); // skip header

    for (const line of lines) {
      if (!line.trim()) continue;
      const [name, departmentName] = line.split(",");
      const dept = departments.find((d) => d.name.trim() === departmentName.trim());
      if (dept) {
        await addDoc(collection(db, "procedures"), {
          name: name.trim(),
          departmentId: dept.id,
        });
      }
    }
    alert("CSVから術式を登録しました。");
    fetchProcedures();
  };

  return (
    <div className="procedure-master-container">
      <Header />
      <h2 className="section-title">🩺 登録済みの診療科</h2>

      <button className="add-btn" onClick={() => setShowDeptModal(true)}>
        ＋ 診療科を追加する
      </button>

      <div className="table-wrapper">
        <table className="master-table">
          <thead>
            <tr>
              <th>診療科名</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((dept) => (
              <tr key={dept.id}>
                <td>{dept.name}</td>
                <td>
                  <button
                    onClick={() => {
                      setEditingDept(dept);
                      setNewDeptName(dept.name);
                      setShowDeptModal(true);
                    }}
                  >
                    編集
                  </button>
                  <button onClick={() => handleDeleteDepartment(dept.id)}>削除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="section-title">🛠 術式マスター</h2>
      <div className="flex-row">
        <button className="add-btn" onClick={() => setShowProcModal(true)}>
          ＋ 術式を追加する
        </button>
        <button className="add-btn" onClick={handleDownloadTemplate}>
        📥 CSVテンプレートをダウンロード
        </button>
        <button className="add-btn" onClick={() => document.getElementById('csvUpload').click()}>
        📤 CSVファイルをアップロード
        </button>
        <input
        id="csvUpload"
        type="file"
        accept=".csv"
        onChange={handleCsvUpload}
        style={{ display: "none" }}
        />

      </div>

      <div className="table-wrapper">
        <table className="master-table">
          <thead>
            <tr>
              <th>術式名</th>
              <th>診療科</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {procedures.map((proc) => (
              <tr key={proc.id}>
                <td>{proc.name}</td>
                <td>{departments.find((d) => d.id === proc.departmentId)?.name || "不明"}</td>
                <td>
                  <button
                    onClick={() => {
                      setEditingProc(proc);
                      setNewProcedure({ name: proc.name, departmentId: proc.departmentId });
                      setShowProcModal(true);
                    }}
                  >
                    編集
                  </button>
                  <button onClick={() => handleDeleteProcedure(proc.id)}>削除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 診療科モーダル */}
      {showDeptModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingDept ? "診療科を編集" : "診療科を追加"}</h3>
              <button
                className="close-btn"
                onClick={() => {
                  setShowDeptModal(false);
                  setEditingDept(null);
                  setNewDeptName("");
                }}
              >
                ×
              </button>
            </div>
            <input
              type="text"
              placeholder="診療科名を入力"
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
              className="input-field"
            />
            <button className="save-btn" onClick={handleAddOrUpdateDepartment}>
              登録する
            </button>
          </div>
        </div>
      )}

      {/* 術式モーダル */}
      {showProcModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingProc ? "術式を編集" : "術式を追加"}</h3>
              <button
                className="close-btn"
                onClick={() => {
                  setShowProcModal(false);
                  setEditingProc(null);
                  setNewProcedure({ name: "", departmentId: "" });
                }}
              >
                ×
              </button>
            </div>
            <input
              type="text"
              placeholder="術式名を入力"
              value={newProcedure.name}
              onChange={(e) =>
                setNewProcedure({ ...newProcedure, name: e.target.value })
              }
              className="input-field"
            />
            <select
              value={newProcedure.departmentId}
              onChange={(e) =>
                setNewProcedure({ ...newProcedure, departmentId: e.target.value })
              }
              className="input-field"
            >
              <option value="">診療科を選択</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
            <button className="save-btn" onClick={handleAddOrUpdateProcedure}>
              登録する
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProcedureMaster;
