import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  // STEP 1 — SEND 6-DIGIT OTP
  const sendOTP = async (e: any) => {
    e.preventDefault();
    setError("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,

        // 🔥 FORCE 6-DIGIT OTP MODE (BYPASS MAGIC LINK)
        channel: "email",
        data: { type: "otp" },

        // 🔥 Prevent magic link behavior
        emailRedirectTo: null,
      },
    });

    if (error) {
      setError(error.message);
      return;
    }

    setOtpSent(true);
  };

  // STEP 2 — VERIFY OTP
  const verifyOTP = async (e: any) => {
    e.preventDefault();
    setError("");

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email", // required for email OTP
    });

    if (error) {
      setError(error.message);
      return;
    }

    // SUCCESS → redirect to dashboard
    window.location.href = "/dashboard";
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded">
      <h1 className="text-2xl font-bold mb-4">
        Login with Email OTP
      </h1>

      {error && <p className="text-red-600">{error}</p>}

      {!otpSent ? (
        // ENTER EMAIL
        <form onSubmit={sendOTP} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Enter your email"
            className="border px-3 py-2 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button
            type="submit"
            className="bg-black text-white py-2 rounded hover:opacity-80"
          >
            Send OTP
          </button>
        </form>
      ) : (
        // ENTER OTP SCREEN
        <form onSubmit={verifyOTP} className="flex flex-col gap-4 mt-4">
          <p className="text-sm text-gray-500">
            OTP sent to <b>{email}</b>
          </p>

          <input
            type="text"
            maxLength={6}
            placeholder="Enter 6-digit OTP"
            className="border px-3 py-2 rounded"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />

          <button
            type="submit"
            className="bg-green-600 text-white py-2 rounded hover:opacity-80"
          >
            Verify OTP
          </button>
        </form>
      )}
    </div>
  );
}
