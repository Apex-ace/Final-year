import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProfileEdit from "./pages/ProfileEdit";
import Browse from "./pages/Browse";
import PublicProfile from "./pages/PublicProfile";
import Chat from "./pages/Chat"; // <--- IMPORT THIS
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile/edit" element={<ProfileEdit />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/profile/:id" element={<PublicProfile />} />
        
        {/* Add Chat Route */}
        <Route path="/chat" element={<Chat />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}