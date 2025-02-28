"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, Query, account } from "../../../../lib/appwrite";
import Image from "next/image";
import { FaCheckCircle, FaMapMarkerAlt, FaStar, FaStarHalf, FaRegStar } from "react-icons/fa";
import { motion } from "framer-motion";
import Link from "next/link";
import { useTrustedSellers } from "../../components/TrustedSellersProvider";
import { Tooltip } from "react-tooltip";

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const verifiedSellers = useTrustedSellers();
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    async function fetchProfileData() {
      try {
        // Find user in database using sessionId from URL
        const userResponse = await db.listDocuments(
          "67a8e81100361d527692",
          "67a900dc003e3b7524ee",
          [Query.equal("sessionId", params.id)]
        );

        if (userResponse.documents.length === 0) {
          setError("User not found");
          setLoading(false);
          return;
        }

        const userData = userResponse.documents[0];
        setUser(userData);

        // Fetch user's listings
        const listingsResponse = await db.listDocuments(
          "67a8e81100361d527692",
          "67b2fdc20027f4d55440",
          [Query.equal("sellerUUID", userData.uuid)]
        );

        setListings(listingsResponse.documents);

        // Fetch reviews for all user's listings
        let totalRating = 0;
        let reviewCount = 0;

        // Get all reviews for this user's listings
        for (const listing of listingsResponse.documents) {
          const reviewsResponse = await db.listDocuments(
            "67a8e81100361d527692",
            "67b2fe5b00c825b66876", // listing_reviews collection
            [Query.equal("listingId", listing.$id)]
          );

          if (reviewsResponse.documents.length > 0) {
            reviewsResponse.documents.forEach(review => {
              totalRating += review.rating;
              reviewCount++;
            });
          }
        }

        setTotalReviews(reviewCount);
        setAverageRating(reviewCount > 0 ? totalRating / reviewCount : 0);

      } catch (error) {
        console.error("Error fetching profile data:", error);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchProfileData();
    }
  }, [params.id]);

  function formatPrice(price) {
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(price);
  }

  // Function to render stars based on rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} className="text-orange-500" />);
    }

    // Add half star if needed
    if (hasHalfStar) {
      stars.push(<FaStarHalf key="half" className="text-orange-500" />);
    }

    // Add empty stars
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="text-orange-500" />);
    }

    return stars;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-700 text-center">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{error}</h2>
          <p className="text-gray-400 mb-4">We couldn't find the profile you're looking for.</p>
          <Link 
            href="/"
            className="inline-block bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition"
          >
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
        <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
          <div className="flex items-center">
            <div className="relative">
              <Image 
                src={`https://crafthead.net/helm/${user.uuid}`}
                width={100}
                height={100}
                alt="Profile Picture"
                className="rounded-lg border-4 border-orange-500"
              />
              {verifiedSellers.includes(user.uuid) && (
                <div className="absolute -bottom-2 -right-2 bg-orange-500 rounded-full p-1">
                  <FaCheckCircle className="text-white text-xl" />
                </div>
              )}
            </div>
            <div className="ml-6">
              <div className="flex items-center">
                <h1 className="text-3xl font-bold">{user.username}</h1>
                {verifiedSellers.includes(user.uuid) && (
                  <Tooltip id="verified-seller" className="bg-gray-800 text-white border border-gray-700">
                    Verified Seller
                  </Tooltip>
                )}
              </div>
              <p className="text-gray-400 mt-1">Member since {new Date(user.$createdAt).toLocaleDateString()}</p>
              <div className="flex items-center mt-2">
                <div className="flex items-center">
                  {renderStars(averageRating)}
                </div>
                <span className="ml-2 text-gray-400">
                  {averageRating.toFixed(1)} ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
                </span>
              </div>
              {verifiedSellers.includes(user.uuid) && (
                <p className="text-orange-500 font-medium mt-1">Trusted Seller</p>
              )}
            </div>
          </div>
        </div>

        {/* Listings Section */}
        <h2 className="text-2xl font-bold mb-6">Listed Properties</h2>
        {listings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <motion.div
                key={listing.$id}
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.2 }}
                className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-orange-500"
              >
                <Link href={`/listing/${listing.$id}`}>
                  <div className="relative">
                    <Image
                      src={listing.imageUrls?.[0] || "/example.jpg"}
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
                    <h3 className="text-xl font-semibold">{listing.title}</h3>
                    <p className="text-gray-400 mt-2">{listing.description.substring(0, 100)}...</p>
                    {listing.country && (
                      <div className="flex items-center mt-2 text-gray-400">
                        <FaMapMarkerAlt className="text-orange-500 mr-1" />
                        <span>{listing.country}</span>
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
            <div className="w-16 h-16 mx-auto bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">No Listings Yet</h3>
            <p className="text-gray-400">This user hasn't posted any properties yet.</p>
          </div>
        )}
      </div>
    </div>
  );
} 