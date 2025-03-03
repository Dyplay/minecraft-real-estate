import { NextResponse } from 'next/server';
import { db, Query } from '../../../../../lib/appwrite'; // Re-use existing client

export async function GET() {
  try {
    console.log("Checking maintenance status...");
    
    // Re-use the database client from lib/appwrite.js
    const activeMaintenanceResponse = await db.listDocuments(
      "67a8e81100361d527692",  // Database ID
      "67c5acfe0021ca559d26",  // Collection ID
      [Query.equal("active", true)]
    );
    
    console.log("Maintenance status check successful");
    
    if (activeMaintenanceResponse.documents.length > 0) {
      const activeMaintenance = activeMaintenanceResponse.documents[0];
      return NextResponse.json({
        isMaintenanceActive: true,
        message: activeMaintenance.message || "Site is under maintenance"
      });
    } else {
      return NextResponse.json({ isMaintenanceActive: false });
    }
  } catch (error) {
    console.error("Server Error checking maintenance status:", error);
    // Default to not in maintenance mode if there's an error
    return NextResponse.json({ 
      isMaintenanceActive: false,
      error: error.message || String(error)
    });
  }
} 