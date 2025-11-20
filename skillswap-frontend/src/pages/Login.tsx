// src/pages/Login.tsx
import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";
import MobileShell from "../components/MobileShell";

export default function Login() {
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const sendOTP = async (e: any) => {
    e.preventDefault();
    setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) return setError(error.message);
    setOtpSent(true);
  };

  const verifyOTP = async (e: any) => {
    e.preventDefault();
    setError("");
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: "email" });
    if (error) return setError(error.message);
    window.location.href = "/dashboard";
  };

  const card = "w-full max-w-sm bg-[#0b0f10]/80 backdrop-blur-xl border border-[#10191c] rounded-2xl p-6 shadow-xl";
  const inputBox = "w-full px-4 py-3 bg-[#0c1317] border border-[#1a2a2e] rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none";
  const tealBtn = "w-full py-3 rounded-xl bg-gradient-to-br from-[#00e6c3] to-[#009f82] text-black font-semibold";

  // We use MobileShell but hide back (login is entry)
  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 flex items-center justify-center px-5">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={card}>
        <h1 className="text-xl font-bold text-teal-300 mb-4 text-center">Login with Email OTP</h1>
        {error && <p className="text-red-400 text-sm mb-3 text-center">{error}</p>}

        {!otpSent ? (
          <form onSubmit={sendOTP} className="space-y-4">
            <input type="email" placeholder="Enter your email" className={inputBox} value={email} onChange={(e) => setEmail(e.target.value)} />
            <button type="submit" className={tealBtn}>Send OTP</button>
          </form>
        ) : (
          <form onSubmit={verifyOTP} className="space-y-4 mt-2">
            <p className="text-sm text-gray-400 text-center">OTP sent to <span className="text-teal-300">{email}</span></p>
            <input type="text" maxLength={6} placeholder="Enter 6-digit OTP" className={inputBox} value={otp} onChange={(e) => setOtp(e.target.value)} />
            <button type="submit" className={tealBtn}>Verify OTP</button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
