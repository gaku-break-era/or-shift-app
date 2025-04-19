import React from "react";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

function LoginPage() {
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    const auth = getAuth();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("ログインエラー:", error);
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      justifyContent: "center",
      alignItems: "center",
      fontFamily: "sans-serif",
      padding: "2rem",
      backgroundColor: "#f4f7fa"
    }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>ScrubEdge</h1>
      <p style={{ fontSize: "1rem", color: "#555", marginBottom: "2rem" }}>
        ORナースのための次世代スマート管理プラットフォーム
      </p>

      <button onClick={handleLogin} style={{
        padding: "0.75rem 1.5rem",
        backgroundColor: "#4285F4",
        color: "white",
        border: "none",
        borderRadius: "4px",
        fontSize: "1rem",
        cursor: "pointer",
        marginBottom: "3rem"
      }}>
        Googleでログイン
      </button>

      <div style={{ fontSize: "0.85rem", color: "#888" }}>
        <a href="/terms" style={{ marginRight: "1rem", textDecoration: "underline" }}>利用規約</a>
        <a href="/privacy" style={{ marginRight: "1rem", textDecoration: "underline" }}>プライバシーポリシー</a>
        <a href="/contact" style={{ textDecoration: "underline" }}>お問い合わせ</a>
      </div>
    </div>
  );
}

export default LoginPage;
