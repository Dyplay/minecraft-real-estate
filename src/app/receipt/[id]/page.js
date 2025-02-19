"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "../../../../lib/appwrite";
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
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

// 🔹 PDF Receipt Document
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
    fontFamily: "Helvetica",
    backgroundColor: "#f8f8f8",
  },
  section: {
    marginBottom: 10,
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  text: {
    fontSize: 14,
    marginBottom: 5,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    fontSize: 10,
    textAlign: "center",
    color: "gray",
  }
});

const ReceiptPDF = ({ purchase, receiptCode }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>Purchase Receipt</Text>
        <Text style={styles.text}>Receipt ID: {purchase.$id}</Text>
        <Text style={styles.text}>Shop Name: {purchase.shopname}</Text>
        <Text style={styles.text}>Product: {purchase.productName}</Text>
        <Text style={styles.text}>Seller: {purchase.seller}</Text>
        <Text style={styles.text}>Buyer: {purchase.buyer}</Text>
        <Text style={styles.text}>Price: {purchase.price}€</Text>
        <Text style={styles.text}>Status: ✅ Completed</Text>
      </View>

      <View>
        <Text style={styles.title}>Payment Details</Text>
        <Text style={styles.text}>Payment Method: Riga International Bank Inc.</Text>
        <Text style={styles.text}>Transaction ID: {purchase.$id}</Text>
      </View>

      {/* 🔹 Validation Code at the Bottom */}
      <View style={styles.footer}>
        <Text>Unique Validation Code: {receiptCode || "Pending..."}</Text>
        <Text>Generated on: {new Date().toLocaleDateString()}</Text>
      </View>
    </Page>
  </Document>
);