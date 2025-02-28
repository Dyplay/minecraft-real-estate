"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { FaExclamationTriangle, FaHome, FaEnvelope } from "react-icons/fa";

export default function BannedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const banReason = searchParams.get("reason") || "Violation of terms of service";

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700">
        <div className="bg-orange-500 p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-black bg-opacity-20 rounded-full mb-4">
            <FaExclamationTriangle className="text-white text-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-white">Account Banned</h1>
        </div>
        
        <div className="p-8">
          <div className="flex justify-center mb-8">
            <div className="relative w-[120px] h-[120px]">
              <Image
                src="/banned.png" 
                alt="Banned"
                fill
                style={{ objectFit: "contain" }}
              />
            </div>
          </div>

          <div className="text-center mb-8">
            <p className="text-lg text-gray-300 mb-4">
              Your account has been banned from accessing this service.
            </p>
            
            <div className="bg-gray-700 p-6 rounded-lg mb-6">
              <h2 className="text-lg font-semibold text-gray-200 mb-2">Reason for Ban:</h2>
              <p className="text-lg text-gray-300 italic">"{banReason}"</p>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-6">
            <div className="text-center">
              <p className="text-gray-400 mb-6">
                If you believe this ban was issued in error, you may appeal by contacting our support team.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
                <a 
                  href="mailto:support@rigabank.com" 
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600 transition-colors"
                >
                  <FaEnvelope className="mr-2" />
                  Contact Support
                </a>
                <button 
                  onClick={() => router.push('/')}
                  className="inline-flex items-center justify-center px-6 py-3 border border-gray-600 text-base font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors"
                >
                  <FaHome className="mr-2" />
                  Return to Homepage
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 