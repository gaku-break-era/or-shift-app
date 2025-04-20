import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Header.css";

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  const menuItems = [
    { path: "/home", label: "ホーム" },
    { path: "/form", label: "シフト提出" },
    { path: "/assignments", label: "今週の配置" },
    { path: "/procedures", label: "術式手順書" },
    { path: "/settings", label: "設定" },
    { path: "/admin", label: "管理者" },
    { path: "/admin-events", label: "イベント登録" },
    { path: "/admin-events-list", label: "イベント一覧" },
    { path: "/mobile-form", label: "モバイルフォーム" },
    { path: "/surgery-request", label: "手術申し込み" },
    { path: "/daily-assignment", label: "日次割り当て" },
  ];

  return (
    <header className="header">
      <div className="logo">ScrubEdge</div>

      {/* PC/iPad用メニュー */}
      <nav className="nav-links desktop-only">
        {menuItems.map((item) => (
          <Link key={item.path} to={item.path}>{item.label}</Link>
        ))}
        <button onClick={() => alert("ログアウト処理（仮）")}>ログアウト</button>
      </nav>

      {/* スマホ用ハンバーガー */}
      <div className="hamburger mobile-only" onClick={toggleMenu}>
        ☰
      </div>

      {menuOpen && (
        <div className="mobile-menu">
          {menuItems.map((item) => (
            <Link key={item.path} to={item.path} onClick={closeMenu}>{item.label}</Link>
          ))}
          <button onClick={() => { alert("ログアウト処理（仮）"); closeMenu(); }}>
            ログアウト
          </button>
        </div>
      )}
    </header>
  );
}

export default Header;
