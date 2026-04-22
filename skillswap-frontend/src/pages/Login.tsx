import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import FullPageLoader from "../components/FullPageLoader";

export default function Login() {
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(true);

  const [showTermsModal, setShowTermsModal] = useState(true);
  const [allowedToLogin, setAllowedToLogin] = useState(false);

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

  const handleProceedToLogin = () => {
    setShowTermsModal(false);
    setAllowedToLogin(true);
  };

  const handleExit = () => {
    setShowTermsModal(false);
    setAllowedToLogin(false);
    setError("You must accept the platform terms before continuing.");
  };

  const sendOTP = async (e: any) => {
    e.preventDefault();
    setError("");

    if (!allowedToLogin) {
      setError("Please read and accept the platform terms first.");
      setShowTermsModal(true);
      return;
    }

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

    if (!allowedToLogin) {
      setError("Please read and accept the platform terms first.");
      setShowTermsModal(true);
      return;
    }

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
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-5 relative">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-white">SkillSwap</h1>
          <p className="text-sm text-gray-400 mt-1">Learn. Share. Grow.</p>
        </div>

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
            <p className="text-red-400 text-sm mb-3 text-center">{error}</p>
          )}

          {!otpSent ? (
            <form onSubmit={sendOTP} className="space-y-4">
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
                disabled={!allowedToLogin}
              />

              <label className="flex items-start gap-3 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 accent-[#00e6c3]"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  disabled={!allowedToLogin}
                />
                <span>
                  I agree to the Terms, Privacy Policy, responsible skill-sharing rules,
                  and allow my profile and barter-related activity to be visible and processed in the application.
                </span>
              </label>

              <button
                type="submit"
                disabled={!agree || !allowedToLogin}
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

              <label className="flex items-start gap-3 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 accent-[#00e6c3]"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                />
                <span>
                  I confirm that I have read and accepted the platform terms and conditions.
                </span>
              </label>

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

      <AnimatePresence>
        {showTermsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              className="
                w-full max-w-lg
                rounded-3xl
                bg-[#0c1317]
                border border-[#1a2a2e]
                shadow-2xl shadow-black/50
                overflow-hidden
              "
            >
              <div className="p-6 border-b border-[#1a2a2e]">
                <h2 className="text-xl font-semibold text-white">
                  Terms & Conditions
                </h2>
                <p className="text-sm text-gray-400 mt-2">
                  Please read and accept these conditions before using SkillSwap.
                </p>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4 text-sm text-gray-300">
                <div>
                  <p className="text-white font-medium mb-1">1. Genuine skill sharing</p>
                  <p>
                    You agree to use this barter platform only for genuine learning,
                    teaching, mentoring, collaboration, and lawful exchange of skills.
                  </p>
                </div>

                <div>
                  <p className="text-white font-medium mb-1">2. No illegal activity</p>
                  <p>
                    Any illegal, abusive, fraudulent, exploitative, harmful, misleading,
                    or unsafe activity is strictly prohibited. Such actions may be
                    complained against, reported, blocked, and removed from the platform.
                  </p>
                </div>

                <div>
                  <p className="text-white font-medium mb-1">3. Responsible communication</p>
                  <p>
                    You agree to communicate respectfully and not share threatening,
                    offensive, harassing, hateful, or inappropriate material.
                  </p>
                </div>

                <div>
                  <p className="text-white font-medium mb-1">4. Data usage consent</p>
                  <p>
                    You agree that your basic profile information, shared skills,
                    reviews, ratings, barter requests, chat activity, and relevant
                    usage data may be stored and processed by the application to run
                    platform features properly.
                  </p>
                </div>

                <div>
                  <p className="text-white font-medium mb-1">5. Shared links and files</p>
                  <p>
                    You are responsible for any links, files, notes, work submissions,
                    or materials you share. Do not upload or send harmful, illegal,
                    copyrighted, or malicious content.
                  </p>
                </div>

                <div>
                  <p className="text-white font-medium mb-1">6. Ratings and reviews</p>
                  <p>
                    Ratings and reviews should be fair, truthful, and based on real
                    interaction. Fake, abusive, or manipulative reviews are not allowed.
                  </p>
                </div>

                <div>
                  <p className="text-white font-medium mb-1">7. Platform visibility</p>
                  <p>
                    Your profile may be visible to other users for skill discovery,
                    barter matching, recommendations, chats, and collaboration requests.
                  </p>
                </div>

                <div>
                  <p className="text-white font-medium mb-1">8. Suspension and reporting</p>
                  <p>
                    The application may restrict, suspend, or remove access if misuse,
                    policy violation, suspicious behavior, impersonation, or harmful
                    conduct is identified.
                  </p>
                </div>

                <div>
                  <p className="text-white font-medium mb-1">9. Personal responsibility</p>
                  <p>
                    You are personally responsible for the authenticity of the
                    information you provide and for your interactions with other users.
                  </p>
                </div>

                <div>
                  <p className="text-white font-medium mb-1">10. Proceeding means consent</p>
                  <p>
                    By clicking Proceed, you confirm that you understand and accept
                    these terms and wish to continue to login.
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-[#1a2a2e] flex gap-3">
                <button
                  onClick={handleExit}
                  className="
                    flex-1 py-3 rounded-xl
                    border border-[#1a2a2e]
                    text-gray-300
                    bg-[#0b0f10]
                    hover:bg-[#131b1f]
                    transition
                  "
                >
                  Exit
                </button>

                <button
                  onClick={handleProceedToLogin}
                  className="
                    flex-1 py-3 rounded-xl
                    bg-[#00e6c3]
                    text-black font-medium
                    hover:opacity-90
                    transition
                  "
                >
                  Proceed
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}