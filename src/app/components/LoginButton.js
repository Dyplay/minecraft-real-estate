"use client";

import { useEffect, useState } from "react";
import { account, getUserSession } from "../../../lib/appwrite";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const session = await getUserSession();
      if (session) {
        console.log("✅ User already logged in, redirecting...");
        router.push("/uuid"); // ✅ Redirect if session exists
        return;
      }
      setLoading(false); // Allow login if no session found
    };

    checkSession();
  }, [router]);

  const handleLogin = async () => {
    try {
      await account.createOAuth2Session(
        "discord",
        `${window.location.origin}/uuid`, // ✅ Redirect to UUID after successful login
        `${window.location.origin}/login` // Redirect back on failure
      );
    } catch (error) {
      console.error("❌ OAuth Login Failed:", error);
      toast.error("⚠ Login failed, please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-blue-600">
        <p>⏳ Checking for existing session...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-4 text-black">Login to your real estate account</h1>
      <button
        onClick={handleLogin}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-500 transition"
      >
        Login with Discord
      </button>
    </div>
  );
}