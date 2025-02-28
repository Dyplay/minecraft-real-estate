"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db, Query, account } from "../../../../lib/appwrite";
import Image from "next/image";
import { FaCheckCircle, FaPencilAlt, FaStar, FaMapMarkerAlt } from "react-icons/fa";
import Link from "next/link";
import { useTrustedSellers } from "../../components/TrustedSellersProvider";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const verifiedSellers = useTrustedSellers();

  function formatPrice(price) {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const session = await account.get();
        setCurrentUser(session);

        // Get user data
        const userResponse = await db.listDocuments(
          "67a8e81100361d527692",
          "67a900dc003e3b7524ee",
          [Query.equal("uuid", id)]
        );

        if (userResponse.documents.length === 0) {
          setLoading(false);
          return;
        }

        const userData = userResponse.documents[0];
        
        // Fetch Minecraft username
        const mcResponse = await fetch(`https://rigabank.dyplay.at/api/uuid?uuid=${userData.uuid}`);
        const mcData = await mcResponse.json();
        
        // Fetch user's listings
        const listingsResponse = await db.listDocuments(
          "67a8e81100361d527692",
          "67b2fdc20027f4d55440",
          [Query.equal("sellerUUID", userData.uuid)]
        );
        
        // Calculate average rating from reviews
        let totalRating = 0;
        let reviewCount = 0;
        
        for (const listing of listingsResponse.documents) {
          const reviewsResponse = await db.listDocuments(
            "67a8e81100361d527692",
            "listing_reviews",
            [Query.equal("listingID", listing.$id)]
          );
          
          reviewsResponse.documents.forEach(review => {
            totalRating += review.rating;
            reviewCount++;
          });
        }

        setUser({
          ...userData,
          mcUsername: mcData.name
        });
        setListings(listingsResponse.documents);
        setTotalReviews(reviewCount);
        setAverageRating(reviewCount > 0 ? totalRating / reviewCount : 0);

      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold">User not found</h2>
          <p className="text-gray-400 mt-2">The user you're looking for doesn't exist or hasn't completed registration.</p>
          <Link href="/" className="text-orange-500 hover:text-orange-400 mt-4 inline-block">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Profile Header */}
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* Banner */}
          <div className="h-40 bg-gradient-to-r from-gray-700 to-gray-600"></div>
          
          {/* Profile Info */}
          <div className="relative px-6 pb-6">
            <div className="flex items-center">
              {/* Avatar */}
              <div className="relative -mt-16">
                <Image
                  src={`https://crafthead.net/helm/${user.uuid}`}
                  width={128}
                  height={128}
                  alt="Profile Picture"
                  className="rounded-lg border-4 border-gray-900 shadow-xl"
                />
                {verifiedSellers.includes(user.uuid) && (
                  <div className="absolute -bottom-2 -right-2 bg-orange-500 rounded-full p-1">
                    <FaCheckCircle className="text-white text-xl" />
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="ml-6 pt-6">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold">{user.mcUsername}</h1>
                  {verifiedSellers.includes(user.uuid) && (
                    <span className="bg-orange-500 text-sm px-2 py-1 rounded-full">Trusted Seller</span>
                  )}
                </div>
                <p className="text-gray-400 mt-1">Member since {new Date(user.$createdAt).toLocaleDateString()}</p>
                <div className="flex items-center mt-2">
                  <div className="flex items-center text-orange-500">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        className={i < Math.floor(averageRating) ? "text-orange-500" : "text-gray-600"}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-gray-300">
                    {averageRating.toFixed(1)} ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Listings Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-6">Listed Properties ({listings.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <motion.div
                key={listing.$id}
                whileHover={{ scale: 1.02 }}
                className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-orange-500 transition-all"
              >
                <Link href={`/listing/${listing.$id}`}>
                  <div className="relative">
                    <Image
                      src={listing.imageUrls[0]}
                      width={400}
                      height={300}
                      alt={listing.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-orange-500 text-white px-3 py-1 rounded-md">
                      {formatPrice(listing.price)}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-xl font-semibold mb-2">{listing.title}</h3>
                    <p className="text-gray-400 text-sm mb-2">{listing.description.substring(0, 100)}...</p>
                    <div className="flex items-center text-gray-400">
                      <FaMapMarkerAlt className="text-orange-500 mr-1" />
                      <span>{listing.country || "Location not specified"}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
          {listings.length === 0 && (
            <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
              <p className="text-gray-400">No properties listed yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 