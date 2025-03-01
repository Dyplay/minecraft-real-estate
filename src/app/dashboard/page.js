"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db, account, ID, Query, storage } from "../../../lib/appwrite";
import { motion } from "framer-motion";
import { FaTrash, FaEdit, FaImages } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaTimes, FaHome } from "react-icons/fa"; // Import close icon for modals
import Image from "next/image";
import Link from "next/link";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imageFiles, setImageFiles] = useState([]); // Holds new images
  const [modalOpen, setModalOpen] = useState(false);
  const [modalOpen2, setModalOpen2] = useState(false);
  const [deleteId, setDeleteId] = useState(null); // Track the ID of listing to delete
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    price: "",
    country: "Riga",
    type: "buy",
    imageUrls: [],
  });
  const [currentEditId, setCurrentEditId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    country: "Riga",
    type: "buy",
    imageUrls: [],
  });
  const [purchases, setPurchases] = useState([]);

  const router = useRouter();
  const bucketId = "67b2fe15002b214adfba";
  const allowedCountries = ["Riga", "Lavantal"];

  useEffect(() => {
    async function fetchUserData() {
      try {
        console.log("🔄 Fetching Appwrite session...");
        const session = await account.get();
        if (!session) return;

        const ipResponse = await fetch("https://api64.ipify.org?format=json");
        const ipData = await ipResponse.json();
        const userIP = ipData.ip;

        const userResponse = await db.listDocuments("67a8e81100361d527692", "67a900dc003e3b7524ee", [
          Query.equal("ip", userIP),
        ]);

        if (userResponse.documents.length === 0) {
          setRedirecting(true);
          return;
        }

        const userData = userResponse.documents[0];
        setUser({ ...userData, avatar: `https://crafthead.net/helm/${userData.uuid}` });

        const listingsResponse = await db.listDocuments("67a8e81100361d527692", "67b2fdc20027f4d55440", [
          Query.equal("sellerUUID", userData.uuid),
        ]);
        setListings(listingsResponse.documents);

        // Fetch user's purchases
        const purchasesResponse = await db.listDocuments(
          "67a8e81100361d527692",
          "67b6049900036a440ded",
          [
            Query.equal("buyer", userData.username),
            Query.equal("confirmed", true)
          ]
        );
        setPurchases(purchasesResponse.documents);

      } catch (error) {
        console.error("🚨 Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, []);

  useEffect(() => {
    if (redirecting) {
      router.push("/login");
    }
  }, [redirecting, router]);

  // ✅ Upload multiple images properly and return their URLs
// ✅ Upload multiple images properly and return their public URLs
async function uploadImages(existingImages = []) {
  const uploadedImageUrls = [...existingImages];

  for (let file of imageFiles) {
    try {
      const fileId = ID.unique();
      const response = await storage.createFile(bucketId, fileId, file);
      const fileUrl = storage.getFileView(bucketId, response.$id);
      uploadedImageUrls.push(fileUrl);
    } catch (error) {
      console.error("🚨 Error uploading image:", error);
    }
  }

  return uploadedImageUrls.slice(0, 10); // ✅ Ensure max 5 images
}

  // ✅ Create or Update Listing
  async function handleListing() {
    if (!user || !user.uuid) {
      toast.error("⚠ User not found!");
      return;
    }
  
    if (!form.title || !form.description || !form.price || !form.country) {
      toast.error("⚠ Please fill in all fields!");
      return;
    }
  
    const formattedPrice = parseFloat(form.price);
    if (isNaN(formattedPrice)) {
      toast.error("⚠ Price must be a valid number!");
      return;
    }
  
    if (formattedPrice > 10000000000) {
      toast.error("⚠ Price cannot exceed 10,000,000,000!");
      return;
    }
  
    setSubmitting(true);
    const documentId = editingId || ID.unique();
  
    try {
      let existingImages = form.imageUrls || [];
  
      if (editingId) {
        const existingListing = listings.find((listing) => listing.$id === editingId);
        if (existingListing) {
          existingImages = existingListing.imageUrls || [];
        }
      }
  
      const uploadedImages = await uploadImages(existingImages);
  
      const listingData = {
        sellerUUID: user.uuid,
        title: form.title,
        description: form.description,
        price: formattedPrice,
        country: form.country,
        type: form.type,
        available: true,
        imageUrls: uploadedImages, // ✅ Updated image list
      };
  
      if (editingId) {
        await db.updateDocument("67a8e81100361d527692", "67b2fdc20027f4d55440", editingId, listingData);
        toast.success("✅ Listing updated successfully!");
      } else {
        await db.createDocument("67a8e81100361d527692", "67b2fdc20027f4d55440", documentId, listingData);
        toast.success("✅ Listing created successfully!");
      }
  
      setEditingId(null);
      setImageFiles([]);
      setForm({ title: "", description: "", price: "", country: "Riga", type: "buy", imageUrls: [] });
  
      const response = await db.listDocuments("67a8e81100361d527692", "67b2fdc20027f4d55440", [
        Query.equal("sellerUUID", user.uuid),
      ]);
      setListings(response.documents);
    } catch (error) {
      console.error("🚨 Error handling listing:", error);
      toast.error("❌ Failed to process listing. Try again.");
    } finally {
      setSubmitting(false);
    }
  }  

const removeImage = (index) => {
  setImageFiles((prevFiles) => prevFiles.filter((_, i) => i !== index)); // ✅ Remove by index
};

  // ✅ Delete Listing
  async function deleteListing() {
    if (!deleteId) return;
  
    try {
      await db.deleteDocument("67a8e81100361d527692", "67b2fdc20027f4d55440", deleteId);
      setListings((prev) => prev.filter((listing) => listing.$id !== deleteId));
      toast.success("✅ Listing deleted successfully!");
    } catch (error) {
      console.error("🚨 Error deleting listing:", error);
      toast.error("❌ Failed to delete listing.");
    } finally {
      setModalOpen2(false); // Close modal after action
    }
  }  

  const openEditModal = (listing) => {
    setEditForm({
      title: listing.title,
      description: listing.description,
      price: listing.price,
      country: listing.country,
      type: listing.type,
      imageUrls: listing.imageUrls || [],
    });
    setCurrentEditId(listing.$id);
    setModalOpen(true); // ✅ Open the modal
  };  

  function confirmDelete(id) {
    setDeleteId(id);
    setModalOpen2(true);
  }  

  const closeModal = () => {
    setModalOpen(false);
    setCurrentEditId(null);
  };  

  const handleEditSubmit = async () => {
    if (!currentEditId) return;
  
    // ✅ Convert price to a float safely
    const formattedPrice = parseFloat(editForm.price);
    
    if (isNaN(formattedPrice)) {
      toast.error("❌ Price must be a valid number!");
      return;
    }
  
    if (formattedPrice > 10000000000) {
      toast.error("⚠ Price cannot exceed 10,000,000,000!");
      return;
    }
  
    try {
      await db.updateDocument("67a8e81100361d527692", "67b2fdc20027f4d55440", currentEditId, {
        ...editForm,
        price: formattedPrice, // ✅ Ensure valid float
      });
  
      toast.success("✅ Listing updated successfully!");
  
      // Refresh listings
      const response = await db.listDocuments("67a8e81100361d527692", "67b2fdc20027f4d55440", [
        Query.equal("sellerUUID", user.uuid),
      ]);
      setListings(response.documents);
  
      closeModal();
    } catch (error) {
      console.error("🚨 Error updating listing:", error);
      toast.error("❌ Failed to update listing.");
    }
  };  

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
  
    setImageFiles((prevFiles) => {
      const allFiles = [...prevFiles, ...newFiles].slice(0, 10); // ✅ Append new files, keep max 5
      return allFiles;
    });
  };   

  if (loading) {
    return <p className="text-center text-white">🔄 Loading session...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
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
      {/* Delete Confirmation Modal */}
      {modalOpen2 && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center border border-gray-700">
            <h3 className="text-lg font-bold">Are you sure?</h3>
            <p className="text-gray-400">This action cannot be undone.</p>
            <div className="mt-4 flex justify-center gap-4">
              <button onClick={() => setModalOpen2(false)} className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600 transition">
                Cancel
              </button>
              <button onClick={deleteListing} className="bg-red-600 px-4 py-2 rounded hover:bg-red-700 transition">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <motion.div 
            initial={{ opacity: 0, y: -50 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -50 }} 
            className="bg-gray-800 p-6 rounded-lg w-96 border border-gray-700 shadow-xl"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Edit Listing</h2>
              <button 
                onClick={closeModal}
                className="text-gray-400 hover:text-white"
              >
                <FaTimes />
              </button>
            </div>
            
            <input 
              type="text" 
              placeholder="Title" 
              className="w-full p-2 mb-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-orange-500 focus:outline-none" 
              value={editForm.title} 
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} 
            />

            <textarea 
              placeholder="Description" 
              className="w-full p-2 mb-3 bg-gray-700 text-white rounded resize-none border border-gray-600 focus:border-orange-500 focus:outline-none" 
              rows="3"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            />

              <input 
                type="number" 
                placeholder="Price (€)" 
                className="w-full p-2 mb-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-orange-500 focus:outline-none" 
                value={editForm.price} 
                onChange={(e) => {
                  const price = e.target.value.replace(/[^0-9.]/g, '');
                  if (parseFloat(price) > 10000000000) {
                    toast.error("⚠ Price cannot exceed 10,000,000,000!");
                    return;
                  }
                  setEditForm({ ...editForm, price });
                }}
              />

            <select 
              className="w-full p-2 mb-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-orange-500 focus:outline-none" 
              value={editForm.country} 
              onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
            >
              <option value="Riga">Riga</option>
              <option value="Lavantal">Lavantal</option>
            </select>

            {/* Action Buttons */}
            <div className="flex justify-between mt-4">
              <button 
                className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600 transition border border-gray-600" 
                onClick={closeModal}
              >
                Cancel
              </button>
              <button 
                className="bg-orange-500 px-4 py-2 rounded hover:bg-orange-600 transition" 
                onClick={handleEditSubmit}
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}
      <h2 className="text-4xl font-bold mb-8 text-orange-500">Dashboard</h2>
      <h3 className="text-2xl">Welcome, {user.username}!</h3>

      <div className="relative mt-4">
        <Image src={user.avatar} width={100} height={100} className="rounded-md border-2 border-orange-500" alt="User Avatar" />
        <div className="absolute -bottom-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-md">
          Player
        </div>
      </div>

      {/* Listing Form */}
      <motion.div className="w-full max-w-2xl p-6 bg-gray-800 border border-gray-700 shadow-lg rounded-lg mt-8">
        <h2 className="text-xl font-semibold mb-4 text-orange-500">{editingId ? "Edit Listing" : "Create a Listing"}</h2>
        
        {/* Title Input */}
        <input 
          type="text" 
          placeholder="Title" 
          className="w-full p-3 mb-4 bg-gray-700 text-white rounded border border-gray-600 focus:border-orange-500 focus:outline-none" 
          value={form.title} 
          onChange={(e) => setForm({ ...form, title: e.target.value })} 
        />

        {/* Description Input */}
        <textarea 
          placeholder="Description"
          className="w-full p-3 mb-4 bg-gray-700 text-white rounded resize-none border border-gray-600 focus:border-orange-500 focus:outline-none"
          rows="4"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        {/* Price Input */}
        <input 
          type="number" 
          placeholder="Price (€)" 
          className="w-full p-3 mb-4 bg-gray-700 text-white rounded border border-gray-600 focus:border-orange-500 focus:outline-none" 
          value={form.price} 
          onChange={(e) => setForm({ ...form, price: e.target.value })} 
          required
        />

        {/* Country Dropdown */}
        <select 
          className="w-full p-3 mb-4 bg-gray-700 text-white rounded border border-gray-600 focus:border-orange-500 focus:outline-none" 
          value={form.country} 
          onChange={(e) => setForm({ ...form, country: e.target.value })}
          required
        >
          <option value="Riga">Riga</option>
          <option value="Lavantal">Lavantal</option>
        </select>

        {/* Image Upload Input (Max 5) */}
        <div className="mb-4">
          <label className="block mb-2 text-gray-300">Upload Images (Max 10)</label>
          <div className="flex items-center">
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              onChange={handleFileChange}
              className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-orange-500 file:text-white hover:file:bg-orange-600"
            />
          </div>
          <p className="text-sm text-gray-400 mt-1">Max 10 images allowed</p>
        </div>

        {/* Image Preview Section */}
        <div className="grid grid-cols-6 gap-1 mt-3">
          {imageFiles.map((file, index) => {
            const previewUrl = URL.createObjectURL(file);

            return (
              <div key={index} className="relative">
                <Image src={previewUrl} width={100} height={80} alt="Preview" className="rounded border border-gray-700" />
                
                {/* Remove Image Button (Top Left Corner) */}
                <button 
                  className="absolute top-0 left-0 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700 transition"
                  onClick={() => removeImage(index)}
                >
                  ✖
                </button>
              </div>
            );
          })}
        </div>

        {/* Submit Button */}
        <button 
          onClick={handleListing} 
          className="w-full p-3 bg-orange-500 mt-4 rounded hover:bg-orange-600 transition flex items-center justify-center"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            editingId ? "Update Listing" : "Create Listing"
          )}
        </button>
      </motion.div>

      {/* Active Listings */}
      <h2 className="text-3xl font-bold mt-12 text-orange-500">Your Active Listings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {listings.length > 0 ? (
          listings.map((listing) => (
            <div key={listing.$id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-orange-500 transition-all duration-200 shadow-lg">
              {/* Display First Image (or Default) */}
              <div className="relative">
                <Image 
                  src={listing.imageUrls?.[0] || "/example.jpg"} 
                  width={400} 
                  height={300} 
                  alt={listing.title} 
                  className="w-full h-40 object-cover rounded-lg"
                />
                <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded-md font-bold">
                  {listing.price}€
                </div>
              </div>
              
              <h3 className="text-lg mt-3 font-semibold">{listing.title}</h3>
              <p className="text-gray-400 text-sm mt-1">{listing.description.substring(0, 60)}...</p>
              
              {/* Show All Uploaded Images in a Grid */}
              <div className="grid grid-cols-5 gap-1 mt-3">
                {listing.imageUrls?.map((url, index) => (
                  <Image key={index} src={url} width={100} height={80} alt="Listing Image" className="rounded border border-gray-700 hover:border-orange-500 transition-all duration-200"/>
                ))}
              </div>

              <div className="flex justify-between mt-4 pt-3 border-t border-gray-700">
                <button 
                  onClick={() => confirmDelete(listing.$id)} 
                  className="flex items-center text-red-500 hover:text-red-400 transition"
                >
                  <FaTrash className="mr-1" /> Delete
                </button>
                <button 
                  className="flex items-center text-orange-500 hover:text-orange-400 transition" 
                  onClick={() => openEditModal(listing)}
                >
                  <FaEdit className="mr-1" /> Edit
                </button>
              </div>

              {listing.buyerUUID ? (
                <div className="mt-4 p-4 bg-gray-700 rounded-lg border-l-4 border-green-500">
                  <p className="text-green-400 font-semibold flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    Sold to: {listing.buyerUsername}
                  </p>
                  <p className="text-sm text-gray-300 mt-1">Transaction Date: {new Date(listing.purchaseDate).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-300">Receipt Code: {listing.receiptCode}</p>
                </div>
              ) : (
                <p className="text-gray-300 mt-4 flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  Available for sale
                </p>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-8 bg-gray-800 rounded-lg border border-gray-700">
            <div className="w-16 h-16 mx-auto bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <FaHome className="text-gray-500 text-xl" />
            </div>
            <p className="text-gray-400 mb-4">No active listings yet.</p>
            <p className="text-sm text-gray-500">Create your first listing using the form above.</p>
          </div>
        )}
      </div>

      {/* Purchased Properties Section */}
      <h2 className="text-3xl font-bold mt-12 text-orange-500">Your Purchased Properties</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 w-full max-w-7xl">
        {purchases.length > 0 ? (
          purchases.map((purchase) => (
            <div key={purchase.$id} className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 hover:border-orange-500 transition-all duration-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">{purchase.shopname}</h3>
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                  Confirmed
                </span>
              </div>

              <div className="space-y-2 text-gray-300">
                <p className="flex items-center">
                  <span className="font-semibold mr-2">Seller:</span> {purchase.seller}
                </p>
                <p className="flex items-center">
                  <span className="font-semibold mr-2">Price:</span> 
                  <span className="text-orange-500 font-bold">{purchase.price}€</span>
                </p>
                <p className="flex items-center">
                  <span className="font-semibold mr-2">Purchase Date:</span>{" "}
                  {new Date(purchase.$createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Receipt/Details Button */}
              <Link 
                href={`/receipt/${purchase.$id}`}
                className="mt-4 bg-orange-500 text-white px-4 py-2 rounded block text-center hover:bg-orange-600 transition"
              >
                View Receipt
              </Link>

              {/* Seller Contact Info */}
              <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                <h4 className="font-semibold mb-2 text-gray-200">Seller Contact</h4>
                <p className="text-sm text-gray-300 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-orange-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                  </svg>
                  Minecraft Username: {purchase.seller}
                </p>
                <p className="text-sm text-gray-300 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-orange-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm8 8v2h1v-2h-1zm-2-6H7v2h6V7zm0 4H7v2h6v-2zm-6 4h6v2H7v-2z" clipRule="evenodd"></path>
                  </svg>
                  UUID: {purchase.sellerUUID}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
            <div className="w-16 h-16 mx-auto bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <p className="text-gray-400 mb-4">You haven't purchased any properties yet.</p>
            <Link 
              href="/listings" 
              className="text-orange-500 hover:text-orange-400 mt-2 inline-block border border-orange-500 px-4 py-2 rounded-lg"
            >
              Browse Available Properties
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}