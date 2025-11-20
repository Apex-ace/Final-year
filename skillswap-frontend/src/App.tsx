// src/App.tsx
import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import BottomNav from "./components/BottomNav";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProfileEdit from "./pages/ProfileEdit";
import Browse from "./pages/Browse";
import PublicProfile from "./pages/PublicProfile";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/LandingPage";

import useBackGesture from "./hooks/useBackGesture";

export default function App() {
  useBackGesture(true);
  const location = useLocation();
  const hideBottomNav = location.pathname === "/";

  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile/edit" element={<ProfileEdit />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/profile/:id" element={<PublicProfile />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      {!hideBottomNav && <BottomNav />}
    </>
  );
}
