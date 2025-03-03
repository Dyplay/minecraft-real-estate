import { Client, Account, Databases, Storage, ID, Query } from "appwrite";
import { captureEvent } from './posthog';

const appwriteConfig = {
  endpoint: "https://cloud.appwrite.io/v1", // Replace with your Appwrite endpoint
  projectId: "67a8e6460025b0417582", // Replace with your Appwrite Project ID
  databaseId: "67a8e81100361d527692", // Replace with your Database ID
  listingsCollectionId: "67b2fdc20027f4d55440", // Collection for real estate listings
  usersCollectionId: "67a900dc003e3b7524ee", // Collection for user data
  transactionsCollectionId: "67b1a707002e2def036e", // Collection for transaction requests
  storageId: "67b2fe15002b214adfba", // Storage for property images
};

// Initialize Appwrite Client
const client = new Client();
client.setEndpoint(appwriteConfig.endpoint).setProject(appwriteConfig.projectId);

// Initialize Appwrite Services
const account = new Account(client);
const db = new Databases(client);
const storage = new Storage(client);

/* --------------------------
 ✅ AUTH FUNCTIONS (Login, Logout, Get User)
-------------------------- */

// 🔹 Login with Discord
const loginWithDiscord = async () => {
  try {
    await account.createOAuth2Session("discord", "http://localhost:3000/dashboard", "http://localhost:3000/login");
  } catch (error) {
    console.error("Login failed:", error);
  }
};

const getUserSession = async() =>{
  try {
    const user = await account.get(); // ✅ This fetches user session without an API key
    console.log("✅ User Session Found:", user);

    return {
      user_name: user.name || "Unknown",
      username: user.$id || null,
      email: user.email || "No Email",
    };
  } catch (error) {
    console.warn("⚠ No active session found.");
    return null;
  }
}

const subscribeToRealtime = (collectionId, callback) => {
  return client.subscribe(
    `databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID}.collections.${collectionId}.documents`,
    callback
  );
};

// 🔹 Get Current User
const getCurrentUser = async () => {
  try {
    return await account.get();
  } catch (error) {
    console.error("Failed to get user:", error);
    return null;
  }
};

// 🔹 Logout
const logout = async () => {
  try {
    await account.deleteSession("current");
    return true;
  } catch (error) {
    console.error("Logout failed:", error);
    return false;
  }
};

/* --------------------------
 ✅ DATABASE FUNCTIONS (CRUD Operations)
-------------------------- */

// 🔹 Fetch All Listings
const fetchListings = async () => {
  try {
    const response = await db.listDocuments(appwriteConfig.databaseId, appwriteConfig.listingsCollectionId, [
      Query.limit(20),
    ]);
    return response.documents;
  } catch (error) {
    console.error("Error fetching listings:", error);
    return [];
  }
};

// 🔹 Create a New Listing
async function createListing() {
  if (!user || !user.uuid) {
    alert("⚠ You must be logged in to create a listing.");
    return;
  }

  if (!form.title || !form.description || !form.price || !form.images) {
    alert("⚠ Please fill in all fields!");
    return;
  }

  setLoading(true);

  try {
    await db.createDocument("67a8e81100361d527692", "listings", ID.unique(), {
      ...form,
      sellerUUID: user.uuid,  // ✅ Only access when `user` is available
      images: form.images.split(","), // ✅ Store images as an array
    });

    alert("✅ Listing created successfully!");
    setForm({ title: "", description: "", price: "", type: "buy", images: "" });

    // Reload listings
    const response = await db.listDocuments("67a8e81100361d527692", "listings", [
      Query.equal("sellerUUID", user.uuid),
    ]);
    setListings(response.documents);
  } catch (error) {
    console.error("Error creating listing:", error);
    alert("❌ Failed to create listing. Try again.");
  } finally {
    setLoading(false);
  }
}

// 🔹 Fetch Single Listing by ID
const getListingById = async (listingId) => {
  try {
    return await db.getDocument(appwriteConfig.databaseId, appwriteConfig.listingsCollectionId, listingId);
  } catch (error) {
    console.error("Error fetching listing:", error);
    return null;
  }
};

// 🔹 Delete Listing
const deleteListing = async (listingId) => {
  try {
    await db.deleteDocument(appwriteConfig.databaseId, appwriteConfig.listingsCollectionId, listingId);
    return true;
  } catch (error) {
    console.error("Error deleting listing:", error);
    return false;
  }
};

