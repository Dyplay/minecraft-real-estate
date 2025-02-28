"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { account, db, ID, Query } from "../../../lib/appwrite";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaUser, FaLock, FaMinecraft, FaSignInAlt, FaUserPlus } from "react-icons/fa";
import Link from "next/link";
import Image from "next/image";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [uuid, setUuid] = useState("");
  const [ip, setIp] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Get user's IP address
    async function getIP() {
      try {
        const response = await fetch("https://api64.ipify.org?format=json");
        const data = await response.json();
        setIp(data.ip);
      } catch (error) {
        console.error("Error fetching IP:", error);
      }
    }
    getIP();

    // Check if user is already logged in
    async function checkSession() {
      try {
        const session = await account.get();
        if (session) {
          router.push("/dashboard");
        }
      } catch (error) {
        // Not logged in, stay on login page
        console.log("No active session");
      }
    }
    checkSession();
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegistering) {
        // Registration flow
        if (!username || !password || !uuid) {
          toast.error("Please fill in all fields");
          setLoading(false);
          return;
        }

        // Check if username already exists
        const existingUsers = await db.listDocuments(
          "67a8e81100361d527692",
          "67a900dc003e3b7524ee",
          [Query.equal("username", username)]
        );

        if (existingUsers.documents.length > 0) {
          toast.error("Username already exists");
          setLoading(false);
          return;
        }

        // Create Appwrite account
        await account.create(ID.unique(), username, password);
        
        // Login with the new account
        await account.createEmailSession(username, password);
        
        // Get the session to retrieve user ID
        const session = await account.get();
        
        // Create user document in database
        await db.createDocument(
          "67a8e81100361d527692",
          "67a900dc003e3b7524ee",
          ID.unique(),
          {
            username,
            uuid,
            ip,
            userId: session.$id,
          }
        );

        toast.success("Registration successful!");
        router.push("/dashboard");
      } else {
        // Login flow
        if (!username || !password) {
          toast.error("Please fill in all fields");
          setLoading(false);
          return;
        }

        // Login with Appwrite
        await account.createEmailSession(username, password);
        
        // Check if user exists in our database
        const users = await db.listDocuments(
          "67a8e81100361d527692",
          "67a900dc003e3b7524ee",
          [Query.equal("username", username)]
        );

        if (users.documents.length === 0) {
          // If user doesn't exist in our database (but exists in Appwrite)
          toast.error("User not found in our database");
          await account.deleteSession("current");
          setLoading(false);
          return;
        }

        // Check if user is banned
        const userDoc = users.documents[0];
        const bans = await db.listDocuments(
          "67a8e81100361d527692",
          "67c0eec80022ef6cb8b7",
          [Query.equal("uuid", userDoc.uuid)]
        );

        if (bans.documents.length > 0) {
          const ban = bans.documents[0];
          await account.deleteSession("current");
          router.push(`/banned?reason=${encodeURIComponent(ban.reason)}`);
          return;
        }

        toast.success("Login successful!");
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <ToastContainer
        position="bottom-left"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        pauseOnHover
        draggable
        theme="dark"
      />
      
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Image 
              src="/logo.png" 
              alt="Logo" 
              width={200} 
              height={60} 
              className="h-16 w-auto"
            />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-white">
            {isRegistering ? "Create your account" : "Sign in to your account"}
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            {isRegistering 
              ? "Join our Minecraft real estate marketplace" 
              : "Access your Minecraft properties and listings"}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="username" className="sr-only">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-600 placeholder-gray-500 text-white rounded-md bg-gray-700 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-600 placeholder-gray-500 text-white rounded-md bg-gray-700 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            
            {isRegistering && (
              <div>
                <label htmlFor="uuid" className="sr-only">Minecraft UUID</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaMinecraft className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    id="uuid"
                    name="uuid"
                    type="text"
                    required
                    className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-600 placeholder-gray-500 text-white rounded-md bg-gray-700 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                    placeholder="Minecraft UUID"
                    value={uuid}
                    onChange={(e) => setUuid(e.target.value)}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Don't know your UUID? Use a tool like{" "}
                  <a 
                    href="https://mcuuid.net/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-orange-500 hover:text-orange-400"
                  >
                    mcuuid.net
                  </a>
                </p>
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </div>
              ) : (
                <div className="flex items-center">
                  {isRegistering ? (
                    <>
                      <FaUserPlus className="mr-2" />
                      Register
                    </>
                  ) : (
                    <>
                      <FaSignInAlt className="mr-2" />
                      Sign in
                    </>
                  )}
                </div>
              )}
            </button>
          </div>
        </form>
        
        <div className="text-center mt-4">
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-orange-500 hover:text-orange-400 text-sm font-medium transition-colors"
          >
            {isRegistering
              ? "Already have an account? Sign in"
              : "Don't have an account? Register"}
          </button>
        </div>
        
        <div className="mt-6 border-t border-gray-700 pt-4 text-center">
          <p className="text-xs text-gray-400">
            By signing in or registering, you agree to our{" "}
            <Link href="/terms" className="text-orange-500 hover:text-orange-400">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-orange-500 hover:text-orange-400">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}