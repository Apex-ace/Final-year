import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Navigate } from "react-router-dom";
import FullPageLoader from "./FullPageLoader"; // ✅ use your new loader

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setLoading(false);
    };

    load();
  }, []);
  if (loading) return <FullPageLoader />;
  if (!session) return <Navigate to="/login" replace />;

  return children;
}