/* --------------------------
 ✅ IMAGE UPLOAD (Storage)
-------------------------- */

// 🔹 Upload Image
async function uploadImage(file) {
  if (!file) return null;

  try {
    const uploadedFile = await storage.createFile("67b2fe15002b214adfba", ID.unique(), file);
    return uploadedFile.$id; // ✅ Returns the file ID to store in DB
  } catch (error) {
    console.error("Image upload failed:", error);
    alert("❌ Failed to upload image.");
    return null;
  }
}

// 🔹 Get Image URL
const getImageUrl = (fileId) => {
  return `${appwriteConfig.endpoint}/storage/buckets/${appwriteConfig.storageId}/files/${fileId}/view?project=${appwriteConfig.projectId}`;
};

/* --------------------------
 ✅ TRANSACTION REQUESTS (Notifications)
-------------------------- */

// 🔹 Create Transaction Request
const createTransactionRequest = async ({ buyer, seller, listingId, price }) => {
  try {
    return await db.createDocument(appwriteConfig.databaseId, appwriteConfig.transactionsCollectionId, ID.unique(), {
      buyer,
      seller,
      listingId,
      price,
      confirmed: false, // Buyer must confirm in bank app
    });
  } catch (error) {
    console.error("Error creating transaction request:", error);
    return null;
  }
};

// 🔹 Fetch User Notifications (Pending Transactions)
const fetchUserNotifications = async (username) => {
  try {
    const response = await db.listDocuments(appwriteConfig.databaseId, appwriteConfig.transactionsCollectionId, [
      Query.equal("buyer", username),
      Query.equal("confirmed", false),
    ]);
    return response.documents;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
};

// 🔹 Confirm Transaction (Buyer Approval)
const confirmTransaction = async (transactionId) => {
  try {
    await db.updateDocument(appwriteConfig.databaseId, appwriteConfig.transactionsCollectionId, transactionId, {
      confirmed: true,
    });
    return true;
  } catch (error) {
    console.error("Error confirming transaction:", error);
    return false;
  }
};

// 🔹 Delete Transaction Request (If Denied)
const deleteTransactionRequest = async (transactionId) => {
  try {
    await db.deleteDocument(appwriteConfig.databaseId, appwriteConfig.transactionsCollectionId, transactionId);
    return true;
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return false;
  }
};

async function listenForPurchaseConfirmation(purchaseId, setPurchaseStep, setShowPurchasePopup) {
  console.log(`🔄 Listening for purchase confirmation for ID: ${purchaseId}`);

  // ✅ Subscribe to real-time updates
  const unsubscribe = client.subscribe(
    `databases.67a8e81100361d527692.collections.67b6049900036a440ded.documents.${purchaseId}`,
    (response) => {
      console.log("📩 Received real-time update:", response);

      if (response.events.includes("databases.*.collections.*.documents.*.update")) {
        if (response.payload.confirmed) {
          setPurchaseStep("✅ Purchase Confirmed!");
          setTimeout(() => {
            setShowPurchasePopup(false);
            toast.success("🎉 Purchase successful!");
          }, 2000);
        }
      }
    }
  );

  return unsubscribe;
}

// Wrapper functions with event tracking
export const createUser = async (email, password, name) => {
  try {
    captureEvent('signup_started', { method: 'email' });
    
    const response = await account.create(ID.unique(), email, password, name);
    
    captureEvent('signup_completed', { 
      method: 'email',
      user_id: response.$id 
    });
    
    return response;
  } catch (error) {
    captureEvent('signup_failed', { 
      method: 'email',
      error: error.message 
    });
    
    throw error;
  }
};

export const loginUser = async (email, password) => {
  try {
    captureEvent('login_started', { method: 'email' });
    
    const session = await account.createEmailSession(email, password);
    
    captureEvent('login_completed', { 
      method: 'email',
      user_id: session.userId 
    });
    
    return session;
  } catch (error) {
    captureEvent('login_failed', { 
      method: 'email',
      error: error.message 
    });
    
    throw error;
  }
};

export {
  account,
  loginWithDiscord,
  Query,
  ID,
  getCurrentUser,
  logout,
  storage,
  db,
  fetchListings,
  createListing,
  getListingById,
  client,
  deleteListing,
  uploadImage,
  listenForPurchaseConfirmation,
  getImageUrl,
  createTransactionRequest,
  fetchUserNotifications,
  confirmTransaction,
  subscribeToRealtime,
  getUserSession,
  deleteTransactionRequest,
};