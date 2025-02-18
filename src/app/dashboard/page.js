"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db, account, ID, Query, storage } from "../../../lib/appwrite";
import { motion } from "framer-motion";
import { FaPlusCircle, FaSpinner, FaTrash, FaEdit, FaImages } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    country: "Riga", // Default selection
    type: "buy",
  });

  const router = useRouter();
  const bucketId = "67b2fe15002b214adfba"; // ✅ Replace with your Appwrite Storage Bucket ID
  const allowedCountries = ["Riga", "Lavantal"]; // ✅ Allowed Country List

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

  // ✅ Upload images and return their public URLs
  async function uploadImages() {
    const uploadedImageUrls = [];

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

    return uploadedImageUrls;
  }

  // ✅ Create or Update Listing
  async function handleListing() {
    if (!user || !user.uuid) {
      alert("⚠ User not found!");
      return;
    }

    if (!form.title || !form.description || !form.price || !form.country) {
      alert("⚠ Please fill in all fields!");
      return;
    }

    setSubmitting(true);
    const documentId = editingId || ID.unique();

    try {
      const uploadedImages = await uploadImages(); // ✅ Upload images first

      const listingData = {
        sellerUUID: user.uuid,
        title: form.title,
        description: form.description,
        price: parseFloat(form.price),
        country: form.country,
        type: form.type,
        imageUrls: uploadedImages,
      };

      if (isNaN(listingData.price)) {
        alert("⚠ Price must be a valid number!");
        setSubmitting(false);
        return;
      }

      if (editingId) {
        await db.updateDocument("67a8e81100361d527692", "67b2fdc20027f4d55440", editingId, listingData);
        alert("✅ Listing updated successfully!");
      } else {
        await db.createDocument("67a8e81100361d527692", "67b2fdc20027f4d55440", documentId, listingData);
        alert("✅ Listing created successfully!");
      }

      setEditingId(null);
      setImageFiles([]);
      setForm({ title: "", description: "", price: "", country: "Riga", type: "buy" });

      const response = await db.listDocuments("67a8e81100361d527692", "67b2fdc20027f4d55440", [
        Query.equal("sellerUUID", user.uuid),
      ]);
      setListings(response.documents);
    } catch (error) {
      console.error("🚨 Error handling listing:", error);
      alert("❌ Failed to process listing. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ✅ Delete Listing
  async function deleteListing(id) {
    if (!confirm("Are you sure you want to delete this listing?")) return;

    try {
      await db.deleteDocument("67a8e81100361d527692", "67b2fdc20027f4d55440", id);
      setListings((prev) => prev.filter((listing) => listing.$id !== id));
      alert("✅ Listing deleted successfully!");
    } catch (error) {
      console.error("🚨 Error deleting listing:", error);
      alert("❌ Failed to delete listing.");
    }
  }

  // ✅ Handle file input change
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files.slice(0, 5));
  };

  if (loading) {
    return <p className="text-center text-white">🔄 Loading session...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
      <h2 className="text-4xl font-bold mb-8">Dashboard</h2>
      <h3 className="text-2xl">Welcome, {user.username}!</h3>

      <Image src={user.avatar} width={100} height={100} className="mt-4 rounded-md" alt="User Avatar" />

      {/* Listing Form */}
      <motion.div className="w-full max-w-2xl p-6 bg-gray-800 border border-gray-700 shadow-lg rounded-lg mt-8">
        <h2 className="text-xl font-semibold mb-4">{editingId ? "Edit Listing" : "Create a Listing"}</h2>
        <input type="text" placeholder="Title" className="w-full p-3 mb-4 bg-gray-700 text-white" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input type="number" placeholder="Price (€)" className="w-full p-3 mb-4 bg-gray-700 text-white" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />

        {/* Country Dropdown */}
        <select className="w-full p-3 mb-4 bg-gray-700 text-white" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
          {allowedCountries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>

        <textarea placeholder="Description" className="w-full p-3 mb-4 bg-gray-700 text-white" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input type="file" multiple accept="image/*" onChange={handleFileChange} />
        <p className="text-sm text-gray-400 mt-1">Max 5 images allowed</p>
        <button onClick={handleListing} className="w-full p-3 bg-blue-500 mt-4 rounded">{submitting ? "Processing..." : editingId ? "Update Listing" : "Create Listing"}</button>
      </motion.div>
    </div>
  );
}