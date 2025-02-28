"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { db, Query } from "../../lib/appwrite";
import Image from "next/image";
import { motion } from "framer-motion";
import { FaSearch, FaArrowRight, FaCheckCircle, FaHome, FaBuilding, FaMapMarkerAlt } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useTrustedSellers } from "./components/TrustedSellersProvider";
import { Tooltip } from "react-tooltip";

export default function Home() {
  const [listings, setListings] = useState([]);
  const [sellers, setSellers] = useState({});
  const [isClient, setIsClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const verifiedSellers = useTrustedSellers();

  useEffect(() => {
    setIsClient(true);

    async function fetchListings() {
      try {
        const response = await db.listDocuments("67a8e81100361d527692", "67b2fdc20027f4d55440", [
          Query.limit(6), // Show only 6 featured listings
        ]);
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
          setSellers(sellerData);
        }
      } catch (error) {
        console.error("❌ Error fetching listings:", error);
      }
    }
    fetchListings();
  }, []);


  if (!isClient) return null; // Prevent hydration error

  // ✅ Format price (remove the € since toLocaleString already adds it)
  const formatPrice = (price) => {
    return price.toLocaleString("de-DE");
  };

  // ✅ Handle search submission
  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    router.push(`/listings?search=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* 🔹 Hero Section */}
      <div
        className="relative h-[60vh] bg-cover bg-center"
        style={{ backgroundImage: "url('/bg_real.jpg')" }}
      >
        <div className="absolute inset-0 bg-black/70 flex flex-col justify-center items-center text-center text-white">
          <h1 className="text-5xl font-bold">Find Your Dream Home</h1>
          <p className="mt-3 text-lg text-gray-300">Buy, rent, or sell properties with ease</p>

          {/* 🔍 Search Bar */}
          <div className="mt-6 flex items-center bg-gray-800 rounded-lg p-2 shadow-lg w-full max-w-lg border border-gray-700">
            <input
              type="text"
              placeholder="Search by city, area, or property type"
              className="flex-1 p-3 bg-transparent text-white outline-none placeholder-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()} // Pressing enter triggers search
            />
            <button
              onClick={handleSearch}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition flex items-center gap-2"
            >
              <FaSearch /> Search
            </button>
          </div>
          
          {/* Quick Category Links */}
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/listings?type=house" className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg hover:bg-gray-700 transition border border-gray-700">
              <FaHome className="text-orange-500" />
              <span>Houses</span>
            </Link>
            <Link href="/listings?type=apartment" className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg hover:bg-gray-700 transition border border-gray-700">
              <FaBuilding className="text-orange-500" />
              <span>Apartments</span>
            </Link>
            <Link href="/listings?location=spawn" className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg hover:bg-gray-700 transition border border-gray-700">
              <FaMapMarkerAlt className="text-orange-500" />
              <span>Near Spawn</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 🔹 Featured Listings */}
      <div className="p-10 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-white">Featured Properties</h2>

          {/* ✅ Smooth hover effect without gap animation */}
          <Link href={"/listings"} className="text-orange-500 transition-all hover:text-orange-400">
            <motion.div className="flex items-center gap-1" whileHover="hover">
              <span>View All Properties</span>
              <motion.span
                variants={{
                  initial: { marginLeft: 4 }, // Initial small space
                  hover: { marginLeft: 8 }, // Moves further when hovered
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <FaArrowRight />
              </motion.span>
            </motion.div>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-400 text-lg">No listings available at the moment.</p>
              <p className="text-gray-500 mt-2">Check back soon for new properties!</p>
            </div>
          ) : (
            listings.map((listing) => (
              <motion.div
                key={listing.$id}
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.2 }}
                className="rounded-lg overflow-hidden shadow-lg cursor-pointer bg-gray-800 border border-gray-700 hover:border-orange-500/50"
              >
                <Link href={`/listing/${listing.$id}`}>
                  <div>
                    {/* Property Image */}
                    <div className="relative">
                      <Image
                        src={
                          listing.imageUrls && listing.imageUrls.length > 0
                            ? listing.imageUrls[0]
                            : "/example.jpg"
                        }
                        width={400}
                        height={300}
                        alt={listing.title || "Property Image"}
                        className="w-full h-60 object-cover"
                      />
                      <div className="absolute top-0 right-0 bg-orange-500 text-white px-3 py-1 m-2 rounded-md font-semibold">
                        {formatPrice(listing.price)}€
                      </div>
                    </div>

                    {/* Property Info */}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-white">{listing.title}</h3>
                      <p className="text-gray-400 mt-1">
                        {listing.description.substring(0, 80)}...
                      </p>

                      {/* ✅ Seller Info (Minecraft Head + Name) */}
                      {listing.sellerUUID && sellers[listing.sellerUUID] ? (
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
                          <Image
                            src={`https://crafthead.net/helm/${listing.sellerUUID}`}
                            width={40}
                            height={40}
                            alt="Seller Head"
                            className="rounded-md"
                          />
                          <span className="ml-2 font-medium text-gray-500">Unknown Seller</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </div>
      
      {/* Features Section */}
      <div className="bg-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose RigaVault Estate?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 text-center">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaHome className="text-2xl text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Premium Properties</h3>
              <p className="text-gray-400">Discover the finest Minecraft real estate available in our server.</p>
            </div>
            
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 text-center">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCheckCircle className="text-2xl text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Verified Sellers</h3>
              <p className="text-gray-400">All our sellers are verified to ensure safe and secure transactions.</p>
            </div>
            
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 text-center">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaSearch className="text-2xl text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Search</h3>
              <p className="text-gray-400">Find exactly what you're looking for with our powerful search tools.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}