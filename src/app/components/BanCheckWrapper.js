"use client";

import { usePathname } from 'next/navigation';
import BanCheck from './BanCheck';

export default function BanCheckWrapper({ children }) {
  const pathname = usePathname();
  const isBannedPage = pathname === '/banned';
  
  // Don't apply BanCheck on the banned page to avoid redirect loops
  if (isBannedPage) {
    return <>{children}</>;
  }
  
  // Apply BanCheck on all other pages
  return <BanCheck>{children}</BanCheck>;
} 