"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { db } from "../../../../lib/appwrite";
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaDownload, FaReceipt, FaArrowLeft } from "react-icons/fa";
import Link from "next/link";

export default function ReceiptPage() {
  const router = useRouter();
  const params = useParams(); // Use useParams to get route parameters
  const id = params.id; // Access id from params
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPurchaseDetails() {
      if (!id) {
        setLoading(false);
        return;
      }
      
      try {
        console.log("Fetching receipt with ID:", id);
        const receiptData = await db.getDocument(
          "67a8e81100361d527692", // Database ID
          "67b6049900036a440ded", // Collection ID
          id // Use the ID from the URL params
        );
        console.log("Receipt data:", receiptData);
        setReceipt(receiptData);
      } catch (error) {
        console.error("Error fetching receipt:", error);
        toast.error("Failed to fetch receipt details");
      } finally {
        setLoading(false);
      }
    }

    fetchPurchaseDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading receipt...</p>
        </div>
      </div>
    );
  }
  
  if (!receipt) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-700 text-center max-w-md">
          <div className="w-16 h-16 mx-auto bg-red-500 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4">Receipt Not Found</h2>
          <p className="text-gray-400 mb-6">The receipt you're looking for doesn't exist or has been removed.</p>
          <Link href="/dashboard" className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition inline-flex items-center">
            <FaArrowLeft className="mr-2" /> Back to Dashboard
          </Link>
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
                    {new Date(receipt.$createdAt).toLocaleDateString()} at {new Date(receipt.$createdAt).toLocaleTimeString()}
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
                  <p className="mb-2"><span className="text-gray-400">Shop Name:</span> <span className="font-semibold">{receipt.shopname}</span></p>
                  <p className="mb-2"><span className="text-gray-400">Product:</span> <span className="font-semibold">{receipt.productName}</span></p>
                  <p><span className="text-gray-400">Price:</span> <span className="font-semibold text-orange-500">{receipt.price}€</span></p>
                </div>
              </div>
              
              <div>
                <h4 className="text-gray-400 text-sm mb-2">Transaction Parties</h4>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <p className="mb-2"><span className="text-gray-400">Seller:</span> <span className="font-semibold">{receipt.seller}</span></p>
                  <p><span className="text-gray-400">Buyer:</span> <span className="font-semibold">{receipt.buyer}</span></p>
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
                document={<ReceiptPDF receipt={receipt} />}
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

const ReceiptPDF = ({ receipt }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header with Logo */}
      <View style={styles.header}>
        <Image
          src="/logo_black.png"  // Using the same logo as navbar
          style={styles.logo}
        />
        <View style={styles.headerRight}>
          <Text style={{ fontSize: 10, color: '#64748b' }}>Receipt #{receipt.$id}</Text>
          <Text style={{ fontSize: 10, color: '#64748b' }}>
            {new Date(receipt.$createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>Purchase Receipt</Text>

      {/* Main Content */}
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Shop Name</Text>
          <Text style={styles.value}>{receipt.shopname}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Product</Text>
          <Text style={styles.value}>{receipt.productName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Seller</Text>
          <Text style={styles.value}>{receipt.seller}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Buyer</Text>
          <Text style={styles.value}>{receipt.buyer}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Price</Text>
          <Text style={styles.value}>{receipt.price}€</Text>
        </View>
      </View>

      {/* Status */}
      <Text style={styles.status}>✅ Transaction Complete</Text>

      {/* Validation Code */}
      <View style={styles.validationCode}>
        <Text style={{ fontSize: 10, color: '#64748b' }}>Validation Code</Text>
        <Text style={{ fontSize: 12, marginTop: 5 }}>{receipt.$id}</Text>
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