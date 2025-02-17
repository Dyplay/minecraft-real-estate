"use client";

import { useEffect, useState } from "react";
import { getCurrentUser } from "../../../lib/appwrite"; // ✅ Ensure correct import
import { useRouter } from "next/navigation";
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
      const currentUser = await getCurrentUser();
      console.log("Fetched User in Navbar:", currentUser); // ✅ Debugging
      setUser(currentUser);
    }
    fetchUser();
  }, []);

  return (
    <nav className="bg-gray-900 text-white p-4 flex justify-between items-center">
      {/* Logo */}
      <Link href="/" className="text-2xl font-bold hover:text-gray-400 transition">
        Immobilien
      </Link>

      {/* 🔍 Search Bar */}
      <div className="relative flex items-center bg-gray-800 rounded-full p-2 shadow-lg">
        <input
          type="text"
          placeholder="Search listings..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-white px-3 outline-none w-64 placeholder-gray-400"
        />
        <button className="p-2 hover:bg-gray-700 rounded-full transition">
          <FaSearch className="text-white" />
        </button>
      </div>

      {/* User Dropdown */}
      {user ? (
        <div className="relative">
          <button onClick={() => setDropdown(!dropdown)} className="flex items-center gap-2 hover:text-gray-400 transition">
            <Image
              src={user.avatar}
              width={32}
              height={32}
              className="rounded-full"
              alt="User Avatar"
            />
            <span>{user.name}</span>
            <FaChevronDown />
          </button>

          {dropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-lg shadow-lg">
              <Link href="/dashboard" className="block px-4 py-2 hover:bg-gray-200 transition">
                Dashboard
              </Link>
              <button
                onClick={async () => {
                  await account.deleteSession("current"); // ✅ Logout function
                  window.location.href = "/";
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-200 transition"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      ) : (
        <Link href="/login" className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600 transition">
          Login
        </Link>
      )}
    </nav>
  );
}