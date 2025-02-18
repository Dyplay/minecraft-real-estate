"use client";

import { useState, useEffect } from "react";
import { Ring } from "@uiball/loaders";
import { db, subscribeToRealtime, Query } from "../../../lib/appwrite";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

export default function UUIDForm({ user }) {
  const [uuid, setUUID] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [userIP, setUserIP] = useState(null);
  const router = useRouter();

  // Fetch user's IP address
  useEffect(() => {
    const fetchIP = async () => {
      try {
        const res = await fetch("https://api64.ipify.org?format=json");
        const data = await res.json();
        setUserIP(data.ip);
      } catch (error) {
        console.error("Failed to fetch IP address", error);
      }
    };
    fetchIP();
  }, []);

  // Subscribe to Appwrite Realtime for approval status
  useEffect(() => {
    if (!userIP || !uuid) return;

    console.log("Subscribing to real-time updates...");

    const unsubscribe = subscribeToRealtime(
      `databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID}.collections.${process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID}.documents`,
      (response) => {
        console.log("Realtime update received:", response);

        if (response.payload.uuid === uuid.replace(/-/g, "") && response.payload.approved) {
          setIsApproved(true);
          setIsLoading(false);
          toast.success("✅ Approved!");

          // ✅ Save session & redirect to dashboard
          document.cookie = `session=${JSON.stringify({ ...user, approved: true })}; path=/`;
          setTimeout(() => router.push("/dashboard"), 2000); // ✅ Redirect after 2s
        }
      }
    );

    return () => {
      console.log("Unsubscribing from real-time updates...");
      unsubscribe();
    };
  }, [uuid, user, router, userIP]);

  // Fetch UUID status on refresh
  useEffect(() => {
    if (!userIP) return;

    const checkPreviousSubmission = async () => {
      try {
        const response = await db.listDocuments(
            "67a8e81100361d527692",
            "67a900dc003e3b7524ee",
          [Query.equal("ip", userIP)]
        );

        if (response.documents.length > 0) {
          const existingUser = response.documents[0];
          setUUID(existingUser.uuid);
          setIsLoading(!existingUser.approved);
          setIsApproved(existingUser.approved);

          // ✅ Redirect instantly if already approved
          if (existingUser.approved) {
            setTimeout(() => router.push("/dashboard"), 2000);
          }
        }
      } catch (error) {
        console.error("Error fetching existing document", error);
      }
    };

    checkPreviousSubmission();
  }, [userIP]);

  const handleSubmit = async () => {
    if (!uuid) return toast.error("Please enter your UUID!");
    if (!userIP) return toast.error("IP address not detected. Please try again.");

    setIsLoading(true);
    const cleanedUUID = uuid.replace(/-/g, ""); // Ensure UUID is cleaned

    try {
      // Fetch Minecraft Username from Next.js API route
      const mojangResponse = await fetch(`https://rigabank.dyplay.at/api/uuid?uuid=${cleanedUUID}`);

      if (!mojangResponse.ok) {
        const errorData = await mojangResponse.json();
        throw new Error(errorData.error || "Invalid UUID or API error.");
      }

      const mojangData = await mojangResponse.json();
      const minecraftUsername = mojangData.name;

      if (!minecraftUsername) {
        throw new Error("Username not found for this UUID.");
      }

      // Step 2: Store data in Appwrite
      const document = await db.createDocument(
        "67a8e81100361d527692",
        "67a900dc003e3b7524ee",
        "unique()",
        {
          discordUser: user.name || "Unknown",
          uuid: cleanedUUID,
          username: minecraftUsername,
          approved: false,
          ip: userIP,
        }
      );

      if (!document) throw new Error("Failed to save data to Appwrite.");

      // Step 3: Send Webhook Notification
      await fetch(process.env.NEXT_PUBLIC_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `🔔 New approval request!\n**Discord User:** ${user.name}\n**Minecraft Username:** ${minecraftUsername}\n**UUID:** ${cleanedUUID}\n🔗 Check the admin panel to approve.`,
        }),
      });

      toast.info("Waiting for admin approval...");
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Error saving UUID!");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-800 bg-opacity-50 text-black">
      <div className="bg-white p-6 rounded shadow-lg w-80">
        {!isLoading && !isApproved ? (
          <>
            <h2 className="text-lg font-bold">Enter UUID</h2>
            <input
              type="text"
              value={uuid}
              onChange={(e) => setUUID(e.target.value)}
              className="w-full p-2 border rounded mt-2"
              placeholder="Minecraft UUID"
            />
            <button onClick={handleSubmit} className="mt-4 w-full bg-blue-500 text-white p-2 rounded">
              Submit
            </button>
          </>
        ) : isLoading ? (
          <div className="flex flex-col items-center">
            <Ring size={40} color="#4A90E2" />
            <p>Waiting for approval...</p>
          </div>
        ) : (
          <div className="text-green-500 text-center">
            ✅ Approved! Redirecting...
          </div>
        )}
      </div>
    </div>
  );
}