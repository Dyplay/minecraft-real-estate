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
    
      if (searchQuery) {
        filterConditions.push(
          Query.search("title", searchQuery),
          Query.search("description", searchQuery),
          Query.search("seller", searchQuery),
          Query.search("country", searchQuery)
        );
      }
    
      // ✅ Ensure price filters are numbers
      if (filters.minPrice && !isNaN(filters.minPrice)) {
        filterConditions.push(Query.greaterThanEqual("price", Number(filters.minPrice)));
      }
      if (filters.maxPrice && !isNaN(filters.maxPrice)) {
        filterConditions.push(Query.lessThanEqual("price", Number(filters.maxPrice)));
      }
    
      try {
        const response = await db.listDocuments(
          "67a8e81100361d527692",
          "67b2fdc20027f4d55440",
          filterConditions
        );
        setListings(response.documents);
      } catch (error) {
        console.error("Error fetching listings:", error);
      }
    }    

    fetchListings();
  }, [searchQuery, filters]);

  // ✅ Handle filter removal
  const removeFilter = (key) => {
    const updatedFilters = { ...filters };
    delete updatedFilters[key];
    setFilters(updatedFilters);

    const queryParams = new URLSearchParams(updatedFilters).toString();
    router.push(`/listings?${queryParams}`);
  };

  return (
    <div className="p-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Search Results</h2>
        
        {/* Filter Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
        >
          <FaFilter /> Filters
        </button>
      </div>

      {/* ✅ Applied Filters (Clickable Capsules) */}
      <div className="flex flex-wrap gap-2 mt-4">
        {Object.keys(filters)
          .filter((key) => filters[key]) // Show only active filters
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

      {/* ✅ Animated Filter Sidebar */}
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

            {/* Property Type */}
            <div className="mb-4">
              <label className="block mb-1">Property Type</label>
              <select
                className="w-full p-2 rounded-lg text-black"
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              >
                <option value="">All</option>
                <option value="buy">For Sale</option>
                <option value="rent">For Rent</option>
              </select>
            </div>

            {/* Country */}
            <div className="mb-4">
              <label className="block mb-1">Country</label>
              <input
                type="text"
                className="w-full p-2 rounded-lg text-black"
                placeholder="Enter country"
                value={filters.country}
                onChange={(e) => setFilters({ ...filters, country: e.target.value })}
              />
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

      {/* 🔹 Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
        {listings.length > 0 ? (
          listings.map((listing) => (
            <motion.div
              key={listing.$id}
              whileHover={{ scale: 1.05 }}
              className="rounded-lg overflow-hidden shadow-lg bg-white"
            >
              <Link href={`/listing/${listing.$id}`}>
                <div>
                  <Image
                    src={listing.images[0] || "/example.jpg"}
                    width={400}
                    height={300}
                    alt={listing.title}
                    className="w-full h-60 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="text-lg font-semibold">{listing.title}</h3>
                    <p className="text-gray-500">{listing.description.substring(0, 50)}...</p>
                    <p className="text-blue-600 font-bold mt-2">{listing.price}€</p>
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