"use client";

import { useEffect, useState } from "react";
import { account, getUserSession } from "../../../lib/appwrite";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { FaDiscord } from "react-icons/fa";

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const session = await getUserSession();
      if (session) {
        console.log("✅ User already logged in, redirecting...");
        router.push("/uuid");
        return;
      }
      setLoading(false);
    };

    checkSession();
  }, [router]);

  const handleLogin = async () => {
    try {
      await account.createOAuth2Session(
        "discord",
        `${window.location.origin}/uuid`,
        `${window.location.origin}/login`
      );
    } catch (error) {
      console.error("❌ OAuth Login Failed:", error);
      toast.error("Login failed. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 text-orange-500">
        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p>Checking session...</p>
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white px-6 py-4 rounded-xl shadow-lg 
                 flex items-center justify-center gap-3 transition-all duration-200 transform hover:scale-[1.02]
                 border border-[#5865F2]/20 font-medium text-lg"
    >
      <FaDiscord className="text-2xl" />
      Continue with Discord
    </button>
  );
}