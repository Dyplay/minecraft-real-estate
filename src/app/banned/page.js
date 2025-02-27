"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";

export default function BannedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const banReason = searchParams.get("reason") || "Violation of terms of service";

  return (
    <div className="min-h-screen bg-red-900 flex flex-col items-center justify-center p-6 text-white">
      <div className="max-w-2xl w-full bg-gray-800/90 p-8 rounded-lg shadow-lg text-center">
        <div className="flex justify-center mb-6">
          <div className="relative w-[200px] h-[80px]">
            <Image
              src="/logo.png"
              alt="Logo"
              fill
              style={{ objectFit: "contain" }}
              className="opacity-50"
            />
          </div>
        </div>

        <h1 className="text-4xl font-bold mb-6">Account Banned</h1>
        
        <div className="mb-6 relative w-[150px] h-[150px] mx-auto">
          <Image
            src="/banned.png" 
            alt="Banned"
            fill
            style={{ objectFit: "contain" }}
          />
        </div>

        <p className="text-xl mb-4">
          Your account has been banned from accessing this service.
        </p>
        
        <div className="bg-red-700 p-4 rounded-lg mb-6">
          <h2 className="text-lg font-semibold mb-2">Reason for Ban:</h2>
          <p className="text-lg">{banReason}</p>
        </div>

        <p className="text-sm opacity-75 mb-6">
          If you believe this ban was issued in error, you may appeal by contacting our support team at <a href="mailto:support@rigabank.com" className="underline">support@rigabank.com</a>.
        </p>
      </div>
    </div>
  );
} 