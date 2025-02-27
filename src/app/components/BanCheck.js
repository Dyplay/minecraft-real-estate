"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db, Query } from "../../../lib/appwrite";

export default function BanCheck({ children }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isBanned, setIsBanned] = useState(false);

  useEffect(() => {
    async function checkBanStatus() {
      try {
        // Get current user's IP
        const ipResponse = await fetch("https://api64.ipify.org?format=json");
        const ipData = await ipResponse.json();
        const userIP = ipData.ip;
        
        // Find user by IP
        const userResponse = await db.listDocuments(
          "67a8e81100361d527692",
          "67a900dc003e3b7524ee",
          [Query.equal("ip", userIP)]
        );

        if (userResponse.documents.length === 0) {
          // No user found with this IP, allow access
          setLoading(false);
          return;
        }

        const userData = userResponse.documents[0];
        
        // Check if user is banned
        const banResponse = await db.listDocuments(
          "67a8e81100361d527692",
          "67c0eec80022ef6cb8b7",
          [Query.equal("UUID", userData.uuid)]
        );

        if (banResponse.documents.length > 0) {
          // User is banned
          setIsBanned(true);
          const banReason = banResponse.documents[0].BanReason;
          
          // Redirect to banned page with reason
          router.push(`/banned?reason=${encodeURIComponent(banReason)}`);
        }
      } catch (error) {
        console.error("Error checking ban status:", error);
      } finally {
        setLoading(false);
      }
    }

    checkBanStatus();
  }, [router]);

  if (loading) {
    return <div className="min-h-screen flex justify-center items-center">Loading...</div>;
  }

  if (isBanned) {
    return null; // Don't render children if banned (will redirect)
  }

  return <>{children}</>;
} 