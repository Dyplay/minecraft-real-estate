"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db, account, Query } from "../../../lib/appwrite"; // ✅ Import properly
import { motion } from "framer-motion";
import { FaPlusCircle, FaSpinner } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false); // ✅ Prevents infinite redirect loop
  const router = useRouter();

  useEffect(() => {
    async function fetchUserData() {
      try {
        console.log("🔄 Fetching Appwrite session...");

        // ✅ Step 1: Get the current session
        const session = await account.get();
        console.log("🟢 Session Data:", session);

        if (!session) {
          console.warn("⚠ No session found. Redirecting to login...");
          return;
        }

        // ✅ Step 2: Fetch user data from database using IP
        const ipResponse = await fetch("https://api64.ipify.org?format=json");
        const ipData = await ipResponse.json();
        const userIP = ipData.ip;
        console.log("🌐 User IP:", userIP);

        // ✅ Step 3: Find user by IP in the database
        const userResponse = await db.listDocuments("67a8e81100361d527692", "67a900dc003e3b7524ee", [
          Query.equal("ip", userIP),
        ]);

        console.log("🟡 Raw User Response:", userResponse);

        if (userResponse.documents.length === 0) {
          console.warn("⚠ No user found with matching IP. Redirecting...");
          return;
        }

        // ✅ Step 4: Store user data
        const userData = userResponse.documents[0];
        console.log("✅ Final User Data:", userData);

        setUser({
          ...userData,
          avatar: `https://crafthead.net/avatar/${userData.uuid}`,
        });

        // ✅ Step 5: Fetch user's listings
        console.log("🔍 Fetching user's listings for UUID:", userData.uuid);
        const listingsResponse = await db.listDocuments("67a8e81100361d527692", "67b2fdc20027f4d55440", [
          Query.equal("sellerUUID", userData.uuid),
        ]);

        console.log("🟢 Listings Data:", listingsResponse);
        setListings(listingsResponse.documents);
      } catch (error) {
        console.error("🚨 Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, []);

  // ✅ Prevents infinite redirect loop
  useEffect(() => {
    if (redirecting) {
      router.push("/login");
    }
  }, [redirecting, router]);

  if (loading) {
    return <p className="text-center text-white">🔄 Loading session...</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex flex-col items-center p-6">
      <h2 className="text-4xl font-bold mb-8">Dashboard</h2>

      <h3 className="text-2xl">Welcome, {user.username}!</h3>

      {/* 🔹 User Avatar */}
      <Image src={user.avatar} width={100} height={100} className="rounded-full mt-4" alt="User Avatar" />

      {/* 🔹 Listings */}
      <h2 className="text-3xl font-bold mt-12">Your Active Listings</h2>
      <div className="w-full max-w-5xl mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.length > 0 ? (
          listings.map((listing) => (
            <motion.div key={listing.$id} whileHover={{ scale: 1.02 }} className="rounded-lg overflow-hidden shadow-lg bg-gray-800 text-white">
              <Link href={`/listing/${listing.$id}`}>
                <div>
                  <Image src={listing.images[0] || "/example.jpg"} width={400} height={300} alt={listing.title} className="w-full h-60 object-cover" />
                  <div className="p-4">
                    <h3 className="text-lg font-semibold">{listing.title}</h3>
                    <p className="text-gray-400">{listing.description.substring(0, 50)}...</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))
        ) : (
          <p className="text-gray-400">You have no active listings.</p>
        )}
      </div>
    </div>
  );
}