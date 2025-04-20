// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./LoginPage";
import MobileShiftForm from "./MobileShiftForm";
import Admin from "./Admin";
import AdminEvents from "./AdminEvents";
import AdminEventList from "./AdminEventList";
import StaffHome from "./StaffHome";
import WeeklyAssignments from "./WeeklyAssignments";
import ProcedureList from "./ProcedureList";
import ProcedureDetail from "./ProcedureDetail";
import SettingsPage from "./Settings"; // ✅ 実際に存在するファイル名に合わせる
import Settings from "./Settings";

// import AutoAssignmentScreen from "./AutoAssignmentScreen";
// import DailyAssignmentScreen from "./DailyAssignmentScreen";

function App() {
  return (
    <Router>
      <Routes>
        {/* ✅ 初期表示はログインページ */}
        <Route path="/login" element={<LoginPage />} />

        {/* ✅ ログイン後の各種機能 */}
        <Route path="/form" element={<MobileShiftForm />} />
        <Route path="/mobile-form" element={<MobileShiftForm />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin-events" element={<AdminEvents />} />
        <Route path="/admin-events-list" element={<AdminEventList />} />
        <Route path="/home" element={<StaffHome />} />
        <Route path="/assignments" element={<WeeklyAssignments />} />
        <Route path="/procedures" element={<ProcedureList />} />
        <Route path="/procedures/:id" element={<ProcedureDetail />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings" element={<Settings />} />



        {/* ✅ "/" アクセス時にもログインページに飛ばす */}
        <Route path="/" element={<LoginPage />} />
      </Routes>
    </Router>
  );
}

export default App;
