import React, { useState, useEffect } from "react";

const modalStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999,
};

const cardStyle = {
  background: "#fff",
  padding: "2rem",
  borderRadius: "8px",
  width: "90%",
  maxWidth: "400px",
};

function EventModal({ onClose, onSave, onDelete, defaultData }) {
  const [title, setTitle] = useState("");
  const [surgeon, setSurgeon] = useState("");
  const [position, setPosition] = useState("");
  const [anesthesia, setAnesthesia] = useState("");

  useEffect(() => {
    if (defaultData) {
      setTitle(defaultData.title || "");
      setSurgeon(defaultData.surgeon || "");
      setPosition(defaultData.position || "");
      setAnesthesia(defaultData.anesthesia || "");
    }
  }, [defaultData]);

  const handleSave = () => {
    if (!title) {
      alert("術式名を入力してください");
      return;
    }
    onSave({ title, surgeon, position, anesthesia });
  };

  return (
    <div style={modalStyle} onClick={onClose}>
      <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginBottom: "1rem" }}>
          {defaultData ? "📝 手術情報の編集" : "📝 新規手術情報"}
        </h3>

        <input
          type="text"
          placeholder="術式名"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: "100%", marginBottom: "0.5rem", padding: "0.5rem" }}
        />
        <input
          type="text"
          placeholder="執刀医"
          value={surgeon}
          onChange={(e) => setSurgeon(e.target.value)}
          style={{ width: "100%", marginBottom: "0.5rem", padding: "0.5rem" }}
        />
        <input
          type="text"
          placeholder="体位"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          style={{ width: "100%", marginBottom: "0.5rem", padding: "0.5rem" }}
        />
        <input
          type="text"
          placeholder="麻酔方法"
          value={anesthesia}
          onChange={(e) => setAnesthesia(e.target.value)}
          style={{ width: "100%", marginBottom: "0.5rem", padding: "0.5rem" }}
        />

        

        <div style={{ textAlign: "right", marginTop: "1rem" }}>
          {onDelete && (
            <button onClick={onDelete} style={{ marginRight: "0.5rem", background: "#f66", color: "#fff", padding: "0.5rem 1rem", border: "none" }}>
              削除
            </button>
          )}
          <button onClick={handleSave} style={{ marginRight: "1rem" }}>保存</button>
          <button onClick={onClose}>キャンセル</button>
        </div>
      </div>
    </div>
  );
}

export default EventModal;
