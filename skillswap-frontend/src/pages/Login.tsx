// src/pages/Login.tsx
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";
import FullPageLoader from "../components/FullPageLoader";

export default function Login() {
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const [agree, setAgree] = useState(false); // NEW: Terms checkbox

  const [loading, setLoading] = useState(true);

  // Check user session on load
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        window.location.href = "/dashboard";
      } else {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const sendOTP = async (e: any) => {
    e.preventDefault();
    setError("");

    if (!agree) {
      setError("You must accept the Terms & Conditions to continue.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      setOtpSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (e: any) => {
    e.preventDefault();
    setError("");

    if (!agree) {
      setError("You must accept the Terms & Conditions to continue.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });
      if (error) throw error;

      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Loader display
  if (loading) return <FullPageLoader />;

  const card =
    "w-full max-w-sm bg-[#0b0f10]/80 backdrop-blur-xl border border-[#10191c] rounded-2xl p-6 shadow-xl";
  const inputBox =
    "w-full px-4 py-3 bg-[#0c1317] border border-[#1a2a2e] rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none";
  const tealBtn =
    "w-full py-3 rounded-xl bg-gradient-to-br from-[#00e6c3] to-[#009f82] text-black font-semibold disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 flex items-center justify-center px-5">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={card}>
        <h1 className="text-xl font-bold text-teal-300 mb-4 text-center">
          Login with Email OTP
        </h1>

        {error && <p className="text-red-400 text-sm mb-3 text-center">{error}</p>}

        {/* BEFORE OTP SENT */}
        {!otpSent ? (
          <form onSubmit={sendOTP} className="space-y-4">
            <input
              type="email"
              placeholder="Enter your email"
              className={inputBox}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {/* Terms & Conditions Box */}
            <div className="bg-[#0b0f10] border border-[#1a2a2e] p-4 rounded-xl text-sm leading-relaxed">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 w-5 h-5 accent-teal-400"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                />

                <span className="text-gray-300">
                  By continuing, I confirm that:
                  <br />
                  • My profile & skills will be visible to others.
                  <br />
                  • Users may contact me and chat with me.
                  <br />
                  • I agree to the{" "}
                  <span className="text-teal-300 underline">Terms & Conditions</span> and{" "}
                  <span className="text-teal-300 underline">Privacy Policy</span>.
                </span>
              </label>
            </div>

            <button type="submit" disabled={!agree} className={tealBtn}>
              Send OTP
            </button>
          </form>
        ) : (
          /* AFTER OTP SENT */
          <form onSubmit={verifyOTP} className="space-y-4 mt-2">
            <p className="text-sm text-gray-400 text-center">
              OTP sent to <span className="text-teal-300">{email}</span>
            </p>

            <input
              type="text"
              maxLength={6}
              placeholder="Enter 6-digit OTP"
              className={inputBox}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />

            {/* Terms Still Required */}
            <div className="bg-[#0b0f10] border border-[#1a2a2e] p-4 rounded-xl text-sm leading-relaxed">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 w-5 h-5 accent-teal-400"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                />

                <span className="text-gray-300">
                  I agree to the Terms & Conditions and understand my profile will be visible to others.
                </span>
              </label>
            </div>

            <button type="submit" disabled={!agree} className={tealBtn}>
              Verify OTP
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
