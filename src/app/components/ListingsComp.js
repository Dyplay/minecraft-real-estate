"use client";

import { useEffect, useState } from "react";
import { db, Query } from "../../../lib/appwrite";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FaTimes, FaFilter, FaSearch, FaHome, FaBuilding, FaMapMarkerAlt, FaSort, FaCheckCircle } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Skeleton from "./Skeleton";
import { useTrustedSellers } from "./TrustedSellersProvider";
import { Tooltip } from "react-tooltip";

export default function Listings() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const verifiedSellers = useTrustedSellers();

  const [listings, setListings] = useState([]);
  const [sellers, setSellers] = useState({});
  const [totalListings, setTotalListings] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

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

  // Add debug logs
  useEffect(() => {
    console.log("Trusted Sellers:", verifiedSellers);
  }, [verifiedSellers]);

  useEffect(() => {
    async function fetchListings() {
      setLoading(true);
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
                  // Add debug log for each seller
                  console.log("Seller Data:", {
                    uuid,
                    data: sellerResponse.documents[0],
                    isTrusted: verifiedSellers?.includes(sellerResponse.documents[0].uuid)
                  });
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
      } finally {
        setLoading(false);
      }
    }

    fetchListings();
  }, [filters, verifiedSellers]);

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
    <div className="min-h-screen bg-gray-900 text-white p-6 md:p-10">
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 right-0 h-full w-72 bg-gray-800 text-white shadow-lg p-6 z-50 border-l border-gray-700"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Filters</h3>
              <button 
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-white"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block mb-1 text-gray-300">Search</label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full p-2 pl-8 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={filters.searchQuery}
                  onChange={(e) => updateFilter("searchQuery", e.target.value)}
                  placeholder="Search listings..."
                />
                <FaSearch className="absolute left-2.5 top-3 text-gray-400" />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block mb-1 text-gray-300">Min Price (€)</label>
              <input
                type="number"
                className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={filters.minPrice}
                onChange={(e) => updateFilter("minPrice", e.target.value)}
                placeholder="Minimum price"
              />
            </div>
            
            <div className="mb-4">
              <label className="block mb-1 text-gray-300">Max Price (€)</label>
              <input
                type="number"
                className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={filters.maxPrice}
                onChange={(e) => updateFilter("maxPrice", e.target.value)}
                placeholder="Maximum price"
              />
            </div>
            
            <div className="mb-4">
              <label className="block mb-1 text-gray-300">Country</label>
              <select
                className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={filters.country}
                onChange={(e) => updateFilter("country", e.target.value)}
              >
                <option value="">All Countries</option>
                <option value="Riga">Riga</option>
                <option value="Lavantal">Lavantal</option>
              </select>
            </div>
            
            <div className="mb-6">
              <label className="block mb-1 text-gray-300">Type</label>
              <select
                className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={filters.type}
                onChange={(e) => updateFilter("type", e.target.value)}
              >
                <option value="">All Types</option>
                <option value="buy">Buy</option>
                <option value="rent">Rent</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => {
                  setFilters({
                    searchQuery: "",
                    minPrice: "",
                    maxPrice: "",
                    country: "",
                    type: "",
                  });
                  setHasUpdatedFilters(true);
                }} 
                className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition border border-gray-600"
              >
                Reset All
              </button>
              <button 
                onClick={() => setShowFilters(false)} 
                className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white">Properties</h2>
            <p className="text-gray-400 mt-1">
              {totalListings} {totalListings === 1 ? 'property' : 'properties'} found
            </p>
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition border border-gray-700"
          >
            <FaFilter className="text-orange-500" /> Filters
          </button>
        </div>

        {/* Quick Filter Categories */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button 
            onClick={() => updateFilter("type", "buy")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition ${
              filters.type === "buy" 
                ? "bg-orange-500 text-white" 
                : "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
            }`}
          >
            <FaHome /> Buy
          </button>
          <button 
            onClick={() => updateFilter("type", "rent")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition ${
              filters.type === "rent" 
                ? "bg-orange-500 text-white" 
                : "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
            }`}
          >
            <FaBuilding /> Rent
          </button>
          <button 
            onClick={() => updateFilter("country", "Riga")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition ${
              filters.country === "Riga" 
                ? "bg-orange-500 text-white" 
                : "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
            }`}
          >
            <FaMapMarkerAlt /> Riga
          </button>
          <button 
            onClick={() => updateFilter("country", "Lavantal")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition ${
              filters.country === "Lavantal" 
                ? "bg-orange-500 text-white" 
                : "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
            }`}
          >
            <FaMapMarkerAlt /> Lavantal
          </button>
        </div>

        {/* Active Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(filters)
            .filter(([_, value]) => value)
            .map(([key, value]) => (
              <span key={key} className="bg-gray-800 text-white px-3 py-1 rounded-lg flex items-center gap-2 border border-gray-700">
                {key === "searchQuery" ? "Search" : key === "minPrice" ? "Min Price" : key === "maxPrice" ? "Max Price" : key}: {value}
                <button 
                  onClick={() => removeFilter(key)} 
                  className="text-gray-400 hover:text-orange-500 transition"
                >
                  <FaTimes />
                </button>
              </span>
            ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg animate-pulse">
                <div className="h-60 bg-gray-700"></div>
                <div className="p-4">
                  <div className="h-6 bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-700 rounded w-2/3"></div>
                  <div className="h-6 bg-gray-700 rounded w-1/3 mt-4"></div>
                  <div className="flex items-center mt-4">
                    <div className="h-10 w-10 rounded-full bg-gray-700 mr-3"></div>
                    <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.length > 0 ? (
              listings.map((listing) => (
                <motion.div 
                  key={listing.$id} 
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-lg overflow-hidden shadow-lg bg-gray-800 border border-gray-700 hover:border-orange-500/50"
                >
                  <Link href={`/listing/${listing.$id}`}>
                    <div className="relative">
                      <Image 
                        src={listing.imageUrls?.[0] || "/example.jpg"} 
                        width={400} 
                        height={300} 
                        alt={listing.title} 
                        className="w-full h-60 object-cover" 
                      />
                      <div className="absolute top-0 right-0 bg-orange-500 text-white px-3 py-1 m-2 rounded-md font-semibold">
                        {formatPrice(listing.price)}
                      </div>
                    </div>
                    <div className="p-4">
                      {/* Listing Title & Description */}
                      <h3 className="font-semibold text-xl text-white">{listing.title}</h3>
                      <p className="text-gray-400 mt-1">{listing.description.substring(0, 80)}...</p>

                      {/* Location */}
                      {listing.country && (
                        <div className="flex items-center mt-2 text-gray-400">
                          <FaMapMarkerAlt className="text-orange-500 mr-1" />
                          <span>{listing.country}</span>
                        </div>
                      )}

                      {/* 🏷️ Seller Information */}
                      {sellers[listing.sellerUUID] ? (
                        <div className="flex items-center mt-4 pt-3 border-t border-gray-700">
                          <Image 
                            src={`https://crafthead.net/helm/${listing.sellerUUID}`}
                            width={40} 
                            height={40} 
                            alt="Seller Head" 
                            className="rounded-md"
                          />
                          <div className="ml-2 flex items-center">
                            <span className="font-medium text-gray-300">
                              {sellers[listing.sellerUUID].username}
                            </span>
                            {verifiedSellers.includes(listing.sellerUUID) && (
                              <>
                                <FaCheckCircle 
                                  className="ml-1 text-orange-500" 
                                  data-tooltip-id={`verified-${listing.$id}`}
                                />
                                <Tooltip id={`verified-${listing.$id}`} className="bg-gray-800 text-white border border-gray-700">
                                  Verified Seller
                                </Tooltip>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center mt-4 pt-3 border-t border-gray-700">
                          <div className="w-10 h-10 bg-gray-700 rounded-md"></div>
                          <p className="ml-3 text-gray-500">Unknown Seller</p>
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="w-16 h-16 mx-auto bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <FaSearch className="text-gray-600 text-xl" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No listings found</h3>
                <p className="text-gray-400">Try adjusting your filters or search criteria</p>
                <button 
                  onClick={() => {
                    setFilters({
                      searchQuery: "",
                      minPrice: "",
                      maxPrice: "",
                      country: "",
                      type: "",
                    });
                    setHasUpdatedFilters(true);
                  }}
                  className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}