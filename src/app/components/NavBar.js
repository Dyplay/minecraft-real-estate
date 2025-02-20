"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db, account, Query } from "../../../lib/appwrite";
import Link from "next/link";
import Image from "next/image";
import { FaSearch, FaChevronDown } from "react-icons/fa";

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
        });

      } catch (error) {
        console.error("🚨 Error fetching user session:", error);
      }
    }
    fetchUser();
  }, []);

  return (
    <nav className="bg-gray-900 text-white p-4 flex justify-between items-center">
      {/* Logo */}
      <Link href="/" className="text-2xl font-bold hover:text-gray-400 transition">
        Immobilien
      </Link>

      {/* 🔍 Search Bar (Fixed) */}
      <div className="relative flex items-center bg-gray-800 rounded-full p-2 shadow-lg">
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
          className="bg-transparent text-white px-3 outline-none w-64 placeholder-gray-400"
        />
        <button
          onClick={() => router.push(`/listings?search=${encodeURIComponent(search)}`)}
          className="p-2 hover:bg-gray-700 rounded-full transition"
        >
          <FaSearch className="text-white" />
        </button>
      </div>

      {/* User Dropdown */}
      {user ? (
        <div className="relative">
          <button
            onClick={() => setDropdown(!dropdown)}
            className="flex items-center gap-2 hover:text-gray-400 transition relative z-50"
          >
            <Image
              src={user.avatar || "/example.jpg"}
              width={32}
              height={32}
              alt="User Avatar"
              className="rounded-md"
            />
            <span>{user.mcUsername}</span> 
            <FaChevronDown />
          </button>

          {dropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-lg shadow-lg z-50 border border-gray-200">
              <Link href="/dashboard" className="block px-4 py-2 hover:bg-gray-200 hover:rounded-lg transition">
                Dashboard
              </Link>
              <button
                onClick={async () => {
                  await account.deleteSession("current");
                  window.location.href = "/";
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-200 hover:rounded-lg transition"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      ) : (
        <Link href="/login" className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600 hover:rounded-lg transition">
          Login
        </Link>
      )}
    </nav>
  );
}
