import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";
import FullPageLoader from "../components/FullPageLoader";

export default function Login() {
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) window.location.href = "/dashboard";
      else setLoading(false);
    };

    checkSession();
  }, []);

  const sendOTP = async (e: any) => {
    e.preventDefault();
    setError("");

    if (!agree) {
      setError("You must accept Terms & Conditions");
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
      setError("You must accept Terms & Conditions");
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

  if (loading) return <FullPageLoader />;

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-5">

      {/* 🔥 MAIN CONTAINER */}
      <div className="w-full max-w-sm space-y-6">

        {/* 🔥 APP TITLE */}
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-white">
            SkillSwap
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Learn. Share. Grow.
          </p>
        </div>

        {/* 🔥 GLASS CARD */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="
            p-6 rounded-2xl
            bg-[#0c1317]/80
            backdrop-blur-xl
            border border-[#1a2a2e]
            shadow-xl shadow-black/40
          "
        >

          {error && (
            <p className="text-red-400 text-sm mb-3 text-center">
              {error}
            </p>
          )}

          {!otpSent ? (
            <form onSubmit={sendOTP} className="space-y-4">

              {/* Email */}
              <input
                type="email"
                placeholder="Enter your email"
                className="
                  w-full px-4 py-3
                  rounded-xl
                  bg-[#0c1317]
                  border border-[#1a2a2e]
                  text-white
                  outline-none
                  focus:border-[#00e6c3]
                "
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              {/* Terms */}
              <label className="flex items-start gap-3 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 accent-[#00e6c3]"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                />
                <span>
                  I agree to Terms & Privacy Policy and allow my profile to be visible.
                </span>
              </label>

              {/* Button */}
              <button
                type="submit"
                disabled={!agree}
                className="
                  w-full py-3 rounded-xl
                  bg-[#00e6c3]
                  text-black font-medium
                  disabled:opacity-40
                "
              >
                Send OTP
              </button>

            </form>
          ) : (
            <form onSubmit={verifyOTP} className="space-y-4">

              <p className="text-sm text-gray-400 text-center">
                OTP sent to <span className="text-[#00e6c3]">{email}</span>
              </p>

              {/* OTP */}
              <input
                type="text"
                maxLength={6}
                placeholder="Enter OTP"
                className="
                  w-full px-4 py-3
                  rounded-xl
                  bg-[#0c1317]
                  border border-[#1a2a2e]
                  text-white text-center tracking-widest
                  outline-none
                "
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />

              {/* Terms */}
              <label className="flex items-start gap-3 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 accent-[#00e6c3]"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                />
                <span>I agree to Terms & Conditions</span>
              </label>

              {/* Button */}
              <button
                type="submit"
                disabled={!agree}
                className="
                  w-full py-3 rounded-xl
                  bg-[#00e6c3]
                  text-black font-medium
                  disabled:opacity-40
                "
              >
                Verify OTP
              </button>

            </form>
          )}
        </motion.div>

      </div>
    </div>
  );
}