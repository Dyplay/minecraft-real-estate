"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db, account, Query, ID } from "../../../lib/appwrite";
import { toast } from "react-toastify";
import Image from "next/image";
import { FaUserShield, FaBan, FaUnlock, FaSearch, FaUserSlash, FaUserCheck, FaCog, FaHistory, FaCircle } from "react-icons/fa";

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bannedUsers, setBannedUsers] = useState([]);
  const [banForm, setBanForm] = useState({ uuid: "", reason: "" });
  const [unbanUuid, setUnbanUuid] = useState("");
  const [activeTab, setActiveTab] = useState("ban"); // "ban", "unban", or "maintenance"
  const [searchTerm, setSearchTerm] = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [maintenanceHistory, setMaintenanceHistory] = useState([]);
  
  // Allowed admin IDs - these are Appwrite Auth user IDs
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
          fetchMaintenanceStatus();
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

  async function fetchMaintenanceStatus() {
    try {
      // First check for active maintenance
      const activeMaintenanceResponse = await db.listDocuments(
        "67a8e81100361d527692",
        "67c5acfe0021ca559d26",
        [Query.equal("active", true)]
      );
      
      if (activeMaintenanceResponse.documents.length > 0) {
        const activeMaintenance = activeMaintenanceResponse.documents[0];
        setMaintenanceMode(true);
        setMaintenanceMessage(activeMaintenance.message || "Site is under maintenance");
      } else {
        setMaintenanceMode(false);
        setMaintenanceMessage("");
      }
      
      // Then fetch maintenance history
      const historyResponse = await db.listDocuments(
        "67a8e81100361d527692",
        "67c5acfe0021ca559d26",
        [Query.orderDesc("startTime")]
      );
      
      setMaintenanceHistory(historyResponse.documents);
    } catch (error) {
      console.error("Error fetching maintenance status:", error);
      toast.error("Failed to fetch maintenance status");
    }
  }

  async function toggleMaintenanceMode() {
    try {
      if (!maintenanceMode) {
        // Enabling maintenance mode
        await db.createDocument(
          "67a8e81100361d527692",
          "67c5acfe0021ca559d26",
          ID.unique(),
          {
            active: true,
            message: maintenanceMessage || "Site is under maintenance",
            startTime: new Date().toISOString(),
            endTime: null,
            createdBy: user.email
          }
        );
        toast.success("Maintenance mode enabled");
      } else {
        // Disabling maintenance mode - find the active maintenance record
        const activeMaintenanceResponse = await db.listDocuments(
          "67a8e81100361d527692",
          "67c5acfe0021ca559d26",
          [Query.equal("active", true)]
        );
        
        if (activeMaintenanceResponse.documents.length > 0) {
          const activeMaintenance = activeMaintenanceResponse.documents[0];
          
          // Update the record to set it as inactive
          await db.updateDocument(
            "67a8e81100361d527692",
            "67c5acfe0021ca559d26",
            activeMaintenance.$id,
            {
              active: false,
              endTime: new Date().toISOString()
            }
          );
          toast.success("Maintenance mode disabled");
        }
      }
      
      // Refresh the maintenance status and history
      fetchMaintenanceStatus();
    } catch (error) {
      console.error("Error toggling maintenance mode:", error);
      toast.error("Failed to toggle maintenance mode");
    }
  }

  // Filter banned users based on search term
  const filteredBannedUsers = bannedUsers.filter(user => 
    user.UUID.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.BanReason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex justify-center items-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-300 text-lg">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <FaUserShield className="text-orange-500 text-2xl mr-3" />
            <h1 className="text-xl font-semibold text-white">Admin Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
                {user?.name ? user.name.charAt(0).toUpperCase() : user?.email.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-200">{user?.name || user?.email}</span>
            </div>
            <button 
              onClick={() => router.push('/')}
              className="text-sm text-gray-400 hover:text-white"
            >
              Back to Home
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700">
              {/* Tab Navigation */}
              <div className="flex border-b border-gray-700">
                <button
                  className={`flex-1 py-4 px-4 text-center font-medium ${
                    activeTab === "ban" 
                      ? "text-orange-500 border-b-2 border-orange-500" 
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                  onClick={() => setActiveTab("ban")}
                >
                  <div className="flex items-center justify-center">
                    <FaBan className="mr-2" />
                    Ban User
                  </div>
                </button>
                <button
                  className={`flex-1 py-4 px-4 text-center font-medium ${
                    activeTab === "unban" 
                      ? "text-orange-500 border-b-2 border-orange-500" 
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                  onClick={() => setActiveTab("unban")}
                >
                  <div className="flex items-center justify-center">
                    <FaUnlock className="mr-2" />
                    Unban User
                  </div>
                </button>
                <button
                  className={`flex-1 py-4 px-4 text-center font-medium ${
                    activeTab === "maintenance" 
                      ? "text-orange-500 border-b-2 border-orange-500" 
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                  onClick={() => setActiveTab("maintenance")}
                >
                  <div className="flex items-center justify-center">
                    <FaCog className="mr-2" />
                    Maintenance
                  </div>
                </button>
              </div>

              {/* Ban Form */}
              {activeTab === "ban" && (
                <div className="p-6">
                  <form onSubmit={handleBanUser}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Minecraft UUID
                      </label>
                      <input
                        type="text"
                        value={banForm.uuid}
                        onChange={(e) => setBanForm({...banForm, uuid: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Enter Minecraft UUID"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Ban Reason
                      </label>
                      <textarea
                        value={banForm.reason}
                        onChange={(e) => setBanForm({...banForm, reason: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Enter ban reason"
                        rows="4"
                      ></textarea>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-orange-500 transition-colors flex items-center justify-center"
                    >
                      <FaUserSlash className="mr-2" />
                      Ban User
                    </button>
                  </form>
                </div>
              )}

              {/* Unban Form */}
              {activeTab === "unban" && (
                <div className="p-6">
                  <form onSubmit={handleUnbanUser}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Minecraft UUID
                      </label>
                      <input
                        type="text"
                        value={unbanUuid}
                        onChange={(e) => setUnbanUuid(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Enter Minecraft UUID to unban"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 transition-colors flex items-center justify-center"
                    >
                      <FaUserCheck className="mr-2" />
                      Unban User
                    </button>
                  </form>
                </div>
              )}

              {/* Maintenance Mode Tab */}
              {activeTab === "maintenance" && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-white">Maintenance Mode</h3>
                    <div className="flex items-center">
                      <span className={`flex h-3 w-3 relative mr-2`}>
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${maintenanceMode ? 'bg-green-400' : 'bg-red-400'} opacity-75`}></span>
                        <span className={`relative inline-flex rounded-full h-3 w-3 ${maintenanceMode ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      </span>
                      <span className="text-sm text-gray-300">
                        {maintenanceMode ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    toggleMaintenanceMode();
                  }}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Maintenance Message
                      </label>
                      <textarea
                        value={maintenanceMessage}
                        onChange={(e) => setMaintenanceMessage(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Enter message to display during maintenance"
                        rows="3"
                      ></textarea>
                    </div>
                    
                    <button
                      type="submit"
                      className={`w-full text-white py-2 px-4 rounded-md transition-colors flex items-center justify-center ${
                        maintenanceMode 
                          ? "bg-red-600 hover:bg-red-700" 
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      <FaCog className="mr-2" />
                      {maintenanceMode ? "Disable Maintenance Mode" : "Enable Maintenance Mode"}
                    </button>
                  </form>
                  
                  <div className="mt-8">
                    <h3 className="text-lg font-medium text-white mb-4">Maintenance History</h3>
                    {maintenanceHistory.length > 0 ? (
                      <div className="overflow-x-auto rounded-lg border border-gray-700">
                        <table className="min-w-full divide-y divide-gray-700">
                          <thead className="bg-gray-700">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Started
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Ended
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Duration
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Message
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {maintenanceHistory.map((record) => {
                              // Calculate duration
                              const startTime = new Date(record.startTime);
                              const endTime = record.endTime ? new Date(record.endTime) : new Date();
                              const durationMs = endTime - startTime;
                              const durationMinutes = Math.floor(durationMs / (1000 * 60));
                              const durationHours = Math.floor(durationMinutes / 60);
                              const remainingMinutes = durationMinutes % 60;
                              const durationText = durationHours > 0 
                                ? `${durationHours}h ${remainingMinutes}m` 
                                : `${durationMinutes}m`;
                              
                              return (
                                <tr key={record.$id} className="hover:bg-gray-750">
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <FaCircle 
                                        className={`mr-2 ${record.active ? 'text-green-500' : 'text-red-500'} ${
                                          record.active ? 'animate-pulse' : ''
                                        }`} 
                                        size={10} 
                                      />
                                      <span className="text-sm text-gray-200">
                                        {record.active ? "Active" : "Completed"}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                                    {new Date(record.startTime).toLocaleString()}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                                    {record.endTime 
                                      ? new Date(record.endTime).toLocaleString() 
                                      : "Ongoing"}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                                    {durationText}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-300">
                                    {record.message || "Site under maintenance"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-center py-4">No maintenance history found</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Banned Users List */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700">
              <div className="p-6 border-b border-gray-700">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-white">Banned Users</h2>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaSearch className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search banned users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              {filteredBannedUsers.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="mx-auto w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
                    <FaBan className="text-gray-400 text-xl" />
                  </div>
                  <p className="mt-4 text-gray-400">
                    {searchTerm ? "No banned users match your search." : "No banned users found."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          UUID
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Ban Reason
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                      {filteredBannedUsers.map((banned) => (
                        <tr key={banned.$id} className="hover:bg-gray-750">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-8 w-8 mr-3">
                                <Image
                                  src={`https://crafthead.net/helm/${banned.UUID}`}
                                  alt="Player head"
                                  width={32}
                                  height={32}
                                  className="rounded"
                                />
                              </div>
                              <div className="text-sm font-medium text-gray-200">
                                {banned.UUID}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-300">{banned.BanReason}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => {
                                setUnbanUuid(banned.UUID);
                                setActiveTab("unban");
                              }}
                              className="text-orange-500 hover:text-orange-400 font-medium flex items-center"
                            >
                              <FaUnlock className="mr-1" />
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
      </main>
    </div>
  );
}