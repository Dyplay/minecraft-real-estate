"use client";

import { Suspense } from "react";
import ListingsComponent from "../components/ListingsComp"; // ✅ Create a separate component

export default function ListingsPage() {
  return (
    <Suspense fallback={<p>Loading listings...</p>}>
      <ListingsComponent />
    </Suspense>
  );
}