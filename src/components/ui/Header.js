import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Header.css";

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    // 仮のログアウト処理 → 後でauthからsignOutに変更
    alert("ログアウトしました（仮）");
    navigate("/login");
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="header">
      <div className="logo" onClick={() => navigate("/home")}>ScrubEdge</div>

      {/* デスクトップ用メニュー */}
      <nav className="nav-links desktop-only">
        <Link to="/home">HOME</Link>
        <button onClick={handleLogout}>ログアウト</button>
      </nav>

      {/* モバイル用ハンバーガー */}
      <div className="hamburger mobile-only" onClick={toggleMenu}>
        ☰
      </div>

      {/* モバイルメニュー展開 */}
      {menuOpen && (
        <div className="mobile-menu">
          <Link to="/home" onClick={closeMenu}>HOME</Link>
          <button onClick={() => { handleLogout(); closeMenu(); }}>ログアウト</button>
        </div>
      )}
    </header>
  );
}

export default Header;
