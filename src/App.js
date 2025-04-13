// src/App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { db } from "./firebase";
import { collection, setDoc, doc, Timestamp } from "firebase/firestore";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth";
import Admin from "./Admin";
import AdminEvents from "./AdminEvents";
import AdminEventList from "./AdminEventList";
import StaffHome from "./StaffHome";
import WeeklyAssignments from "./WeeklyAssignments";
import ProcedureList from "./ProcedureList"; 
import ProcedureDetail from "./ProcedureDetail";
import AutoAssignmentScreen from './pages/AutoAssignmentScreen';
import MainForm from "./MainForm";
import DailyAssignmentScreen from "./pages/DailyAssignmentScreen";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainForm />} />
        <Route path="/admin" element={<Admin />} />
        // ルートに追加
        <Route path="/admin-events" element={<AdminEvents />} />
        <Route path="/admin-events-list" element={<AdminEventList />} />
        <Route path="/home" element={<StaffHome />} />
        <Route path="/assignments" element={<WeeklyAssignments />} />
        <Route path="/procedures" element={<ProcedureList />} />
        <Route path="/procedures/:id" element={<ProcedureDetail />} />
        <Route path="/auto-assignment" element={<AutoAssignmentScreen />} />
         <Route path="/daily-assignment" element={<DailyAssignmentScreen />} />
      </Routes>
    </Router>
  );
}

export default App;
