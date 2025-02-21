"use client";

import { useEffect, useState } from "react";
import UUIDForm from "../components/UUIDForm";
import { account } from "../../../lib/appwrite";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function UUIDPage() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function checkUser() {
      try {
        console.log("🔍 Checking active session...");
        const session = await account.getSession("current");
  
        if (!session) {
          console.warn("⚠ No active session found. Redirecting...");
          router.push("/login"); // Redirect user if no session
          return;
        }
  
        // ✅ If session exists, fetch user data
        const userData = await account.get();
        console.log("✅ User Data:", userData);
        setUser(userData);
      } catch (error) {
        console.error("🚨 Error fetching user data:", error);
        toast.error("❌ Failed to fetch user data. Please log in again.");
        router.push("/login");
      }
    }
  
    checkUser();
  }, [router]);  

  return user ? <UUIDForm user={user} /> : null;
}