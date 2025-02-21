"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { db, account, Query } from "../../../lib/appwrite";

export default function AdminPanel() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [bannedUsers, setBannedUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // ✅ List of allowed Admin UUIDs
  const allowedAdmins = [
    "119c2cd733a74c7da9611336e3188271", // Your UUID
  ];

  useEffect(() => {
    async function checkAdmin() {
      try {
        console.log("🔄 Fetching Appwrite session...");
        const session = await account.get();
        console.log("🟢 Session Data:", session);

        if (!session) {
          console.warn("⚠ No session found, redirecting...");
          router.push("/login");
          return;
        }

        // ✅ Fetch user IP (same as Navbar)
        let ipData;
        try {
          const ipResponse = await fetch("https://api64.ipify.org?format=json");
          ipData = await ipResponse.json();
        } catch (error) {
          console.error("🚨 Failed to fetch user IP:", error);
          router.push("/login");
          return;
        }

        const userIP = ipData.ip;
        console.log("🌐 Fetched User IP:", userIP);

        // ✅ Fetch user data by IP (same as Navbar)
        const userResponse = await db.listDocuments(
          "67a8e81100361d527692",
          "67a900dc003e3b7524ee",
          [Query.equal("ip", userIP)]
        );

        console.log("🟢 User Data Response:", userResponse);

        if (userResponse.documents.length === 0) {
          console.warn("⚠ No user found with matching IP, redirecting...");
          router.push("/login");
          return;
        }

        // ✅ Extract user data
        const userData = userResponse.documents[0];
        console.log("🟢 Found User Data:", userData);

        // ✅ Check if user is an admin
        if (allowedAdmins.includes(userData.uuid)) {
          setAuthor(userData.username);
          setIsAdmin(true);
          console.log("✅ User is an Admin! Access Granted.");
        } else {
          console.warn("❌ User is NOT an Admin! Redirecting...");
          router.push("/");
        }
      } catch (error) {
        console.error("🚨 Error during admin check:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }

    async function fetchUsers() {
      try {
        const response = await db.listDocuments(
          "67a8e81100361d527692", // Database ID
          "67a900dc003e3b7524ee"  // Users Collection ID
        );
  
        const allUsers = response.documents;
        const banned = allUsers.filter((user) => user.banned);
        const active = allUsers.filter((user) => !user.banned);
  
        setUsers(active);
        setBannedUsers(banned);
      } catch (error) {
        console.error("🚨 Error fetching users:", error);
      } finally {
        setIsLoadingUsers(false);
      }
    }
  
    fetchUsers();
    checkAdmin();
  }, []);

  async function toggleBan(user) {
    const newStatus = !user.banned;
  
    try {
      await db.updateDocument(
        "67a8e81100361d527692", // Database ID
        "67a900dc003e3b7524ee", // Users Collection ID
        user.$id,
        { banned: newStatus }
      );
  
      toast.success(`✅ User ${newStatus ? "banned" : "unbanned"} successfully!`);
  
      // Update local state
      setUsers((prev) => prev.filter((u) => u.$id !== user.$id));
      setBannedUsers((prev) => newStatus ? [...prev, user] : prev.filter((u) => u.$id !== user.$id));
    } catch (error) {
      console.error("🚨 Error updating user ban status:", error);
      toast.error("❌ Failed to update user ban status.");
    }
  }  

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, category, content, author }),
    });

    if (res.ok) {
      router.push("/help");
    }
  };

  // ✅ Show loading screen while checking authentication
  if (loading) {
    return <p className="text-center text-gray-500">Checking admin access...</p>;
  }

  // ✅ Only show the admin panel if the user is an admin
  return (
    isAdmin && (
        <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="container mx-auto max-w-2xl p-8 bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl border border-gray-200"
      >
        {/* 🔹 Title */}
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-4xl font-extrabold text-gray-900 mb-6 text-center"
        >
          ✍️ Add Help Article
        </motion.h1>
  
        {/* 🔹 Form */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="space-y-6"
        >
          {/* 🔹 Title Input */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Article Title</label>
            <motion.input
              whileFocus={{ scale: 1.03, borderColor: "#3b82f6" }}
              type="text"
              placeholder="Enter article title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input input-bordered w-full p-3 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-400 text-black"
            />
          </div>
  
          {/* 🔹 Category Input */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Category</label>
            <motion.input
              whileFocus={{ scale: 1.03, borderColor: "#3b82f6" }}
              type="text"
              placeholder="Enter category..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input input-bordered w-full p-3 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-400 text-black"
            />
          </div>
  
          {/* 🔹 Content Textarea */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Content (Markdown)</label>
            <motion.textarea
              whileFocus={{ scale: 1.02, borderColor: "#3b82f6" }}
              placeholder="Write your article here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="textarea textarea-bordered w-full p-3 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-400 h-40 text-black"
            />
          </div>
  
          {/* 🔹 Submit Button */}
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn btn-primary w-full p-3 text-lg font-semibold bg-blue-500 text-white rounded-xl shadow-md hover:bg-blue-600 transition-all"
          >
            🚀 Submit Article
          </motion.button>
        </motion.form>
        <motion.div
  className="bg-white p-6 rounded-lg shadow-lg border mt-8"
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
>
  <h2 className="text-2xl font-bold text-black">🛑 Manage Users</h2>

  {isLoadingUsers ? (
    <p className="text-gray-500">Loading users...</p>
  ) : (
    <div className="mt-4 space-y-4">
      {users.length === 0 && <p className="text-gray-500">No active users found.</p>}

      {users.map((user) => (
        <div key={user.$id} className="flex justify-between items-center p-4 border rounded-lg shadow">
          <div>
            <p className="font-semibold text-black">{user.username}</p>
            <p className="text-sm text-gray-500">UUID: {user.uuid}</p>
          </div>
          <button
            onClick={() => toggleBan(user)}
            className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Ban
          </button>
        </div>
      ))}
    </div>
  )}

  {/* Banned Users Section */}
  <h2 className="text-2xl font-bold text-red-600 mt-6">🚫 Banned Users</h2>
  <div className="mt-4 space-y-4">
    {bannedUsers.length === 0 ? (
      <p className="text-gray-500">No banned users.</p>
    ) : (
      bannedUsers.map((user) => (
        <div key={user.$id} className="flex justify-between items-center p-4 border rounded-lg shadow bg-red-50">
          <div>
            <p className="font-semibold text-black">{user.username}</p>
            <p className="text-sm text-gray-500">UUID: {user.uuid}</p>
          </div>
          <button
            onClick={() => toggleBan(user)}
            className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Unban
          </button>
        </div>
      ))
    )}
  </div>
</motion.div>
      </motion.div>
    )
  );
}