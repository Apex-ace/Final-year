// src/App.tsx
import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import Work from "./pages/Work";
import BottomNav from "./components/BottomNav";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProfileEdit from "./pages/ProfileEdit";
import MyProfile from "./pages/MyProfile"; // ✅ NEW
import Browse from "./pages/Browse";
import PublicProfile from "./pages/PublicProfile";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/LandingPage";
import VideoCall from "./pages/VideoCall";

import ProtectedRoute from "./components/ProtectedRoute";
import useBackGesture from "./hooks/useBackGesture";

export default function App() {
  useBackGesture(true);
  const location = useLocation();

  // Hide bottom nav on specific screens
  const hideBottomNav = ["/", "/video-call"].includes(location.pathname);

  return (
    <>
      <Routes>

        {/* 🔓 PUBLIC ROUTES */}
        <Route path="/" element={<Login />} />

        {/* 🔐 PROTECTED ROUTES */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <LandingPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/work"
          element={
            <ProtectedRoute>
              <Work />
            </ProtectedRoute>
          }
        />

        <Route
          path="/browse"
          element={
            <ProtectedRoute>
              <Browse />
            </ProtectedRoute>
          }
        />

        {/* 🔥 MY PROFILE (NEW FIX) */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <MyProfile />
            </ProtectedRoute>
          }
        />

        {/* ✏️ EDIT PROFILE */}
        <Route
          path="/profile/edit"
          element={
            <ProtectedRoute>
              <ProfileEdit />
            </ProtectedRoute>
          }
        />

        {/* 🌍 PUBLIC PROFILE */}
        <Route path="/profile/:id" element={<PublicProfile />} />

        {/* 💬 CHAT */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />

        {/* 📞 VIDEO CALL */}
        <Route
          path="/video-call"
          element={
            <ProtectedRoute>
              <VideoCall />
            </ProtectedRoute>
          }
        />

        {/* ❌ 404 */}
        <Route path="*" element={<NotFound />} />

      </Routes>

      {/* 🔥 BOTTOM NAV */}
      {!hideBottomNav && <BottomNav />}
    </>
  );
}