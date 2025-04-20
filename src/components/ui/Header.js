// src/components/ui/Header.js
import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Header.css";

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="header">
      <div className="logo">ScrubEdge</div>

      {/* PC/iPad表示 */}
      <nav className="nav-links desktop-only">
        <Link to="/home">HOME</Link>
        <Link to="/settings">設定</Link>
        <button onClick={() => alert("ログアウト処理（仮）")}>ログアウト</button>
      </nav>

      {/* スマホ用ハンバーガー */}
      <div className="hamburger mobile-only" onClick={toggleMenu}>
        ☰
      </div>

      {menuOpen && (
        <div className="mobile-menu">
          <Link to="/home" onClick={closeMenu}>HOME</Link>
          <Link to="/settings" onClick={closeMenu}>設定</Link>
          <button onClick={() => { alert("ログアウト処理（仮）"); closeMenu(); }}>
            ログアウト
          </button>
        </div>
      )}
    </header>
  );
}

export default Header;
