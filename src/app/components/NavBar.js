"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db, account, Query } from "../../../lib/appwrite";
import Link from "next/link";
import Image from "next/image";
import { FaSearch, FaChevronDown, FaHome, FaUser, FaSignOutAlt, FaTachometerAlt } from "react-icons/fa";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [dropdown, setDropdown] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function fetchUser() {
      try {
        console.log("🔄 Fetching Appwrite session...");
        const session = await account.get();
        console.log("🟢 Session Data:", session);

        if (!session) {
          console.warn("⚠ No session found.");
          return;
        }

        let ipData;
        try {
          const ipResponse = await fetch("https://api64.ipify.org?format=json");
          ipData = await ipResponse.json();
        } catch (error) {
          console.error("🚨 Failed to fetch user IP:", error);
          return;
        }

        const userIP = ipData.ip;
        console.log("🌐 Fetched User IP:", userIP);

        const userResponse = await db.listDocuments("67a8e81100361d527692", "67a900dc003e3b7524ee", [
          Query.equal("ip", userIP),
        ]);

        if (userResponse.documents.length === 0) {
          console.warn("⚠ No user found with matching IP.");
          return;
        }

        const userData = userResponse.documents[0];
        console.log("✅ Found User Data:", userData);

        let mcUsername = "Unknown";
        try {
          const mcResponse = await fetch(`https://rigabank.dyplay.at/api/uuid?uuid=${userData.uuid}`);
          const mcData = await mcResponse.json();
          mcUsername = mcData.name;
        } catch (error) {
          console.error("🚨 Failed to fetch Minecraft username:", error);
        }

        setUser({
          ...userData,
          mcUsername: mcUsername,
          avatar: `https://crafthead.net/helm/${userData.uuid}`,
          sessionId: session.$id
        });

      } catch (error) {
        console.error("🚨 Error fetching user session:", error);
      }
    }
    fetchUser();
  }, []);

  return (
    <nav className="bg-gray-900 text-white p-4 shadow-lg border-b border-gray-800">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="hover:opacity-80 transition flex items-center">
          <Image
            src="/logo.png"
            alt="RigaVault Estate"
            width={500}
            height={125}
            className="h-16 w-auto -my-4"
            priority
          />
        </Link>

        {/* 🔍 Search Bar */}
        <div className="relative flex items-center bg-gray-800 rounded-lg p-2 shadow-md border border-gray-700 flex-1 max-w-md mx-6">
          <input
            type="text"
            placeholder="Search listings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                router.push(`/listings?search=${encodeURIComponent(search)}`);
              }
            }}
            className="bg-transparent text-white px-3 outline-none w-full placeholder-gray-400"
          />
          <button
            onClick={() => router.push(`/listings?search=${encodeURIComponent(search)}`)}
            className="p-2 bg-orange-500 hover:bg-orange-600 rounded-md transition text-white"
          >
            <FaSearch className="text-white" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-6">
          <Link href="/" className="text-gray-300 hover:text-white hover:underline transition flex items-center">
            <FaHome className="mr-1" />
            <span>Home</span>
          </Link>
          <Link href="/listings" className="text-gray-300 hover:text-white hover:underline transition">
            Listings
          </Link>
        </div>

        {/* User Dropdown */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setDropdown(!dropdown)}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg transition border border-gray-700"
            >
              <Image
                src={user.avatar || "/example.jpg"}
                width={32}
                height={32}
                alt="User Avatar"
                className="rounded-md"
              />
              <span className="hidden sm:inline">{user.mcUsername}</span> 
              <FaChevronDown className="text-gray-400" />
            </button>

            {dropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 text-white rounded-lg shadow-lg z-50 border border-gray-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-700">
                  <p className="text-sm text-gray-300">Signed in as</p>
                  <p className="text-sm font-medium truncate">{user.mcUsername}</p>
                </div>
                
                <Link 
                  href="/dashboard" 
                  className="flex items-center px-4 py-2 hover:bg-gray-700 transition text-gray-200"
                >
                  <FaTachometerAlt className="mr-2 text-orange-500" />
                  Dashboard
                </Link>
                
                <Link 
                  href={`/profile/${user?.sessionId}`}
                  className="flex items-center px-4 py-2 hover:bg-gray-700 transition text-gray-200"
                >
                  <FaUser className="mr-2 text-orange-500" />
                  Profile
                </Link>
                
                <button
                  onClick={async () => {
                    await account.deleteSession("current");
                    window.location.href = "/";
                  }}
                  className="w-full text-left flex items-center px-4 py-2 hover:bg-gray-700 transition text-gray-200 border-t border-gray-700"
                >
                  <FaSignOutAlt className="mr-2 text-orange-500" />
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className="bg-orange-500 px-4 py-2 rounded-lg hover:bg-orange-600 transition shadow-md">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
