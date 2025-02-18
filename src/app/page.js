"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchListings } from "../../lib/appwrite";
import Image from "next/image";
import { motion } from "framer-motion";
import { FaSearch } from "react-icons/fa"; // ✅ Correctly import the icon
import { FaArrowRight } from "react-icons/fa6";

export default function Home() {
  const [listings, setListings] = useState([]);
  const [isClient, setIsClient] = useState(false); // ✅ Prevent hydration error

  useEffect(() => {
    setIsClient(true); // ✅ Ensure client-only rendering

    async function getData() {
      try {
        const fetchedListings = await fetchListings();
        setListings(fetchedListings);
      } catch (error) {
        console.error("Error fetching listings:", error);
      }
    }
    getData();
  }, []);

  if (!isClient) return null; // ✅ Avoid rendering on the server

  return (
    <div className="min-h-screen">
      {/* 🔹 Hero Section */}
      <div
        className="relative h-[60vh] bg-cover bg-center"
        style={{ backgroundImage: "url('/example.jpg')" }}
      >
        <div className="absolute inset-0 bg-black/50 flex flex-col justify-center items-center text-center text-white">
          <h1 className="text-5xl font-bold">Find Your Dream Home</h1>
          <p className="mt-3 text-lg">Buy, rent, or sell properties with ease</p>

          {/* 🔍 Search Bar */}
          <div className="mt-6 flex items-center bg-white rounded-full p-2 shadow-lg w-full max-w-lg">
            <input
              type="text"
              placeholder="Search by city, area, or property type"
              className="flex-1 p-3 text-black outline-none"
            />
            <button className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition flex items-center gap-2">
              <FaSearch /> Search
            </button>
          </div>
        </div>
      </div>

      {/* 🔹 Featured Listings */}
      <div className="p-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Featured Properties</h2>
        
        {/* ✅ Smooth hover effect without gap animation */}
        <Link href={'/listings'} className="text-white transition-all">
          <motion.div 
            className="flex items-center gap-1" // Initial small gap
            whileHover="hover"
          >
            <span>More</span>
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
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {listings.length === 0 ? (
            <p className="text-gray-500">No listings available.</p>
          ) : (
            listings.map((listing) => (
              <motion.div
                key={listing.$id}
                whileHover={{ scale: 1.05 }}
                className="rounded-lg overflow-hidden shadow-lg cursor-pointer bg-white"
              >
                <Link href={`/listing/${listing.$id}`}>
                  <div>
                    {/* Property Image */}
                    <Image
                      src={(listing.images && listing.images.length > 0) ? listing.images[0] : "/example.jpg"}
                      width={400}
                      height={300}
                      alt={listing.title || "Property Image"}
                      className="w-full h-60 object-cover"
                    />

                    {/* Property Info */}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold">{listing.title}</h3>
                      <p className="text-gray-500">
                        {listing.description.substring(0, 50)}...
                      </p>
                      <p className="text-blue-600 font-bold mt-2">
                        {listing.price}€
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}