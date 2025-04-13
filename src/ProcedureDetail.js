// src/ProcedureDetail.js
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

function ProcedureDetail() {
  const { id } = useParams();
  const [procedure, setProcedure] = useState(null);

  useEffect(() => {
    const fetchProcedure = async () => {
      const ref = doc(db, "procedures", id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setProcedure({ id: snap.id, ...snap.data() });
      }
    };
    fetchProcedure();
  }, [id]);

  if (!procedure) return <p>読み込み中...</p>;

  return (
    <div style={{ padding: "1rem", fontFamily: "sans-serif" }}>
      <h2>{procedure.name}</h2>
      <p><strong>診療科：</strong>{procedure.department}</p>
      <p><strong>概要：</strong>{procedure.description || "説明なし"}</p>

      {procedure.checklist && (
        <>
          <h3>チェックリスト</h3>
          <ul>
            {procedure.checklist.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </>
      )}

      {procedure.referenceUrl && (
        <p>
          📄 <a href={procedure.referenceUrl} target="_blank" rel="noopener noreferrer">
            関連資料を開く
          </a>
        </p>
      )}
    </div>
  );
}

export default ProcedureDetail;
