"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db, account, Query, ID } from "../../../lib/appwrite";
import { toast } from "react-toastify";

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bannedUsers, setBannedUsers] = useState([]);
  const [banForm, setBanForm] = useState({ uuid: "", reason: "" });
  const [unbanUuid, setUnbanUuid] = useState("");
  
  // Allowed admin IDs - these are Appwrite Auth user IDs
  // Based on the screenshot, we should use the IDs from the Appwrite Auth system
  const allowedAdminEmails = [
    "marcogaming5twitch@gmail.com",  // dy_228939
    "jaukijoni@gmail.com",       // krtazbaum (admin)
  ];

  useEffect(() => {
    async function checkAdminAccess() {
      try {
        // Get current session from Appwrite Auth
        const session = await account.get();
        
        if (!session) {
          toast.error("You must be logged in to access the admin panel");
          router.push("/");
          return;
        }

        console.log("Auth session:", session);

        // Get user data from Appwrite Auth
        try {
          const authUser = await account.get();
          console.log("Auth user:", authUser);

          // Check if user's email is in the allowed admin emails list
          if (!allowedAdminEmails.includes(authUser.email)) {
            console.log("Access denied. User email:", authUser.email);
            toast.error("You do not have permission to access the admin panel");
            router.push("/");
            return;
          }

          setUser(authUser);
          console.log("Admin access granted for user:", authUser.email);
          
          // Fetch banned users
          fetchBannedUsers();
        } catch (error) {
          console.error("Error fetching auth user:", error);
          toast.error("Failed to verify admin access");
          router.push("/");
        }
      } catch (error) {
        console.error("Error checking admin access:", error);
        toast.error("Failed to verify admin access");
        router.push("/");
      } finally {
        setLoading(false);
      }
    }

    checkAdminAccess();
  }, [router]);

  async function fetchBannedUsers() {
    try {
      const bannedResponse = await db.listDocuments(
        "67a8e81100361d527692",
        "67c0eec80022ef6cb8b7"
      );
      setBannedUsers(bannedResponse.documents);
    } catch (error) {
      console.error("Error fetching banned users:", error);
      toast.error("Failed to fetch banned users");
    }
  }

  async function handleBanUser(e) {
    e.preventDefault();
    
    if (!banForm.uuid || !banForm.reason) {
      toast.error("UUID and ban reason are required");
      return;
    }

    try {
      // Check if user exists
      const userExists = await db.listDocuments(
        "67a8e81100361d527692",
        "67a900dc003e3b7524ee",
        [Query.equal("uuid", banForm.uuid)]
      );

      if (userExists.documents.length === 0) {
        toast.error("User with this UUID does not exist");
        return;
      }

      // Create ban record
      await db.createDocument(
        "67a8e81100361d527692",
        "67c0eec80022ef6cb8b7",
        ID.unique(),
        {
          UUID: banForm.uuid,
          BanReason: banForm.reason
        }
      );

      toast.success("User banned successfully");
      setBanForm({ uuid: "", reason: "" });
      fetchBannedUsers();
    } catch (error) {
      console.error("Error banning user:", error);
      toast.error("Failed to ban user");
    }
  }

  async function handleUnbanUser(e) {
    e.preventDefault();
    
    if (!unbanUuid) {
      toast.error("UUID is required for unbanning");
      return;
    }

    try {
      // Find the ban document
      const banDocuments = await db.listDocuments(
        "67a8e81100361d527692",
        "67c0eec80022ef6cb8b7",
        [Query.equal("UUID", unbanUuid)]
      );

      if (banDocuments.documents.length === 0) {
        toast.error("No ban record found for this UUID");
        return;
      }

      // Delete the ban document
      await db.deleteDocument(
        "67a8e81100361d527692",
        "67c0eec80022ef6cb8b7",
        banDocuments.documents[0].$id
      );

      toast.success("User unbanned successfully");
      setUnbanUuid("");
      fetchBannedUsers();
    } catch (error) {
      console.error("Error unbanning user:", error);
      toast.error("Failed to unban user");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex justify-center items-center">
        <p className="text-xl">Loading admin panel...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <p className="text-lg">Logged in as: <span className="font-bold">{user?.name || user?.email}</span></p>
          <p className="text-sm text-gray-400">Email: {user?.email}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ban User Form */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Ban User</h2>
            <form onSubmit={handleBanUser}>
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Minecraft UUID</label>
                <input
                  type="text"
                  value={banForm.uuid}
                  onChange={(e) => setBanForm({...banForm, uuid: e.target.value})}
                  className="w-full p-2 bg-gray-700 rounded text-white"
                  placeholder="Enter Minecraft UUID"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Ban Reason</label>
                <textarea
                  value={banForm.reason}
                  onChange={(e) => setBanForm({...banForm, reason: e.target.value})}
                  className="w-full p-2 bg-gray-700 rounded text-white"
                  placeholder="Enter ban reason"
                  rows="3"
                ></textarea>
              </div>
              <button
                type="submit"
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
              >
                Ban User
              </button>
            </form>
          </div>

          {/* Unban User Form */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Unban User</h2>
            <form onSubmit={handleUnbanUser}>
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Minecraft UUID</label>
                <input
                  type="text"
                  value={unbanUuid}
                  onChange={(e) => setUnbanUuid(e.target.value)}
                  className="w-full p-2 bg-gray-700 rounded text-white"
                  placeholder="Enter Minecraft UUID to unban"
                />
              </div>
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
              >
                Unban User
              </button>
            </form>
          </div>
        </div>

        {/* Banned Users List */}
        <div className="mt-8 bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Banned Users</h2>
          
          {bannedUsers.length === 0 ? (
            <p className="text-gray-400">No banned users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="p-3">UUID</th>
                    <th className="p-3">Ban Reason</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bannedUsers.map((banned) => (
                    <tr key={banned.$id} className="border-t border-gray-700">
                      <td className="p-3">{banned.UUID}</td>
                      <td className="p-3">{banned.BanReason}</td>
                      <td className="p-3">
                        <button
                          onClick={() => {
                            setUnbanUuid(banned.UUID);
                            window.scrollTo({
                              top: document.querySelector('form').offsetTop,
                              behavior: 'smooth'
                            });
                          }}
                          className="text-blue-400 hover:underline"
                        >
                          Unban
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}