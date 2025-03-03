"use client";

import { Suspense, useEffect } from "react";
import ListingsComponent from "../components/ListingsComp"; // ✅ Create a separate component
import { captureEvent } from '../../../lib/posthog';

export default function ListingsPage() {
  useEffect(() => {
    // This ensures styles are properly applied after hydration
    document.body.classList.add('hydrated');
    
    // Track page view
    captureEvent('listings_page_viewed');
    
    return () => {
      document.body.classList.remove('hydrated');
    };
  }, []);

  return (
    <Suspense fallback={<p>Loading listings...</p>}>
      <ListingsComponent />
    </Suspense>
  );
}