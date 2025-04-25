"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../../../lib/appwrite";
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaDownload, FaReceipt, FaArrowLeft } from "react-icons/fa";
import Link from "next/link";

export default function ReceiptPage() {
  const { id } = useParams();
  const router = useRouter();
  const [purchaseData, setPurchaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPurchasePopup, setShowPurchasePopup] = useState(false);
  const [approvalStep, setApprovalStep] = useState("initial");

  useEffect(() => {
    async function fetchPurchaseDetails() {
      try {
        // Check if ID is valid
        if (!id || id === "undefined") {
          console.error("Invalid receipt ID");
          setError("Invalid receipt ID. Redirecting to home...");
          setTimeout(() => router.push("/"), 3000);
          return;
        }

        console.log("Fetching receipt with ID:", id);
        
        const purchaseDoc = await db.getDocument(
          "67a8e81100361d527692",
          "67b6049900036a440ded",
          id
        );

        setPurchaseData(purchaseDoc);
      } catch (error) {
        console.error("Error fetching receipt:", error);
        setError("Could not find the receipt. Redirecting to home...");
        setTimeout(() => router.push("/"), 3000);
      } finally {
        setLoading(false);
      }
    }

    fetchPurchaseDetails();
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md shadow-lg border border-gray-700">
          <h1 className="text-2xl font-bold text-orange-500 mb-4">Error</h1>
          <p className="mb-4">{error}</p>
          <button 
            onClick={() => router.push("/")}
            className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded transition"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
      <ToastContainer
        position="bottom-left"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        pauseOnHover
        draggable
        theme="dark"
      />
      
      <div className="w-full max-w-4xl">
        <Link href="/dashboard" className="text-gray-400 hover:text-orange-500 transition inline-flex items-center mb-6">
          <FaArrowLeft className="mr-2" /> Back to Dashboard
        </Link>
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-orange-500">Purchase Receipt</h2>
          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">
            Completed
          </span>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
          {/* Header */}
          <div className="bg-gray-700 p-6 border-b border-gray-600">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <FaReceipt className="text-orange-500 text-2xl mr-3" />
                <div>
                  <h3 className="text-xl font-semibold">Transaction #{id.substring(0, 8)}</h3>
                  <p className="text-gray-400 text-sm">
                    {new Date(purchaseData.$createdAt).toLocaleDateString()} at {new Date(purchaseData.$createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Receipt ID</p>
                <p className="font-mono text-xs bg-gray-900 px-2 py-1 rounded">{id}</p>
              </div>
            </div>
          </div>
          
          {/* Receipt Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-gray-400 text-sm mb-2">Property Details</h4>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <p className="mb-2"><span className="text-gray-400">Shop Name:</span> <span className="font-semibold">{purchaseData.shopname}</span></p>
                  <p className="mb-2"><span className="text-gray-400">Product:</span> <span className="font-semibold">{purchaseData.productName}</span></p>
                  <p><span className="text-gray-400">Price:</span> <span className="font-semibold text-orange-500">{purchaseData.price}€</span></p>
                </div>
              </div>
              
              <div>
                <h4 className="text-gray-400 text-sm mb-2">Transaction Parties</h4>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <p className="mb-2"><span className="text-gray-400">Seller:</span> <span className="font-semibold">{purchaseData.seller}</span></p>
                  <p><span className="text-gray-400">Buyer:</span> <span className="font-semibold">{purchaseData.buyer}</span></p>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="text-gray-400 text-sm mb-2">Transaction Status</h4>
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold">Transaction Complete</p>
                    <p className="text-sm text-gray-400">Payment has been processed and confirmed</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <PDFDownloadLink
                document={<ReceiptPDF purchaseData={purchaseData} />}
                fileName={`receipt-${id}.pdf`}
                className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition inline-flex items-center"
              >
                {({ loading }) => (
                  <>
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    ) : (
                      <FaDownload className="mr-2" />
                    )}
                    {loading ? "Generating PDF..." : "Download Receipt PDF"}
                  </>
                )}
              </PDFDownloadLink>
            </div>
          </div>
          
          {/* Footer */}
          <div className="bg-gray-700 p-4 text-center border-t border-gray-600">
            <p className="text-sm text-gray-400">
              Thank you for using  CraftEstate. For any questions, please contact support.
            </p>
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
              {approvalStep === "initial" ? (
                <>
                  <div className="mb-6">
                    <p className="text-gray-300 mb-4">Please confirm your purchase:</p>
                    <div className="bg-gray-700 rounded-lg overflow-hidden">
                      <div className="p-4 border-b border-gray-600">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Property:</span>
                          <span className="text-white font-bold">{purchaseData.productName}</span>
                        </div>
                      </div>
                      <div className="p-4 border-b border-gray-600">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Price:</span>
                          <span className="text-orange-500 font-bold">{new Intl.NumberFormat("de-DE").format(purchaseData.price)}€</span>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Seller:</span>
                          <span className="text-white">{purchaseData.seller}</span>
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
                      onClick={() => setApprovalStep("approving")}
                      className="flex-1 py-3 px-4 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors flex items-center justify-center"
                    >
                      Confirm Purchase
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </>
              ) : approvalStep === "approving" ? (
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

// 🎨 Enhanced PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    borderBottom: '1 solid #e0e0e0',
    paddingBottom: 20,
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 50,
    objectFit: 'contain',
  },
  headerRight: {
    textAlign: 'right',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#f97316', // Orange color
    textAlign: 'center',
  },
  section: {
    margin: 10,
    padding: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottom: '1 solid #e5e7eb',
  },
  label: {
    fontSize: 12,
    color: '#64748b',
    width: '30%',
  },
  value: {
    fontSize: 12,
    color: '#1e293b',
    width: '70%',
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 10,
    borderTop: '1 solid #e0e0e0',
    paddingTop: 20,
  },
  validationCode: {
    backgroundColor: '#f1f5f9',
    padding: 15,
    marginTop: 30,
    borderRadius: 5,
    textAlign: 'center',
  },
  status: {
    color: '#059669', // Green color
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  }
});

const ReceiptPDF = ({ purchaseData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header with Logo */}
      <View style={styles.header}>
        <Image
          src="/logo_black.png"  // Using the same logo as navbar
          style={styles.logo}
        />
        <View style={styles.headerRight}>
          <Text style={{ fontSize: 10, color: '#64748b' }}>Receipt #{purchaseData.$id}</Text>
          <Text style={{ fontSize: 10, color: '#64748b' }}>
            {new Date(purchaseData.$createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>Purchase Receipt</Text>

      {/* Main Content */}
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Shop Name</Text>
          <Text style={styles.value}>{purchaseData.shopname}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Product</Text>
          <Text style={styles.value}>{purchaseData.productName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Seller</Text>
          <Text style={styles.value}>{purchaseData.seller}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Buyer</Text>
          <Text style={styles.value}>{purchaseData.buyer}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Price</Text>
          <Text style={styles.value}>{purchaseData.price}€</Text>
        </View>
      </View>

      {/* Status */}
      <Text style={styles.status}>✅ Transaction Complete</Text>

      {/* Validation Code */}
      <View style={styles.validationCode}>
        <Text style={{ fontSize: 10, color: '#64748b' }}>Validation Code</Text>
        <Text style={{ fontSize: 12, marginTop: 5 }}>{purchaseData.$id}</Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Generated on {new Date().toLocaleDateString()}</Text>
        <Text style={{ marginTop: 5 }}>Minecraft Real Estate</Text>
        <Text style={{ marginTop: 5 }}>Thank you for your business!</Text>
      </View>
    </Page>
  </Document>
);