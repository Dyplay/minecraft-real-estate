"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db, account, ID, Query, storage } from "../../../lib/appwrite";
import { motion } from "framer-motion";
import { FaTrash, FaEdit, FaImages } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaTimes } from "react-icons/fa"; // Import close icon for modals
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
      } catch (error) {
        console.error("🚨 Error fetching user data:", error);
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

  return uploadedImageUrls.slice(0, 5); // ✅ Ensure max 5 images
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
      const allFiles = [...prevFiles, ...newFiles].slice(0, 5); // ✅ Append new files, keep max 5
      return allFiles;
    });
  };   

  if (loading) {
    return <p className="text-center text-white">🔄 Loading session...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
      <ToastContainer
          position="bottom-left" // ✅ Set toast position
          autoClose={3000} // Close after 3 seconds
          hideProgressBar={false} 
          newestOnTop={true}
          closeOnClick
          pauseOnHover
          draggable
          theme="dark"
      />
      {/* Delete Confirmation Modal */}
      {modalOpen2 && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
            <h3 className="text-lg font-bold">Are you sure?</h3>
            <p className="text-gray-400">This action cannot be undone.</p>
            <div className="mt-4 flex justify-center gap-4">
              <button onClick={() => setModalOpen2(false)} className="bg-gray-600 px-4 py-2 rounded">
                Cancel
              </button>
              <button onClick={deleteListing} className="bg-red-600 px-4 py-2 rounded">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <motion.div 
            initial={{ opacity: 0, y: -50 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -50 }} 
            className="bg-gray-900 p-6 rounded-lg w-96"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Edit Listing</h2>
            
            <input 
              type="text" 
              placeholder="Title" 
              className="w-full p-2 mb-3 bg-gray-800 text-white rounded" 
              value={editForm.title} 
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} 
            />

            <textarea 
              placeholder="Description" 
              className="w-full p-2 mb-3 bg-gray-800 text-white rounded resize-none" 
              rows="3"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            />

              <input 
                type="number" 
                placeholder="Price (€)" 
                className="w-full p-2 mb-3 bg-gray-800 text-white rounded" 
                value={editForm.price} 
                onChange={(e) => {
                  const price = e.target.value.replace(/[^0-9.]/g, ''); // ✅ Allow only numbers & dots
                  if (parseFloat(price) > 10000000000) {
                    toast.error("⚠ Price cannot exceed 10,000,000,000!");
                    return;
                  }
                  setEditForm({ ...editForm, price });
                }}
              />

            <select 
              className="w-full p-2 mb-3 bg-gray-800 text-white rounded" 
              value={editForm.country} 
              onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
            >
              <option value="Riga">Riga</option>
              <option value="Lavantal">Lavantal</option>
            </select>

            {/* Action Buttons */}
            <div className="flex justify-between mt-4">
              <button 
                className="bg-red-500 px-4 py-2 rounded hover:bg-red-600 transition" 
                onClick={closeModal}
              >
                Cancel
              </button>
              <button 
                className="bg-green-500 px-4 py-2 rounded hover:bg-green-600 transition" 
                onClick={handleEditSubmit}
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}
      <h2 className="text-4xl font-bold mb-8">Dashboard</h2>
      <h3 className="text-2xl">Welcome, {user.username}!</h3>

      <Image src={user.avatar} width={100} height={100} className="mt-4 rounded-md" alt="User Avatar" />

      {/* Listing Form */}
      <motion.div className="w-full max-w-2xl p-6 bg-gray-800 border border-gray-700 shadow-lg rounded-lg mt-8">
  <h2 className="text-xl font-semibold mb-4">{editingId ? "Edit Listing" : "Create a Listing"}</h2>
  
  {/* Title Input */}
  <input 
    type="text" 
    placeholder="Title" 
    className="w-full p-3 mb-4 bg-gray-700 text-white rounded" 
    value={form.title} 
    onChange={(e) => setForm({ ...form, title: e.target.value })} 
  />

  {/* Description Input */}
  <textarea 
    placeholder="Description"
    className="w-full p-3 mb-4 bg-gray-700 text-white rounded resize-none"
    rows="4"
    value={form.description}
    onChange={(e) => setForm({ ...form, description: e.target.value })}
  />

  {/* Price Input */}
  <input 
    type="number" 
    placeholder="Price (€)" 
    className="w-full p-3 mb-4 bg-gray-700 text-white rounded" 
    value={form.price} 
    onChange={(e) => setForm({ ...form, price: e.target.value })} 
    required
  />

  {/* Country Dropdown */}
  <select 
    className="w-full p-3 mb-4 bg-gray-700 text-white rounded" 
    value={form.country} 
    onChange={(e) => setForm({ ...form, country: e.target.value })}
    required
  >
    <option value="Riga">Riga</option>
    <option value="Lavantal">Lavantal</option>
  </select>

  {/* Image Upload Input (Max 5) */}
  {/* Image Upload Input (Max 5) */}
  <label className="block mb-2 text-gray-300">Upload Images (Max 5)</label>
  <input 
    type="file" 
    multiple 
    accept="image/*" 
    onChange={handleFileChange} 
  />
  <p className="text-sm text-gray-400 mt-1">Max 5 images allowed</p>

 {/* Image Preview Section */}
<div className="grid grid-cols-6 gap-1 mt-3">
  {imageFiles.map((file, index) => {
    const previewUrl = URL.createObjectURL(file); // ✅ Generate preview URL

    return (
      <div key={index} className="relative">
        <Image src={previewUrl} width={100} height={80} alt="Preview" className="rounded" />
        
        {/* Remove Image Button (Top Right Corner) */}
        <button 
          className="absolute top-0 left-0 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center"
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
    className="w-full p-3 bg-blue-500 mt-4 rounded hover:bg-blue-600 transition"
  >
    {submitting ? "Processing..." : editingId ? "Update Listing" : "Create Listing"}
  </button>
</motion.div>

      {/* Active Listings */}
      <h2 className="text-3xl font-bold mt-12">Your Active Listings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {listings.length > 0 ? (
          listings.map((listing) => (
            <div key={listing.$id} className="bg-gray-800 p-4 rounded">
              {/* Display First Image (or Default) */}
              <Image 
                src={listing.imageUrls?.[0] || "/example.jpg"} 
                width={400} 
                height={300} 
                alt={listing.title} 
                className="w-full h-40 object-cover rounded"
              />
              <h3 className="text-lg mt-2">{listing.title}</h3>
              <p className="text-blue-500 font-bold">{listing.price}€</p>
              
              {/* ✅ Show All Uploaded Images in a Grid */}
              <div className="grid grid-cols-3 gap-2 mt-3">
                {listing.imageUrls?.map((url, index) => (
                  <Image key={index} src={url} width={100} height={80} alt="Listing Image" className="rounded"/>
                ))}
              </div>

              <div className="flex justify-between mt-3">
                <button onClick={() => confirmDelete(listing.$id)} className="text-red-500">
                  ❌ Delete
                </button>
                <button 
                  className="text-yellow-500" 
                  onClick={() => openEditModal(listing)}
                >
                  ✏️ Edit
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-400 mt-4">No active listings yet.</p>
        )}
      </div>
    </div>
  );
}