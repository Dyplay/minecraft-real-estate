"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "../../../../lib/appwrite";
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { toast } from "react-toastify";

export default function ReceiptPage() {
  const { id } = useParams(); // ✅ Get the purchase ID from URL params
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPurchaseDetails() {
      try {
        const purchaseData = await db.getDocument(
          "67a8e81100361d527692",
          "67b6049900036a440ded",
          id
        );

        if (!purchaseData.confirmed) {
          toast.error("🚨 Purchase not confirmed yet!");
          return;
        }

        setPurchase(purchaseData);
      } catch (error) {
        toast.error("🚨 Error fetching purchase details:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPurchaseDetails();
  }, [id]);

  if (loading) return <p className="text-center text-gray-400">Loading receipt...</p>;
  if (!purchase) return <p className="text-center text-red-500">Invalid receipt.</p>;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
      <h2 className="text-4xl font-bold mb-6">Purchase Receipt</h2>

      <div className="bg-white text-black p-6 rounded-lg shadow-md w-full max-w-lg">
        <p className="text-lg"><strong>Receipt ID:</strong> {id}</p>
        <p className="text-lg"><strong>Shop Name:</strong> {purchase.shopname}</p>
        <p className="text-lg"><strong>Product:</strong> {purchase.productName}</p>
        <p className="text-lg"><strong>Seller:</strong> {purchase.seller}</p>
        <p className="text-lg"><strong>Buyer:</strong> {purchase.buyer}</p>
        <p className="text-lg"><strong>Price:</strong> {purchase.price}€</p>
        <p className="text-lg"><strong>Status:</strong> ✅ Completed</p>
      </div>

      <PDFDownloadLink
        document={<ReceiptPDF purchase={purchase} />}
        fileName={`receipt-${id}.pdf`}
        className="mt-6 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
      >
        {({ loading }) => (loading ? "Generating PDF..." : "Download Receipt PDF")}
      </PDFDownloadLink>
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
    color: '#2563eb', // Blue color
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

const ReceiptPDF = ({ purchase }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header with Logo */}
      <View style={styles.header}>
        <Image
          src="/logo_black.png"  // Using the same logo as navbar
          style={styles.logo}
        />
        <View style={styles.headerRight}>
          <Text style={{ fontSize: 10, color: '#64748b' }}>Receipt #{purchase.$id}</Text>
          <Text style={{ fontSize: 10, color: '#64748b' }}>
            {new Date(purchase.$createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>Purchase Receipt</Text>

      {/* Main Content */}
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Shop Name</Text>
          <Text style={styles.value}>{purchase.shopname}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Product</Text>
          <Text style={styles.value}>{purchase.productName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Seller</Text>
          <Text style={styles.value}>{purchase.seller}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Buyer</Text>
          <Text style={styles.value}>{purchase.buyer}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Price</Text>
          <Text style={styles.value}>{purchase.price}€</Text>
        </View>
      </View>

      {/* Status */}
      <Text style={styles.status}>✅ Transaction Complete</Text>

      {/* Validation Code */}
      <View style={styles.validationCode}>
        <Text style={{ fontSize: 10, color: '#64748b' }}>Validation Code</Text>
        <Text style={{ fontSize: 12, marginTop: 5 }}>{purchase.$id}</Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Generated on {new Date().toLocaleDateString()}</Text>
        <Text style={{ marginTop: 5 }}>RigaBank International Real Estate</Text>
        <Text style={{ marginTop: 5 }}>Thank you for your business!</Text>
      </View>
    </Page>
  </Document>
);