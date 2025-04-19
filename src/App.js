// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./LoginPage";
import MainForm from "./MainForm";
import Admin from "./Admin";
import AdminEvents from "./AdminEvents";
import AdminEventList from "./AdminEventList";
import StaffHome from "./StaffHome";
import WeeklyAssignments from "./WeeklyAssignments";
import ProcedureList from "./ProcedureList";
import ProcedureDetail from "./ProcedureDetail";
import AutoAssignmentScreen from "./AutoAssignmentScreen";
import DailyAssignmentScreen from "./DailyAssignmentScreen";

function App() {
  return (
    <Router>
      <Routes>
        {/* ✅ 初期表示はログインページ */}
        <Route path="/login" element={<LoginPage />} />

        {/* ✅ ログイン後の各種機能 */}
        <Route path="/form" element={<MainForm />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin-events" element={<AdminEvents />} />
        <Route path="/admin-events-list" element={<AdminEventList />} />
        <Route path="/home" element={<StaffHome />} />
        <Route path="/assignments" element={<WeeklyAssignments />} />
        <Route path="/procedures" element={<ProcedureList />} />
        <Route path="/procedures/:id" element={<ProcedureDetail />} />
        <Route path="/auto-assignment" element={<AutoAssignmentScreen />} />
        <Route path="/daily-assignment" element={<DailyAssignmentScreen />} />

        {/* ✅ "/" アクセス時にもログインページに飛ばす */}
        <Route path="/" element={<LoginPage />} />
      </Routes>
    </Router>
  );
}

export default App;
