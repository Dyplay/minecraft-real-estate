import React from "react";

export default function Skeleton({ width = "100%", height = "1rem", className = "" }) {
  return <div className={`skeleton bg-gray-300 dark:bg-gray-700 animate-pulse ${className}`} style={{ width, height }}></div>;
}