"use client";

import { useEffect, useState } from "react";
import { db, Query } from "../../../lib/appwrite";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FaTimes, FaFilter } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

export default function Listings() {
  const [listings, setListings] = useState([]);
  const [sellers, setSellers] = useState({});
  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    type: "",
    country: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const query = searchParams.get("search") || "";
      setSearchQuery(query);
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchListings() {
      let filterConditions = [];

      // 🔍 Full-Text Search
      if (searchQuery) {
        filterConditions.push(
          Query.or([
            Query.contains("title", searchQuery),
            Query.contains("description", searchQuery),
            Query.contains("country", searchQuery),
            Query.contains("type", searchQuery),
          ])
        );
      }

      // 💰 Price Filters
      if (filters.minPrice && !isNaN(filters.minPrice)) {
        filterConditions.push(Query.greaterThanEqual("price", Number(filters.minPrice)));
      }
      if (filters.maxPrice && !isNaN(filters.maxPrice)) {
        filterConditions.push(Query.lessThanEqual("price", Number(filters.maxPrice)));
      }

      // 🌍 Country Filter
      if (filters.country) {
        filterConditions.push(Query.equal("country", filters.country));
      }

      // 🏡 Type Filter
      if (filters.type) {
        filterConditions.push(Query.equal("type", filters.type));
      }

      try {
        const response = await db.listDocuments(
          "67a8e81100361d527692",
          "67b2fdc20027f4d55440",
          filterConditions
        );

        console.log("✅ Fetched Listings:", response.documents);
        setListings(response.documents);

        // 📌 Fetch seller data
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
          console.log("✅ Fetched Sellers:", sellerData);
          setSellers(sellerData);
        }
      } catch (error) {
        console.error("❌ Error fetching listings:", error);
      }
    }

    fetchListings();
  }, [searchQuery, filters]);

  const removeFilter = (key) => {
    const updatedFilters = { ...filters };
    delete updatedFilters[key];
    setFilters(updatedFilters);

    const queryParams = new URLSearchParams(updatedFilters).toString();
    router.push(`/listings?${queryParams}`);
  };

  function formatPrice(price) {
    return price.toLocaleString("de-DE") + "€"; 
  }

  return (
    <div className="p-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Listings</h2>

        {/* Filter Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
        >
          <FaFilter /> Filters
        </button>
      </div>

      {/* Applied Filters */}
      <div className="flex flex-wrap gap-2 mt-4">
        {Object.keys(filters)
          .filter((key) => filters[key])
          .map((key) => (
            <span
              key={key}
              className="bg-gray-800 text-white px-3 py-1 rounded-full flex items-center gap-2"
            >
              {key}: {filters[key]}
              <button onClick={() => removeFilter(key)} className="hover:text-red-500 transition">
                <FaTimes />
              </button>
            </span>
          ))}
      </div>

      {/* Animated Filter Sidebar */}
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

            {/* Price Range */}
            <div className="mb-4">
              <label className="block mb-1">Min Price (€)</label>
              <input
                type="number"
                className="w-full p-2 rounded-lg text-black"
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1">Max Price (€)</label>
              <input
                type="number"
                className="w-full p-2 rounded-lg text-black"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              />
            </div>

            {/* Country Filter */}
            <div className="mb-4">
              <label className="block mb-1">Country</label>
              <select
                className="w-full p-2 rounded-lg text-black"
                value={filters.country}
                onChange={(e) => setFilters({ ...filters, country: e.target.value })}
              >
                <option value="">All</option>
                <option value="Riga">Riga</option>
                <option value="Lavantal">Lavantal</option>
              </select>
            </div>

            {/* Close Filter Button */}
            <button
              onClick={() => setShowFilters(false)}
              className="w-full mt-4 p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Close Filters
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
      {listings.length > 0 ? (
        listings.map((listing) => (
          <motion.div key={listing.$id} whileHover={{ scale: 1.05 }} className="rounded-lg overflow-hidden shadow-lg bg-white">
            <Link href={`/listing/${listing.$id}`}>
              <div>
                {/* Listing Image */}
                <Image 
                  src={listing.imageUrls?.[0] || "/example.jpg"} 
                  width={400} 
                  height={300} 
                  alt={listing.title} 
                  className="w-full h-60 object-cover" 
                />
                <div className="p-4">
                  {/* Title & Description */}
                  <h3 className="font-semibold text-2xl text-black">{listing.title}</h3>
                  <p className="text-gray-500">{listing.description}</p>
                  
                  {/* Price (Formatted) */}
                  <p className="text-blue-600 font-bold text-2xl mt-2">
                    {formatPrice(listing.price)} ({listing.type === "buy" ? "Selling Price" : "Rent Price"})
                  </p>

                  {/* ✅ Seller's Info (Minecraft Head + Username) */}
                  {sellers[listing.sellerUUID] && (
                    <div className="flex items-center mt-4">
                      <Image 
                        src={`https://crafthead.net/helm/${sellers[listing.sellerUUID].uuid}`}
                        width={40} 
                        height={40} 
                        alt="Seller Head"
                        className="rounded-md"
                      />
                      <p className="ml-3 text-gray-700 font-semibold">{sellers[listing.sellerUUID].username}</p>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          </motion.div>
        ))
      ) : (
        <p className="text-gray-500 mt-4">No listings found for your search.</p>
      )}
      </div>
    </div>
  );
}