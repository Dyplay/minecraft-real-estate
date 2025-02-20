"use client";

import { useEffect, useState } from "react";
import { db, Query } from "../../../lib/appwrite";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FaTimes, FaFilter } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Skeleton from "./Skeleton";

export default function Listings() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [listings, setListings] = useState([]);
  const [sellers, setSellers] = useState({});
  const [totalListings, setTotalListings] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // ✅ Extract filters from URL
  const [filters, setFilters] = useState({
    searchQuery: searchParams.get("search") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    country: searchParams.get("country") || "",
    type: searchParams.get("type") || "",
  });

  const [hasUpdatedFilters, setHasUpdatedFilters] = useState(false);

  useEffect(() => {
    if (!hasUpdatedFilters) return;

    // ✅ Prevent infinite loop: Only update the URL when filters change
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    router.replace(`/listings?${params.toString()}`, { scroll: false });
  }, [filters, hasUpdatedFilters, router]);

  useEffect(() => {
    async function fetchListings() {
      try {
        let filterConditions = [];

        if (filters.searchQuery) {
          filterConditions.push(
            Query.or([
              Query.contains("title", filters.searchQuery),
              Query.contains("description", filters.searchQuery),
            ])
          );
        }
        if (filters.minPrice) {
          filterConditions.push(Query.greaterThanEqual("price", Number(filters.minPrice)));
        }
        if (filters.maxPrice) {
          filterConditions.push(Query.lessThanEqual("price", Number(filters.maxPrice)));
        }
        if (filters.country) {
          filterConditions.push(Query.equal("country", filters.country));
        }
        if (filters.type) {
          filterConditions.push(Query.equal("type", filters.type));
        }

        const response = await db.listDocuments(
          "67a8e81100361d527692",
          "67b2fdc20027f4d55440",
          filterConditions
        );

        setListings(response.documents);
        setTotalListings(response.documents.length);

        const sellerUUIDs = [...new Set(response.documents.map((listing) => listing.sellerUUID))];
        if (sellerUUIDs.length > 0) {
          const sellerData = {};
          await Promise.all(
            sellerUUIDs.map(async (uuid) => {
              try {
                const sellerResponse = await db.listDocuments(
                  "67a8e81100361d527692",
                  "67a900dc003e3b7524ee",
                  [Query.equal("uuid", uuid)]
                );
                if (sellerResponse.documents.length > 0) {
                  sellerData[uuid] = sellerResponse.documents[0];
                }
              } catch (error) {
                console.error(`❌ Error fetching seller for UUID ${uuid}:`, error);
              }
            })
          );
          setSellers(sellerData);
        }
      } catch (error) {
        console.error("❌ Error fetching listings:", error);
      }
    }

    fetchListings();
  }, [filters]);

  // ✅ Update filters without causing infinite loops
  const updateFilter = (key, value) => {
    setFilters((prevFilters) => ({ ...prevFilters, [key]: value }));
    setHasUpdatedFilters(true);
  };

  const removeFilter = (key) => {
    setFilters((prevFilters) => ({ ...prevFilters, [key]: "" }));
    setHasUpdatedFilters(true);
  };

  function formatPrice(price) {
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(price);
  }

  return (
    <div className="p-10">
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 right-0 h-full w-72 bg-gray-900 text-white shadow-lg p-6"
          >
            <h3 className="text-xl font-bold mb-4">Filters</h3>
            <div className="mb-4">
              <label className="block mb-1">Min Price (€)</label>
              <input
                type="number"
                className="w-full p-2 rounded-lg text-black"
                value={filters.minPrice}
                onChange={(e) => updateFilter("minPrice", e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1">Max Price (€)</label>
              <input
                type="number"
                className="w-full p-2 rounded-lg text-black"
                value={filters.maxPrice}
                onChange={(e) => updateFilter("maxPrice", e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1">Country</label>
              <select
                className="w-full p-2 rounded-lg text-black"
                value={filters.country}
                onChange={(e) => updateFilter("country", e.target.value)}
              >
                <option value="">All</option>
                <option value="Riga">Riga</option>
                <option value="Lavantal">Lavantal</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-1">Type</label>
              <select
                className="w-full p-2 rounded-lg text-black"
                value={filters.type}
                onChange={(e) => updateFilter("type", e.target.value)}
              >
                <option value="">All</option>
                <option value="buy">Buy</option>
                <option value="rent">Rent</option>
              </select>
            </div>
            <button onClick={() => setShowFilters(false)} className="w-full mt-4 p-3 bg-red-600 text-white rounded-lg">
              Close Filters
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Listings</h2>
        <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg">
          <FaFilter /> Filters
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(filters)
          .filter(([_, value]) => value)
          .map(([key, value]) => (
            <span key={key} className="bg-gray-800 text-white px-3 py-1 rounded-full flex items-center gap-2">
              {key}: {value}
              <button onClick={() => removeFilter(key)} className="hover:text-red-500 transition">
                <FaTimes />
              </button>
            </span>
          ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
        {listings.length > 0 ? (
          listings.map((listing) => (
            <motion.div key={listing.$id} whileHover={{ scale: 1.05 }} className="rounded-lg overflow-hidden shadow-lg bg-white">
              <Link href={`/listing/${listing.$id}`}>
                <Image 
                  src={listing.imageUrls?.[0] || "/example.jpg"} 
                  width={400} 
                  height={300} 
                  alt={listing.title} 
                  className="w-full h-60 object-cover" 
                />
                <div className="p-4">
                  {/* Listing Title & Description */}
                  <h3 className="font-semibold text-2xl text-black">{listing.title}</h3>
                  <p className="text-gray-500">{listing.description}</p>

                  {/* Price */}
                  <p className="text-blue-600 font-bold text-2xl mt-2">{formatPrice(listing.price)}</p>

                  {/* 🏷️ Seller Information */}
                  {sellers[listing.sellerUUID] ? (
                    <div className="flex items-center mt-4">
                      <Image 
                        src={`https://crafthead.net/helm/${sellers[listing.sellerUUID]?.uuid}`} 
                        width={40} 
                        height={40} 
                        alt="Seller Head" 
                        className="rounded-md"
                      />
                      <p className="ml-3 text-gray-700 font-semibold">
                        {sellers[listing.sellerUUID]?.username || "Unknown Seller"}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500 mt-2">Seller: Unknown</p>
                  )}
                </div>
              </Link>
            </motion.div>
          ))
        ) : (
          <p className="text-gray-500 mt-4">No listings found.</p>
        )}
      </div>
    </div>
  );
}