"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { FaExclamationTriangle, FaHome, FaEnvelope } from "react-icons/fa";

function BannedPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [countdown, setCountdown] = useState(30);
  const reason = searchParams.get("reason") || "Violation of terms of service";

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-8">
        <div className="text-center">
          <Image
            src="/banned.png"
            width={150}
            height={150}
            alt="Banned"
            className="mx-auto mb-6"
          />
          <h1 className="text-3xl font-bold text-red-500 mb-4">Account Banned</h1>
          <p className="text-xl text-gray-300 mb-6">
            Your account has been banned for the following reason:
          </p>
          <div className="bg-gray-700 p-4 rounded-lg mb-6">
            <p className="text-white text-lg">{reason}</p>
          </div>
          <p className="text-gray-400 mb-8">
            Redirecting to homepage in {countdown} seconds...
          </p>
          <div className="space-y-4">
            <p className="text-gray-300">
              If you believe this is a mistake, please contact support:
            </p>
            <a
              href="mailto:contact.dyplay@gmail.com"
              className="text-orange-500 hover:text-orange-400 transition"
            >
              contact.dyplay@gmail.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BannedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <BannedPageContent />
    </Suspense>
  );
} 