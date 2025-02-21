import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/NavBar";
import TrustedSellersProvider from "./components/TrustedSellersProvider"; // ✅ Import

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <TrustedSellersProvider> {/* ✅ Wrap inside Provider */}
          <Navbar />
          {children}
        </TrustedSellersProvider>
      </body>
    </html>
  );
}