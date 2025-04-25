"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import dotenv from "dotenv";
import { FaCheckCircle, FaExclamationTriangle, FaStar, FaRegStar, FaFlag } from "react-icons/fa";
import { Tooltip } from "react-tooltip";
import { useTrustedSellers } from "../../components/TrustedSellersProvider";
import { db, Query, storage, account, ID, client } from "../../../../lib/appwrite";
import Skeleton from "../../../app/components/ListingSkeleton";
import Image from "next/image";
import { toast } from "react-toastify";
import { captureEvent } from "../../../../lib/posthog";
import Link from "next/link";
dotenv.config();

export default function ListingPage() {
  const router = useRouter();
  const { id } = useParams(); // ✅ Get ID from URL params
  const verifiedSellers = useTrustedSellers();

  const [listing, setListing] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reviews, setReviews] = useState([]);
  const [user, setUser] = useState(null); // ✅ Add user state
  const [review, setReview] = useState({ rating: 5, comment: "" });
  const [seller, setSeller] = useState(null); // ✅ Declared FIRST
  const [showPurchasePopup, setShowPurchasePopup] = useState(false); // State to control the popup visibility
  const [purchaseStep, setPurchaseStep] = useState("Starting purchase process..."); // State for the purchase step
  const [loading, setLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState([]); // ✅ Store image URLs
  const [currentImage, setCurrentImage] = useState(null); // ✅ Track selected image
  const [showSpinner, setShowSpinner] = useState(true); // Added for spinner state
  const [showPopup, setShowPopup] = useState(false); // State to control the popup visibility
  const [currentPurchaseId, setCurrentPurchaseId] = useState(null); // Add a new state to track the purchase ID

  // Add these refs
  const unsubscribeRef = useRef(null);
  const purchaseTimerRef = useRef(null);

  const countryFlags = {
    Riga: "/flags/riga.webp", // Replace with actual flag path
    Lavantal: "/flags/lavantal.png", // Replace with actual flag path
  };

  useEffect(() => {
    // Add this to fix styling issues
    document.body.classList.add('hydrated');
    
    // Track page view with PostHog
    if (id) {
      captureEvent('listing_page_viewed', { listingId: id });
    }

    if (!id) {
      console.error("🚨 No ID found in params.");
      return;
    }
  
    console.log("🚀 Listing ID from URL:", id);

    async function fetchUser() {
      try {
        console.log("🔄 Fetching Appwrite session...");
        const session = await account.get();
        console.log("🟢 Session Data:", session);
  
        if (!session) {
          console.warn("⚠ No session found.");
          return;
        }
  
        // ✅ Step 1: Get current **external** IP
        let ipData;
        try {
          const ipResponse = await fetch("https://api64.ipify.org?format=json");
          ipData = await ipResponse.json();
        } catch (error) {
          console.error("🚨 Failed to fetch user IP:", error);
          return;
        }
  
        const userIP = ipData.ip;
        console.log("🌐 Fetched User IP:", userIP);
  
        // ✅ Step 2: Find user by **IP Address**
        const userResponse = await db.listDocuments(
          "67a8e81100361d527692",
          "67a900dc003e3b7524ee",
          [Query.equal("ip", userIP)]
        );
  
        if (userResponse.documents.length === 0) {
          console.warn("⚠ No user found with matching IP.");
          return;
        }
  
        const userData = userResponse.documents[0];
        console.log("✅ Found User Data:", userData);
  
        // ✅ Step 3: Fetch Minecraft Username from Mojang API
        let mcUsername = "Unknown";
        try {
          const mcResponse = await fetch(`https://rigabank.dyplay.at/api/uuid?uuid=${userData.uuid}`);
          const mcData = await mcResponse.json();
          mcUsername = mcData.name; // Get latest name
        } catch (error) {
          console.error("🚨 Failed to fetch Minecraft username:", error);
        }
  
        setUser({
          ...userData,
          mcUsername: mcUsername,
          avatar: `https://crafthead.net/helm/${userData.uuid}`, // ✅ Minecraft PFP
        });
  
      } catch (error) {
        console.error("🚨 Error fetching user session:", error);
      }
    }

    async function fetchData() {
      try {
        console.log("🔄 Fetching listing data for ID:", id);
  
        const listingData = await db.getDocument(
          "67a8e81100361d527692",
          "67b2fdc20027f4d55440",
          id
        );
  
        // Set default Available to true if it's not set
        if (listingData.Available === undefined) {
          listingData.Available = true;
        }
  
        console.log("✅ Listing data:", listingData);
        setListing(listingData);
  
        // Only set image URLs if they exist
        if (listingData.imageUrls && listingData.imageUrls.length > 0) {
          console.log("📸 Setting image URLs:", listingData.imageUrls);
          setImageUrls(listingData.imageUrls);
          setCurrentImage(listingData.imageUrls[0]);
        } else {
          // Set default image
          setImageUrls(['/example.jpg']);
          setCurrentImage('/example.jpg');
        }
  
        // Fetch seller data
        if (listingData.sellerUUID) {
          console.log("🔄 Fetching seller data for UUID:", listingData.sellerUUID);
          const sellerResponse = await db.listDocuments(
            "67a8e81100361d527692",
            "67a900dc003e3b7524ee",
            [Query.equal("uuid", listingData.sellerUUID)]
          );
  
          if (sellerResponse.documents.length > 0) {
            const sellerData = sellerResponse.documents[0];
            console.log("✅ Seller data:", sellerData);
            setSeller(sellerData);
          }
        }
      } catch (error) {
        console.error("🚨 Error fetching listing:", error);
      } finally {
        setLoading(false);
      }
    }
  
    async function fetchReviews() {
      try {
        const reviewResponse = await db.listDocuments(
          "67a8e81100361d527692",
          "listing_reviews",
          [Query.equal("listingID", id)]
        );
  
        setReviews(reviewResponse.documents);
      } catch (error) {
        console.error("🚨 Error fetching reviews:", error);
      }
    }
  
    fetchData();
    fetchReviews();
    fetchUser();

    // Set up real-time listener for listing updates
    const unsubscribe = client.subscribe(
      `databases.67a8e81100361d527692.collections.67b2fdc20027f4d55440.documents.${id}`,
      response => {
        console.log("📩 Received listing update:", response);

        if (response.events.includes(`databases.*.collections.*.documents.${id}.update`)) {
          const updatedAvailable = response.payload.Available;

          // Check if the availability status has changed
          if (updatedAvailable === false) {
            // Redirect to the receipt page
            router.push(`/receipt/${response.payload.purchaseId}`); // Assuming you have a purchaseId in the payload
          } else if (updatedAvailable === true) {
            // Set Available back to NULL and update the UI
            setListing(prevListing => ({
              ...prevListing,
              ...response.payload,
              Available: null // Set back to NULL
            }));

            // Update the UI to show "Payment Declined"
            toast.error("❌ Payment Declined");
            setShowSpinner(false); // Assuming you have a state to control the spinner
          } else {
            // If it's NULL, set it to true
            setListing(prevListing => ({
              ...prevListing,
              ...response.payload,
              Available: updatedAvailable === null ? true : updatedAvailable // Set to true if NULL
            }));
          }
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
      document.body.classList.remove('hydrated');
    };
  }, [id, router]);

  useEffect(() => {
    if (listing) {
      console.log("FULL LISTING OBJECT:", JSON.stringify(listing, null, 2));
      console.log("Coordinates Type Check:", {
        coordinateX: typeof listing.coordinateX,
        coordinateZ: typeof listing.coordinateZ,
        coordinateXValue: listing.coordinateX,
        coordinateZValue: listing.coordinateZ
      });
    }
  }, [listing]);

  const isTrusted = seller ? verifiedSellers.includes(seller.uuid) : false;
  
  async function handleReportSubmit() {
    if (!reportReason) {
      toast.warn("⚠️ Please select a reason before submitting.");
      return;
    }
  
    setIsLoading(true); // Start loading
  
    try {
      // ✅ Load Webhook URL Securely
      const webhookUrl = "https://discord.com/api/webhooks/1342257889888440320/By77PrA6Sg7H0Ct1UHqD2csOWW-xZFdljwcW0JikU3GGEoppe4uui7ZQDxxBKG8StWVZ";
  
      if (!webhookUrl) {
        throw new Error("Webhook URL is missing! Check your .env.local file.");
      }
  
      // ✅ Construct the payload
      const payload = {
        content: `🚨 **New Listing Report** 🚨 @everyone`,
        embeds: [
          {
            title: "Reported Listing",
            description: `A listing has been reported.`,
            color: 16711680, // Red color
            fields: [
              { name: "Reason", value: reportReason, inline: false },
              { name: "Reported By", value: user.username, inline: true },
              { name: "Discord User", value: user.discordUser || "N/A", inline: true },
              { name: "Minecraft User", value: user.mcUsername || "N/A", inline: true },
              { name: "Listing Title", value: listing.title, inline: false },
              { name: "Seller", value: seller.username, inline: true },
              { name: "Seller UUID", value: seller.uuid, inline: true },
              { name: "Listing Link", value: `https://realestate.dyplay.at/listing/${id}`, inline: false },
            ],
          },
        ],
      };
  
      // ✅ Send Webhook Request
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
  
      // ✅ Show success message and close modal
      toast.success("✅ Report submitted successfully!");
      setShowReportModal(false);
      setReportReason(""); // Clear selected reason
    } catch (error) {
      console.error("🚨 Error sending report:", error);
      toast.error("❌ Failed to submit report.");
    } finally {
      setIsLoading(false); // Stop loading
    }
  }  

  const handlePurchase = async () => {
    if (!user) {
      toast.error("You must be logged in to purchase properties");
      return;
    }
    
    // Check if user is trying to buy their own listing
    if (user.uuid === listing.sellerUUID) {
      toast.error("You cannot purchase your own listing");
      return;
    }
    
    setShowPurchasePopup(true);
    setPurchaseStep("initial");
  };

  // Add the handleApproveTransaction function
  const handleApproveTransaction = async () => {
    try {
      setPurchaseStep("approving");
      
      // Create purchase request
      const purchaseRequest = await db.createDocument(
        "67a8e81100361d527692",
        "67b6049900036a440ded",
        ID.unique(),
        {
          shopname: listing.title,
          seller: seller?.username || "Unknown",
          sellerUUID: listing.sellerUUID,
          buyer: user.mcUsername,
          buyerUUID: user.uuid,
          price: listing.price,
          productName: listing.title,
        }
      );
      
      // Store purchase ID in state
      setCurrentPurchaseId(purchaseRequest.$id);
      
      console.log("Purchase request created:", purchaseRequest);
      
      // Deduct money from buyer's account
      try {
        console.log("Attempting to deduct money from buyer's account");
        
        // Find buyer's money account using their Minecraft username
        const moneyAccountsResponse = await db.listDocuments(
          "67a8e81100361d527692",
          "67b093040006e14307e1",
          [Query.equal("user_name", user.mcUsername)]
        );
        
        console.log("Money accounts search results:", moneyAccountsResponse);
        
        if (moneyAccountsResponse.documents.length === 0) {
          console.error("No money account found for user:", user.mcUsername);
          toast.error("Could not find your bank account");
          setShowPurchasePopup(false);
          return;
        }
        
        const moneyAccount = moneyAccountsResponse.documents[0];
        console.log("Found money account:", moneyAccount);
        
        // Check if user has enough balance
        if (moneyAccount.balance < listing.price) {
          console.error("Insufficient funds. Balance:", moneyAccount.balance, "Price:", listing.price);
          toast.error("Insufficient funds in your account");
          setShowPurchasePopup(false);
          return;
        }
        
        // Calculate new balance
        const newBalance = moneyAccount.balance - listing.price;
        console.log("Deducting price from balance:", moneyAccount.balance, "-", listing.price, "=", newBalance);
        
        // Update user's balance
        await db.updateDocument(
          "67a8e81100361d527692",
          "67b093040006e14307e1",
          moneyAccount.$id,
          {
            balance: newBalance
          }
        );
        
        console.log("Money successfully deducted. New balance:", newBalance);
        
        // Update purchase request to confirmed
        await db.updateDocument(
          "67a8e81100361d527692",
          "67b6049900036a440ded",
          purchaseRequest.$id,
          {
            confirmed: true
          }
        );
        
        console.log("Purchase confirmed after successful payment");
        
        // Update listing availability
        await db.updateDocument(
          "67a8e81100361d527692",
          "67b2fdc20027f4d55440",
          listing.$id,
          {
            Available: false
          }
        );
        
        console.log("Listing marked as unavailable");
        
        // Set purchase step to approved (UI will update via real-time or polling)
        setPurchaseStep("approved");
        
        // Wait 2 seconds before redirect
        setTimeout(() => {
          console.log("Redirecting to receipt page");
          router.push(`/receipt/${purchaseRequest.$id}`);
        }, 2000);
        
        return;
      } catch (paymentError) {
        console.error("Error processing payment:", paymentError);
        toast.error("Error processing payment");
        setShowPurchasePopup(false);
        return;
      }
      
      // Define a function to check purchase status
      const checkPurchaseStatus = async () => {
        try {
          console.log("Checking purchase status for ID:", purchaseRequest.$id);
          const updatedPurchase = await db.getDocument(
            "67a8e81100361d527692",
            "67b6049900036a440ded",
            purchaseRequest.$id
          );
          
          console.log("Purchase status check result:", updatedPurchase);
          
          if (updatedPurchase.confirmed === true) {
            console.log("Purchase confirmed via polling");
            setPurchaseStep("approved");
            
            // Wait 2 seconds before redirect
            setTimeout(() => {
              console.log("Redirecting to receipt page");
              router.push(`/receipt/${purchaseRequest.$id}`);
            }, 2000);
            
            // Clear the polling interval
            if (purchaseTimerRef.current) {
              clearInterval(purchaseTimerRef.current);
              purchaseTimerRef.current = null;
            }
          }
        } catch (error) {
          console.error("Error checking purchase status:", error);
        }
      };
      
      // Set up polling as a fallback (checks every 3 seconds)
      purchaseTimerRef.current = setInterval(checkPurchaseStatus, 3000);
      
      // Also try the real-time approach
      try {
        console.log("Setting up real-time listener for purchase ID:", purchaseRequest.$id);
        
        // Store the unsubscribe function in ref
        unsubscribeRef.current = client.subscribe(
          `databases.67a8e81100361d527692.collections.67b6049900036a440ded.documents.${purchaseRequest.$id}`,
          (response) => {
            console.log("Real-time update received:", response);
            
            if (response.events.some(event => event.includes('update'))) {
              console.log("Update event detected, payload:", response.payload);
              
              if (response.payload.confirmed === true) {
                console.log("Purchase confirmed via real-time");
                setPurchaseStep("approved");
                
                // Clear the polling interval since we got a real-time update
                if (purchaseTimerRef.current) {
                  clearInterval(purchaseTimerRef.current);
                  purchaseTimerRef.current = null;
                }
                
                setTimeout(() => {
                  console.log("Redirecting to receipt page");
                  router.push(`/receipt/${purchaseRequest.$id}`);
                }, 2000);
              }
            }
          }
        );
        
        console.log("Real-time subscription created and stored in ref");
      } catch (rtError) {
        console.error("Error setting up real-time subscription:", rtError);
        console.log("Falling back to polling only");
      }
      
    } catch (error) {
      console.error("Error creating purchase:", error);
      toast.error("Error creating purchase request");
      setShowPurchasePopup(false);
      
      // Clean up any timers
      if (purchaseTimerRef.current) {
        clearInterval(purchaseTimerRef.current);
        purchaseTimerRef.current = null;
      }
    }
  };

  // Update the cleanup useEffect
  useEffect(() => {
    // Cleanup function
    return () => {
      console.log("Component unmounting, cleaning up subscriptions and timers");
      
      // Clean up real-time subscription
      if (unsubscribeRef.current) {
        try {
          unsubscribeRef.current();
          console.log("Real-time subscription unsubscribed");
        } catch (error) {
          console.error("Error unsubscribing:", error);
        }
        unsubscribeRef.current = null;
      }
      
      // Clean up polling interval
      if (purchaseTimerRef.current) {
        clearInterval(purchaseTimerRef.current);
        purchaseTimerRef.current = null;
        console.log("Polling timer cleared");
      }
    };
  }, []);

  // ✅ Move `submitReview` OUTSIDE `useEffect`
  async function submitReview() {
    if (!user || !user.uuid) {
      toast.error("⚠ You need to be logged in to leave a review.");
      return;
    }
  
    if (!review.comment.trim()) {
      toast.warn("⚠ Please enter a comment.");
      return;
    }
  
    try {
      await db.createDocument(
        "67a8e81100361d527692",
        "listing_reviews",
        ID.unique(),
        {
          listingID: id,
          userUUID: user.uuid,
          username: user.username,
          rating: review.rating,
          comment: review.comment,
          timestamp: new Date().toISOString(),
        }
      );
  
      // Refresh reviews instantly
      setReviews((prev) => [
        ...prev,
        {
          listingID: id,
          userUUID: user.uuid,
          username: user.username,
          rating: review.rating,
          comment: review.comment,
          timestamp: new Date().toISOString(),
        },
      ]);
  
      // Reset review form
      setReview({ rating: 5, comment: "" });
  
      toast.success("✅ Review submitted successfully!");
    } catch (error) {
      console.error("🚨 Error submitting review:", error);
      toast.error("❌ Failed to submit review.");
    }
  }

  function getCoordinates(listing) {
    // For debugging, log the entire listing object
    console.log("FULL LISTING OBJECT FOR COORDS:", listing);
    
    // Try direct access with fallbacks
    const x = listing.coordinateX || 
              (listing.coordinates ? listing.coordinates.split(',')[0] : null) || 
              "-234";
              
    const z = listing.coordinateZ || 
              (listing.coordinates ? listing.coordinates.split(',')[1] : null) || 
              "100";
              
    console.log("EXTRACTED COORDINATES:", { x, z });
    
    return { x, z };
  }

  if (loading) return <Skeleton />;
  if (!listing) return <p className="text-center text-gray-400 py-12">Listing not found.</p>;

  const coords = getCoordinates(listing);

  console.log("Using coordinates:", coords);
  console.log("Map URL:", `http://45.93.250.230/#overworld:${coords.x}:222:${coords.z}:132:-1.17:0:0:1:flat`);

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 w-full">
      {/* Ensure the container takes full width */}
      <div className="max-w-7xl mx-auto">
        {/* Main content area with proper grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column - Images */}
          <div className="w-full">
            {/* Main Image Display */}
            <div className="relative rounded-lg overflow-hidden shadow-xl border border-gray-700 max-w-[900px] mx-auto">
              {currentImage && (
                <div className="aspect-[16/9]">
                  <Image
                    src={currentImage}
                    alt="Main Listing Image"
                    fill
                    priority
                    className="object-contain bg-gray-800"
                    sizes="(max-width: 900px) 100vw, 900px"
                  />
                </div>
              )}
            </div>
        
            {/* Thumbnail Navigation */}
            <div className="mt-4 flex gap-2 overflow-x-auto pb-4 px-2 max-w-[900px] mx-auto">
              <style jsx global>{`
                .thumbnail-scroll::-webkit-scrollbar {
                  height: 8px;
                }
                .thumbnail-scroll::-webkit-scrollbar-track {
                  background: #1F2937;
                  border-radius: 4px;
                }
                .thumbnail-scroll::-webkit-scrollbar-thumb {
                  background: #F97316;
                  border-radius: 4px;
                }
                .thumbnail-scroll::-webkit-scrollbar-thumb:hover {
                  background: #EA580C;
                }
              `}</style>
              <div className="flex gap-2 overflow-x-auto thumbnail-scroll w-full pb-2">
                {imageUrls.map((url, index) => (
                  url && (
                    <div
                      key={index}
                      className="flex-shrink-0"
                    >
                      <Image
                        src={url}
                        width={120}
                        height={80}
                        alt={`Thumbnail ${index + 1}`}
                        className={`cursor-pointer rounded-lg shadow-md transition transform hover:scale-105 ${
                          currentImage === url 
                            ? "border-4 border-orange-500" 
                            : "opacity-75 hover:opacity-100 border border-gray-700"
                        } object-cover w-[120px] h-[80px]`}
                        onClick={() => setCurrentImage(url)}
                      />
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* Add this after your image gallery section */}
            <div className="mt-6 w-full bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700">
              <div className="p-4 bg-gray-700 border-b border-gray-600">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  Property Location
                </h3>
              </div>
                <div className="grid grid-cols-2 gap-4 mb-2 mt-2 p-2">
                  <div className="bg-gray-700 p-3 rounded">
                    <p className="text-gray-400 text-sm">X Coordinate:</p>
                    <p className="text-white text-lg font-semibold">{listing.coordinateX}</p>
                  </div>
                  <div className="bg-gray-700 p-3 rounded">
                    <p className="text-gray-400 text-sm">Z Coordinate:</p>
                    <p className="text-white text-lg font-semibold">{listing.coordinateZ}</p>
                  </div>
                </div>
                
                <div className="relative w-full h-64">
                  {listing.country === "Riga" ? (
                    <iframe 
                      src={`http://45.93.250.230/#overworld:${listing.coordinateX}:222:${listing.coordinateZ}:132:-1.17:0:0:1:flat`}
                      className="w-full h-full border-0 rounded-lg"
                      title="Property Location on Blue Maps"
                      loading="lazy"
                      allowFullScreen
                    ></iframe>
                  ) : listing.country === "Lavantal" ? (
                    <iframe 
                      src={`http://45.93.250.230/#lavantal:${listing.coordinateX}:222:${listing.coordinateZ}:132:-1.17:0:0:1:flat`}
                      className="w-full h-full border-0 rounded-lg"
                      title="Property Location on Blue Maps"
                      loading="lazy"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <div className="flex items-center justify-center w-full h-full bg-gray-800 text-gray-400 rounded-lg">
                      <p>Map not available for this location</p>
                    </div>
                  )}
              </div>
            </div>
          </div>
          
          {/* Right column - Details */}
          <div className="w-full">
            {user?.uuid === listing.sellerUUID && (
              <div className="flex items-center bg-gray-700 text-orange-400 px-3 py-1 rounded-md text-sm mb-2">
                <FaExclamationTriangle className="mr-1" /> This is your listing
              </div>
            )}

            <h1 className="text-3xl font-bold text-white">{listing.title}</h1>
            <p className="mt-2 text-gray-300">{listing.description}</p>
            <p className="mt-2 text-gray-300 flex items-center">
              State Location: {listing.country}
              {countryFlags[listing.country] && (
                <Image
                  src={countryFlags[listing.country]}
                  alt={`${listing.country} Flag`}
                  width={30}
                  height={30}
                  className="ml-2 rounded"
                />
              )}
            </p>
            <p className="text-2xl text-orange-500 font-semibold mt-4">
              Price: {new Intl.NumberFormat("de-DE").format(listing.price)}€
            </p>

            {/* 🔹 Availability Status */}
            <div
              className={`mt-4 p-3 rounded-lg text-center font-semibold text-white ${
                listing.Available ? "bg-green-600" : "bg-gray-600"
              }`}
            >
              {listing.Available ? "✅ Available" : "❌ Not Available"}
            </div>

            {/* 🔹 Owner Notice (if it's your listing) */}
            {user?.uuid === listing?.sellerUUID && (
              <div className="mt-2 p-2 bg-gray-700 text-orange-400 rounded text-center">
                This is your listing
              </div>
            )}

            {/* 🔹 Buy Button */}
            <button
              className={`w-full mt-4 py-3 rounded-lg text-white font-bold transition ${
                !listing.Available || !user
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-orange-500 hover:bg-orange-600"
              }`}
              disabled={!listing.Available || !user}
              onClick={handlePurchase}
            >
              {!user ? (
                "Please login to purchase"
              ) : !listing.Available ? (
                "Not Available"
              ) : user?.uuid === listing?.sellerUUID ? (
                "Test Buy (Your Listing)"
              ) : (
                "Buy Now"
              )}
            </button>

            {/* 🔹 Seller Information */}
            {seller && (
              <div className="mt-6 border-t border-gray-700 pt-4">
                <Link href={`/profile/${seller.uuid}`} className="flex items-center gap-4 hover:bg-gray-800 p-2 rounded-lg transition-colors cursor-pointer group">
                  <Image
                    src={`https://crafthead.net/helm/${seller.uuid}/100`}
                    width={50}
                    height={50}
                    className="rounded-md border border-gray-600 group-hover:border-orange-500 transition-colors"
                    alt="Seller Avatar"
                  />
                  <div className="flex items-center gap-2">
                    {/* Seller Info Container */}
                    <div className="flex flex-col">
                      {/* Seller Name & Checkmark */}
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-semibold text-white group-hover:text-orange-500 transition-colors">{seller.username}</p>
                        
                        {seller && isTrusted && (
                          <span
                            className="text-orange-500 flex items-center"
                            data-tooltip-id="trusted-seller-tooltip"
                          >
                            <FaCheckCircle className="text-lg" />
                          </span>
                        )}
                      </div>

                      {/* UUID Display */}
                      <p className="text-sm text-gray-400">
                        <span className="font-semibold">Seller UUID:</span> {seller.uuid}
                      </p>
                    </div>
                  </div>

                  {/* View Profile indicator */}
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-orange-500 flex items-center">
                    <span className="mr-1">View Profile</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>

                  {seller && isTrusted && (
                    <Tooltip id="trusted-seller-tooltip" className="bg-gray-800 border border-gray-700 z-50">
                      <p className="text-white text-sm">
                        ✅ This is a <strong>trusted seller</strong> verified by our team.
                      </p>
                    </Tooltip>
                  )}
                </Link>
              </div>
            )}

            {/* Move Report Button to better location */}
            <div className="mt-6 pt-4 border-t border-gray-700">
              <button
                onClick={() => setShowReportModal(true)}
                className="w-full flex items-center justify-center gap-2 text-orange-500 hover:text-orange-400 py-2 px-4 rounded-lg border border-orange-500/20 hover:bg-orange-500/10 transition-all"
              >
                <FaFlag className="text-lg" />
                Report this listing
              </button>
            </div>

            {/* Report Modal */}
            {showReportModal && (
              <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-70 z-50">
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-[90%] max-w-md border border-gray-700">
                  <div className="flex items-center justify-center mb-4">
                    <FaFlag className="text-orange-500 mr-2 text-xl" />
                    <h2 className="text-xl font-semibold text-white">Report Listing</h2>
                  </div>

                  <p className="text-orange-400 text-sm mt-2 mb-4 flex items-center justify-center">
                    <FaExclamationTriangle className="mr-1" />
                    Mass false reporting is bannable.
                  </p>

                  <select
                    className="w-full p-3 mb-4 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                  >
                    <option value="">Select a reason...</option>
                    <option value="Inappropriate Content">Inappropriate Content</option>
                    <option value="Not Their Property">Not Their Property</option>
                    <option value="Scam / Fraud">Scam / Fraud</option>
                    <option value="Wrong Information">Wrong Information</option>
                    <option value="Other">Other</option>
                  </select>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowReportModal(false)}
                      className="w-1/2 py-2 px-4 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReportSubmit}
                      disabled={!reportReason || isLoading}
                      className={`w-1/2 py-2 px-4 rounded-lg font-medium transition-colors ${
                        !reportReason || isLoading
                          ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                          : "bg-orange-500 text-white hover:bg-orange-600"
                      }`}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Submitting...
                        </div>
                      ) : (
                        "Submit Report"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 🔹 Reviews Section */}
            <div className="mt-8 border-t border-gray-700 pt-6">
              <h3 className="text-2xl font-semibold text-white">Reviews ({reviews.length})</h3>

              {reviews.length > 0 ? (
                <div className="mt-4 space-y-4">
                  {reviews.map((review, index) => (
                    <div key={index} className="p-4 bg-gray-700 border border-gray-600 rounded-lg shadow">
                      {/* Reviewer Info */}
                      <div className="flex items-center gap-3">
                        <Image
                          src={`https://crafthead.net/helm/${review.userUUID}`}
                          width={40}
                          height={40}
                          className="rounded-md"
                          alt="Reviewer Avatar"
                        />
                        <div>
                          <p className="font-semibold text-white">{review.username}</p>
                          <p className="text-sm text-gray-400">{new Date(review.timestamp).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {/* Star Rating */}
                      <div className="mt-2 text-orange-400 flex">
                        {[...Array(5)].map((_, i) => (
                          <span key={i}>
                            {i < review.rating ? <FaStar /> : <FaRegStar />}
                          </span>
                        ))}
                      </div>

                      {/* Review Comment */}
                      <p className="mt-2 text-gray-300">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 mt-2">No reviews yet. Be the first to review!</p>
              )}
            </div>

            {/* 🔹 Review Submission */}
            <div className="mt-6 p-6 bg-gray-700 rounded-lg shadow border border-gray-600">
              <h3 className="text-xl font-semibold text-white">Leave a Review</h3>
              <p className="text-sm text-gray-400">Share your experience with this listing.</p>

              {/* Star Rating Selection */}
              <div className="flex gap-2 mt-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReview({ ...review, rating: star })}
                    className={`text-2xl ${review.rating >= star ? "text-orange-400" : "text-gray-500"}`}
                  >
                    ★
                  </button>
                ))}
              </div>

              {/* Review Comment Input */}
              <div className="relative mt-3">
                <textarea
                  placeholder="Write your review..."
                  className="w-full p-2 bg-gray-800 border border-gray-600 rounded resize-none text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  maxLength={1000} // ✅ Limits input to 1000 characters
                  value={review.comment}
                  onChange={(e) => setReview({ ...review, comment: e.target.value })}
                  rows={4}
                />
                
                {/* Character Counter d*/}
                <p className="absolute bottom-2 right-3 text-sm text-gray-400">
                  {review.comment.length}/1000
                </p>
              </div>

              {/* Submit Button */}
              <button
                onClick={submitReview}
                className="mt-3 w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600 transition"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Purchase Approval Popup */}
      {showPurchasePopup && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-70 z-[9999]">
          <div className="bg-gray-800 rounded-xl overflow-hidden shadow-2xl border border-gray-700 w-[90%] max-w-md transform transition-all">
            {/* Header */}
            <div className="bg-gray-700 px-6 py-4 border-b border-gray-600">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-white text-xl font-bold">Payment Confirmation</h2>
              </div>
            </div>
            
            {/* Body */}
            <div className="p-6">
              {purchaseStep === "initial" ? (
                <>
                  <div className="mb-6">
                    <p className="text-gray-300 mb-4">Please confirm your purchase:</p>
                    <div className="bg-gray-700 rounded-lg overflow-hidden">
                      <div className="p-4 border-b border-gray-600">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Property:</span>
                          <span className="text-white font-bold">{listing.title}</span>
                        </div>
                      </div>
                      <div className="p-4 border-b border-gray-600">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Price:</span>
                          <span className="text-orange-500 font-bold">{new Intl.NumberFormat("de-DE").format(listing.price)}€</span>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Seller:</span>
                          <span className="text-white">{seller?.username || "Unknown"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowPurchasePopup(false)}
                      className="flex-1 py-3 px-4 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleApproveTransaction}
                      className="flex-1 py-3 px-4 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors flex items-center justify-center"
                    >
                      Confirm Purchase
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </>
              ) : purchaseStep === "approving" ? (
                <div className="text-center py-6">
                  <div className="w-20 h-20 mx-auto mb-6 relative">
                    <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
                    <div className="absolute inset-3 rounded-full bg-gray-700 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-white text-xl font-bold mb-2">Processing Payment</h3>
                  <p className="text-gray-400">Please wait while we process your transaction...</p>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-20 h-20 mx-auto mb-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-white text-xl font-bold mb-2">Payment Approved!</h3>
                  <p className="text-gray-400 mb-4">We're finalizing your purchase now...</p>
                  <div className="w-16 h-1 mx-auto bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 animate-pulse"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}