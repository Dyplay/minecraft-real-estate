"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../../../lib/appwrite"; // ✅ Ensure db is correctly imported
import Image from "next/image";

export default function ListingPage() {
  const router = useRouter();
  const { id } = useParams(); // ✅ Correct way to get `id` in Next.js 15+

  const [listing, setListing] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      console.error("🚨 No ID found in params.");
      return;
    }

    async function fetchData() {
      try {
        console.log("🔄 Fetching listing data for ID:", id);

        // ✅ Fetch listing from database
        const listingData = await db.getDocument(
          "67a8e81100361d527692", // ✅ Replace with your actual DB ID
          "67b2fdc20027f4d55440", // ✅ Replace with your actual Collection ID
          id
        );

        if (!listingData) {
          console.warn("⚠ Listing not found in database.");
          return;
        }

        setListing(listingData);

        // ✅ Fetch seller info
        console.log("🔄 Fetching seller data for UUID:", listingData.sellerUUID);

        const sellerData = await db.getDocument(
          "67a8e81100361d527692",
          "67a900dc003e3b7524ee",
          listingData.sellerUUID
        );

        if (!sellerData) {
          console.warn("⚠ Seller data not found.");
        } else {
          setSeller(sellerData);
        }
      } catch (error) {
        console.error("🚨 Error fetching listing:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]); // ✅ Runs when `id` changes

  if (loading) return <p>Loading...</p>;
  if (!listing) return <p>Listing not found.</p>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">{listing.title}</h1>
      <p className="mt-2">{listing.description}</p>
      <p className="text-xl text-blue-600 font-semibold mt-4">Price: {listing.price}€</p>

      {/* 🔹 Seller Profile */}
      {seller && (
        <div className="flex items-center mt-6">
          <Image
            src={`https://crafthead.net/avatar/${seller.uuid}`}
            width={48}
            height={48}
            className="rounded-full"
            alt="Seller Avatar"
          />
          <div className="ml-3">
            <p className="text-lg font-semibold">{seller.username}</p>
            <p className="text-sm text-gray-400">UUID: {seller.uuid}</p>
          </div>
        </div>
      )}

      {/* 🔹 Action Buttons */}
      <div className="mt-6 space-x-4">
        <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition">Buy</button>
        <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition">Rent</button>
      </div>
    </div>
  );
}