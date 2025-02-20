"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, Query, storage, account, ID, client } from "../../../../lib/appwrite";
import Skeleton from "../../../app/components/ListingSkeleton";
import Image from "next/image";
import { toast } from "react-toastify";

export default function ListingPage() {
  const router = useRouter();
  const { id } = useParams(); // ✅ Get ID from URL params

  const [listing, setListing] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [user, setUser] = useState(null); // ✅ Add user state
  const [review, setReview] = useState({ rating: 5, comment: "" });
  const [seller, setSeller] = useState(null);
  const [showPurchasePopup, setShowPurchasePopup] = useState(false);
  const [purchaseStep, setPurchaseStep] = useState("Authenticating request...");
  const [loading, setLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState([]); // ✅ Store image URLs
  const [currentImage, setCurrentImage] = useState(null); // ✅ Track selected image

  const countryFlags = {
    Riga: "/flags/riga.webp", // Replace with actual flag path
    Lavantal: "/flags/lavantal.png", // Replace with actual flag path
  };

  useEffect(() => {
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
  }, [id]);

  async function handlePurchase() {
    if (!user || !user.uuid) {
      toast.error("⚠ You need to be logged in to make a purchase.");
      return;
    }
  
    if (user.uuid === listing.sellerUUID) {
      toast.error("❌ You cannot buy your own listing!");
      return;
    }
  
    setShowPurchasePopup(true);
    setPurchaseStep("Authenticating request...");
  
    try {
      // ✅ Fetch buyer's account balance
      const buyerAccountResponse = await db.listDocuments("67a8e81100361d527692", "67b093040006e14307e1", [
        Query.equal("user_name", user.username),
      ]);
  
      if (buyerAccountResponse.documents.length === 0) {
        toast.error("❌ Buyer account not found!");
        setShowPurchasePopup(false);
        return;
      }
  
      const buyerAccount = buyerAccountResponse.documents[0];
  
      if (buyerAccount.balance < listing.price) {
        toast.error("❌ Insufficient funds! Please top up your account.");
        setShowPurchasePopup(false);
        return;
      }
  
      // ✅ Create purchase document
      const purchaseId = ID.unique();
      await db.createDocument("67a8e81100361d527692", "67b6049900036a440ded", purchaseId, {
        shopname: listing.title,
        seller: seller.username,
        sellerUUID: seller.uuid,
        buyerUUID: user.uuid,
        buyer: user.username,
        confirmed: false,
        price: listing.price,
        productName: listing.title,
      });
  
      setPurchaseStep("Waiting for Bank Confirmation...");
      listenForPurchaseConfirmation(purchaseId, buyerAccount.$id, seller.uuid);
    } catch (error) {
      console.error("🚨 Error processing purchase:", error);
      toast.error("❌ Failed to process purchase.");
      setShowPurchasePopup(false);
    }
  }  
  
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

  async function listenForPurchaseConfirmation(purchaseId, buyerAccountId, sellerUUID) {
    console.log(`🔄 Listening for purchase confirmation for ID: ${purchaseId}`);
  
    const unsubscribe = client.subscribe(
      `databases.67a8e81100361d527692.collections.67b6049900036a440ded.documents`,
      async (response) => {
        console.log("📩 Received real-time update:", response);
  
        if (response.events.includes(`databases.*.collections.67b6049900036a440ded.documents.${purchaseId}.update`)) {
          if (response.payload.confirmed) {
            console.log("✅ Purchase confirmed!");
  
            // ✅ Fetch seller's account balance
            const sellerAccountResponse = await db.listDocuments(
              "67a8e81100361d527692", // Database ID
              "67b093040006e14307e1", // User Accounts Collection ID
              [Query.equal("user_name", seller.username)] // ✅ Match `user_name` instead of `username`
            );            
  
            if (sellerAccountResponse.documents.length === 0) {
              console.error("❌ Seller account not found!");
              return;
            }
  
            const sellerAccount = sellerAccountResponse.documents[0];
  
            try {
              // ✅ Deduct money from buyer
              await db.updateDocument("67a8e81100361d527692", "67b093040006e14307e1", buyerAccountId, {
                balance: sellerAccount.balance - response.payload.price,
              });
  
              // ✅ Add money to seller
              await db.updateDocument("67a8e81100361d527692", "67b093040006e14307e1", sellerAccount.$id, {
                balance: sellerAccount.balance + response.payload.price,
              });
  
              // ✅ Mark listing as sold
              await db.updateDocument("67a8e81100361d527692", "67b2fdc20027f4d55440", listing.$id, {
                available: false,
              });
  
              // ✅ Redirect to receipt page
              setPurchaseStep("✅ Purchase Confirmed! Redirecting to receipt...");
              setTimeout(() => {
                setShowPurchasePopup(false);
                window.location.href = `/receipt/${purchaseId}`;
              }, 3000);
            } catch (error) {
              console.error("🚨 Error updating balances:", error);
              toast.error("❌ Failed to transfer funds.");
            }
          }
        }
      }
    );
  
    return unsubscribe;
  }  

  if (loading) return <Skeleton />;
  if (!listing) return <p>Listing not found.</p>;

  return (
    <div className="container mx-auto p-6 flex flex-col lg:flex-row gap-8">
      {showPurchasePopup && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-[9999]">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center w-[90%] max-w-md z-[10000]">
            <h2 className="text-xl font-semibold text-black">{purchaseStep}</h2>
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mt-4"></div>
          </div>
        </div>
      )}
    {/* 🔹 Left Section - Image Gallery */}
    <div className="lg:w-2/3">
      {/* Main Image Display */}
      <div className="relative">
        <Image
            src={currentImage}
            alt="Main Listing Image"
            width={1000}
            height={600}
            className="rounded-lg shadow-lg object-cover w-full h-[50vh] md:h-[60vh] lg:h-[515px]"
          />
      </div>
  
      {/* Thumbnail Navigation */}
      <div className="mt-4 flex justify-center gap-2 overflow-x-auto">
        {imageUrls.map((url, index) => (
          <Image
          key={index}
          src={url}
          width={120}  // Adjusted for consistency
          height={80}  // Adjusted to match aspect ratio
          alt={`Thumbnail ${index + 1}`}
          className={`cursor-pointer rounded-lg shadow-md transition ${
            currentImage === url ? "border-4 border-blue-500" : "opacity-75"
          } object-cover w-[120px] h-[80px]`} // ✅ Maintain aspect ratio
          onClick={() => setCurrentImage(url)}
        />        
        ))}
      </div>
    </div>
  
   {/* 🔹 Right Section - Details & Purchase */}
<div className="lg:w-1/3 bg-white p-6 shadow-lg rounded-lg border">
{user?.uuid === listing.sellerUUID && (
  <div className="flex items-center bg-yellow-200 text-yellow-700 px-3 py-1 rounded-md text-sm mb-2">
    🧐 This is your listing
  </div>
)}

  <h1 className="text-3xl font-bold text-black">{listing.title}</h1>
  <p className="mt-2 text-gray-600">{listing.description}</p>
  <p className="mt-2 text-gray-600 flex items-center">
    Country Location: {listing.country}
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
  <p className="text-2xl text-blue-600 font-semibold mt-4">
    Price: {new Intl.NumberFormat("de-DE").format(listing.price)}€
  </p>

  {/* 🔹 Availability Status */}
  <div
    className={`mt-4 p-3 rounded-lg text-center font-semibold text-white ${
      listing.available ? "bg-red-500" : "bg-green-500"
    }`}
  >
    {listing.available ? "❌ Not Available" : "✅ Available"}
  </div>

  {/* 🔹 Buy Button (Disabled if not available) */}
  <button
    className={`w-full mt-4 py-3 rounded-lg text-white font-bold transition ${
      listing.available || !user || user.uuid === listing.sellerUUID
        ? "bg-gray-400 cursor-not-allowed"
        : "bg-blue-500 hover:bg-blue-600"
    }`}
    disabled={listing.available || !user} // ✅ Disable if user not loaded
    onClick={handlePurchase}
  >
    {user ? "Buy Now" : <div className="w-7 h-7 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>} 
  </button>

  {/* 🔹 Seller Information */}
  {seller && (
    <div className="mt-6 flex items-center gap-4 border-t pt-4">
      <Image
        src={`https://crafthead.net/helm/${seller.uuid}/100`}
        width={50}
        height={50}
        className="rounded-md border border-gray-300"
        alt="Seller Avatar"
      />
      <div>
        <p className="text-lg font-semibold text-black">{seller.username}</p>
        <p className="text-sm text-gray-500">Seller UUID: {seller.uuid}</p>
      </div>
    </div>
  )}

  {/* 🔹 Reviews Section */}
<div className="mt-8">
  <h3 className="text-2xl font-semibold text-black">Reviews ({reviews.length})</h3>

  {reviews.length > 0 ? (
    <div className="mt-4 space-y-4">
      {reviews.map((review, index) => (
        <div key={index} className="p-4 bg-white border rounded-lg shadow">
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
              <p className="font-semibold text-black">{review.username}</p>
              <p className="text-sm text-gray-500">{new Date(review.timestamp).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Star Rating */}
          <div className="mt-2 text-yellow-400">
            {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
          </div>

          {/* Review Comment */}
          <p className="mt-2 text-gray-700">{review.comment}</p>
        </div>
      ))}
    </div>
  ) : (
    <p className="text-gray-500 mt-2">No reviews yet. Be the first to review!</p>
  )}
</div>

{/* 🔹 Review Submission */}
<div className="mt-6 p-6 bg-gray-100 rounded-lg shadow text-black">
  <h3 className="text-xl font-semibold">Leave a Review</h3>
  <p className="text-sm text-gray-500">Share your experience with this listing.</p>

  {/* Star Rating Selection */}
  <div className="flex gap-2 mt-3">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        onClick={() => setReview({ ...review, rating: star })}
        className={`text-2xl ${review.rating >= star ? "text-yellow-400" : "text-gray-300"}`}
      >
        ★
      </button>
    ))}
  </div>

  {/* Review Comment Input */}
  <div className="relative mt-3">
    <textarea
      placeholder="Write your review..."
      className="w-full p-2 bg-white border rounded resize-none"
      maxLength={1000} // ✅ Limits input to 1000 characters
      value={review.comment}
      onChange={(e) => setReview({ ...review, comment: e.target.value })}
    />
    
    {/* Character Counter */}
    <p className="absolute bottom-2 right-3 text-sm text-gray-400">
      {review.comment.length}/1000
    </p>
  </div>

  {/* Submit Button */}
  <button
    onClick={submitReview} // ✅ Now correctly defined
    className="mt-3 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
  >
    Submit Review
  </button>
</div>

    </div>
  </div>  
  );
}