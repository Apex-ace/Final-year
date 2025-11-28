// src/App.tsx
import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import Work from "./pages/Work";
import BottomNav from "./components/BottomNav";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProfileEdit from "./pages/ProfileEdit";
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

  // No bottom nav on login & video call screens
  const hideBottomNav = ["/", "/video-call"].includes(location.pathname);

  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />

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
          path="/profile/edit"
          element={
            <ProtectedRoute>
              <ProfileEdit />
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

        {/* Public profile (can be opened even if not logged in) */}
        <Route path="/profile/:id" element={<PublicProfile />} />

        {/* Chat still works, just not in bottom nav */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />

        <Route
          path="/video-call"
          element={
            <ProtectedRoute>
              <VideoCall />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>

      {!hideBottomNav && <BottomNav />}
    </>
  );
}
