"use client";

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaTools, FaHome } from 'react-icons/fa';

export default function MaintenancePage() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    const maintenanceMessage = searchParams.get('message') || 'Site is currently under maintenance.';
    setMessage(maintenanceMessage);
  }, [searchParams]);
  
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-4 py-16">
      <div className="text-orange-500 mb-8">
        <FaTools className="text-8xl mx-auto" />
      </div>
      
      <h1 className="text-4xl font-bold text-white text-center mb-4">Maintenance in Progress</h1>
      
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-md w-full mb-8">
        <p className="text-gray-300 text-center">{message}</p>
      </div>
      
      <div className="mt-12 text-gray-500 text-sm text-center">
        <p>© {new Date().getFullYear()} CraftEstate</p>
      </div>
    </div>
  );
} 