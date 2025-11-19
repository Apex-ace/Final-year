import { Routes, Route, useLocation } from "react-router-dom";

import BottomNav from "./components/BottomNav";   // <-- Correct import

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProfileEdit from "./pages/ProfileEdit";
import Browse from "./pages/Browse";
import PublicProfile from "./pages/PublicProfile";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/LandingPage";

export default function App() {
  const location = useLocation();

  // hide bottom nav on Login page only
  const hideBottomNav = location.pathname === "/";

  return (
    <>
      {/* Main Page Routes */}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile/edit" element={<ProfileEdit />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/profile/:id" element={<PublicProfile />} />

        {/* Chat */}
        <Route path="/chat" element={<Chat />} />

        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Bottom Navigation */}
      {!hideBottomNav && <BottomNav />}  {/* <--- FIX: render AFTER Routes */}
    </>
  );
}
