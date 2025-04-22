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
import Select from "react-select";
import "./ProcedureMaster.css";

function ProcedureMaster() {
  const [departments, setDepartments] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [procedureOptions, setProcedureOptions] = useState([]);

  const [showDeptModal, setShowDeptModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [editingDept, setEditingDept] = useState(null);

  const [showProcModal, setShowProcModal] = useState(false);
  const [editingProc, setEditingProc] = useState(null);
  const [newProcedure, setNewProcedure] = useState({
    name: "",
    departmentId: "",
    requiredRoles: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      const deptSnap = await getDocs(collection(db, "departments"));
      const procSnap = await getDocs(collection(db, "procedures"));
      const depts = deptSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const procs = procSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDepartments(depts);
      setProcedures(procs);
      setProcedureOptions(procs.map(p => ({ label: p.name, value: p.id })));
    };
    fetchData();
  }, []);

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

    const snapshot = await getDocs(collection(db, "departments"));
    setDepartments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleAddOrUpdateProcedure = async () => {
    if (!newProcedure.name || !newProcedure.departmentId) return;

    if (editingProc) {
      await updateDoc(doc(db, "procedures", editingProc.id), newProcedure);
    } else {
      await addDoc(collection(db, "procedures"), newProcedure);
    }

    setNewProcedure({ name: "", departmentId: "", requiredRoles: [] });
    setEditingProc(null);
    setShowProcModal(false);

    const snapshot = await getDocs(collection(db, "procedures"));
    setProcedures(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleDeleteProcedure = async (id) => {
    if (window.confirm("本当に削除しますか？")) {
      await deleteDoc(doc(db, "procedures", id));
      const snapshot = await getDocs(collection(db, "procedures"));
      setProcedures(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }
  };

  const addRequiredRole = () => {
    setNewProcedure(prev => ({
      ...prev,
      requiredRoles: [...prev.requiredRoles, {
        type: "scrub",
        count: 1,
        skills: [],
        label: ""
      }],
    }));
  };

  const updateRequiredRole = (idx, key, value) => {
    const updated = [...newProcedure.requiredRoles];
    updated[idx][key] = value;
    setNewProcedure(prev => ({ ...prev, requiredRoles: updated }));
  };

  const removeRequiredRole = (idx) => {
    const updated = [...newProcedure.requiredRoles];
    updated.splice(idx, 1);
    setNewProcedure(prev => ({ ...prev, requiredRoles: updated }));
  };

  return (
    <div className="procedure-master-container">
      <Header />
      <h2 className="section-title">📋 登録済みの診療科</h2>

      <button className="add-btn" onClick={() => setShowDeptModal(true)}>＋ 診療科を追加する</button>

      <div className="table-wrapper">
        <table className="master-table">
          <thead>
            <tr>
              <th>診療科名</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((dept) => (
              <tr key={dept.id}>
                <td>{dept.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="section-title">🛠 術式マスター</h2>
      <button className="add-btn" onClick={() => setShowProcModal(true)}>
        ＋ 術式を追加する
      </button>

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
                  <button onClick={() => {
                    setEditingProc(proc);
                    setNewProcedure({
                      name: proc.name,
                      departmentId: proc.departmentId,
                      requiredRoles: proc.requiredRoles || [],
                    });
                    setShowProcModal(true);
                  }}>編集</button>
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
              <button className="close-btn" onClick={() => {
                setShowDeptModal(false);
                setEditingDept(null);
                setNewDeptName("");
              }}>×</button>
            </div>
            <input
              type="text"
              placeholder="診療科名を入力"
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
              className="input-field"
            />
            <button className="save-btn" onClick={handleAddOrUpdateDepartment}>登録する</button>
          </div>
        </div>
      )}

      {/* 術式モーダル */}
      {showProcModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingProc ? "術式を編集" : "術式を追加"}</h3>
              <button className="close-btn" onClick={() => {
                setShowProcModal(false);
                setEditingProc(null);
                setNewProcedure({ name: "", departmentId: "", requiredRoles: [] });
              }}>×</button>
            </div>

            <input
              type="text"
              placeholder="術式名"
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

            <h4 style={{ marginTop: "1rem" }}>🔧 必要人員（役割・スキル条件）</h4>
            {newProcedure.requiredRoles.map((role, idx) => (
              <div key={idx} style={{ marginBottom: "1rem" }}>
                <input
                  type="text"
                  placeholder="ラベル（例: 消化器側）"
                  value={role.label}
                  onChange={(e) => updateRequiredRole(idx, "label", e.target.value)}
                  style={{ marginBottom: "0.5rem", width: "60%" }}
                />
                <select
                  value={role.type}
                  onChange={(e) => updateRequiredRole(idx, "type", e.target.value)}
                  style={{ marginRight: "0.5rem" }}
                >
                  <option value="scrub">器械出し</option>
                  <option value="circulating">外回り</option>
                  <option value="assistant">助手</option>
                </select>
                <input
                  type="number"
                  min={1}
                  value={role.count}
                  onChange={(e) =>
                    updateRequiredRole(idx, "count", parseInt(e.target.value))
                  }
                  style={{ width: "60px", marginRight: "0.5rem" }}
                />
                <Select
                  isMulti
                  options={procedureOptions}
                  value={procedureOptions.filter((o) =>
                    role.skills?.includes(o.value)
                  )}
                  onChange={(selected) =>
                    updateRequiredRole(
                      idx,
                      "skills",
                      selected.map((s) => s.value)
                    )
                  }
                  placeholder="このポジションに必要なスキル"
                  styles={{ container: base => ({ ...base, width: "60%" }) }}
                />
                <button onClick={() => removeRequiredRole(idx)} style={{ marginLeft: "0.5rem" }}>削除</button>
              </div>
            ))}
            <button onClick={addRequiredRole} style={{ marginTop: "0.5rem" }}>＋ 看護師追加</button>

            <div style={{ textAlign: "right", marginTop: "1.5rem" }}>
              <button className="save-btn" onClick={handleAddOrUpdateProcedure}>保存する</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProcedureMaster;
