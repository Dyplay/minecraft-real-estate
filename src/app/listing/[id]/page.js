"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, Query, storage } from "../../../../lib/appwrite";
import Image from "next/image";

export default function ListingPage() {
  const router = useRouter();
  const { id } = useParams(); // ✅ Get ID from URL params

  const [listing, setListing] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState([]); // ✅ Store image URLs
  const [currentImage, setCurrentImage] = useState(null); // ✅ Track selected image

  useEffect(() => {
    if (!id) {
      console.error("🚨 No ID found in params.");
      return;
    }

    console.log("🚀 Listing ID from URL:", id);

    async function fetchData() {
      try {
        console.log("🔄 Fetching listing data for ID:", id);

        const listingData = await db.getDocument(
          "67a8e81100361d527692", // Your DB ID
          "67b2fdc20027f4d55440", // Your Collection ID
          id
        );

        console.log("✅ Listing data:", listingData);
        setListing(listingData);

        // ✅ Fetch images from storage
        if (listingData.imageUrls && listingData.imageUrls.length > 0) {
          console.log("📸 Fetching image URLs for:", listingData.imageUrls);

          setImageUrls(listingData.imageUrls);
          setCurrentImage(listingData.imageUrls[0]); // ✅ Set first image as default
        }

        // ✅ Fetch seller data
        console.log("🔄 Fetching seller data for UUID:", listingData.sellerUUID);

        const sellerResponse = await db.listDocuments(
          "67a8e81100361d527692",
          "67a900dc003e3b7524ee",
          [Query.equal("uuid", listingData.sellerUUID)]
        );

        if (sellerResponse.documents.length === 0) {
          console.error("❌ Seller UUID not found in database!");
          return;
        }

        const sellerData = sellerResponse.documents[0];
        console.log("✅ Seller data:", sellerData);
        setSeller(sellerData);
      } catch (error) {
        console.error("🚨 Error fetching listing:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (!listing) return <p>Listing not found.</p>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">{listing.title}</h1>
      <p className="mt-2">{listing.description}</p>
      <p className="text-xl text-blue-600 font-semibold mt-4">Price: {listing.price}€</p>

      {/* 🔹 Image Carousel */}
      {imageUrls.length > 0 && (
        <div className="mt-6">
          {/* Main Image Display */}
          <div className="w-full flex justify-center">
            <Image
              src={currentImage}
              width={600}
              height={400}
              alt="Main Listing Image"
              className="rounded-lg shadow-lg object-cover"
            />
          </div>

          {/* Thumbnail Navigation */}
          <div className="mt-4 flex justify-center gap-4">
            {imageUrls.map((url, index) => (
              <Image
                key={index}
                src={url}
                width={100}
                height={70}
                alt={`Thumbnail ${index + 1}`}
                className={`cursor-pointer rounded-lg shadow-md transition ${
                  currentImage === url ? "border-4 border-blue-500" : "opacity-75"
                }`}
                onClick={() => setCurrentImage(url)} // ✅ Click to change main image
              />
            ))}
          </div>
        </div>
      )}

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
        <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition">
          Buy
        </button>
        <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition">
          Rent
        </button>
      </div>
    </div>
  );
}