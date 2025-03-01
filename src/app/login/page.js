"use client";

import LoginButton from "../components/LoginButton";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 via-transparent to-transparent" />
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-md bg-gray-800 rounded-2xl p-8 shadow-xl border border-orange-500/20">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="CraftEstate Logo" className="w-30 h-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back!</h1>
          <p className="text-gray-400">Sign in to access your CraftEstate account</p>
        </div>

        {/* Login Button */}
        <div className="space-y-4">
          <LoginButton />
          
          {/* Additional Info */}
          <div className="mt-6 text-center text-sm text-gray-400">
            <p>By signing in, you agree to our</p>
            <div className="flex justify-center gap-2 mt-1">
              <a href="/terms" className="text-orange-500 hover:text-orange-400">Terms of Service</a>
              <span>&</span>
              <a href="/privacy" className="text-orange-500 hover:text-orange-400">Privacy Policy</a>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="text-orange-500 font-semibold mb-1">Secure Login</div>
            <p className="text-sm text-gray-300">Protected by Discord's OAuth system</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="text-orange-500 font-semibold mb-1">Quick Access</div>
            <p className="text-sm text-gray-300">One-click login with Discord</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-6 text-center text-sm text-gray-400">
        <p>Need help? Contact our support team</p>
        <a href="mailto:support@minecraft-real-estate.com" className="text-orange-500 hover:text-orange-400">
          support@minecraft-real-estate.com
        </a>
      </div>
    </div>
  );
}