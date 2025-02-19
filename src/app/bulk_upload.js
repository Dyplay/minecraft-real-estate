import { Client, Databases, ID } from "appwrite";
import fs from "fs";
import csv from "csv-parser"; // Install with `npm install csv-parser`

// ✅ Initialize Appwrite Client
const client = new Client();
client.setEndpoint("https://cloud.appwrite.io/v1").setProject("67a8e6460025b0417582");

const db = new Databases(client);
const DATABASE_ID = "67a8e81100361d527692";
const COLLECTION_ID = "receipt_ids";

// ✅ Function to Insert Data into Appwrite
async function insertCode(country, code) {
  try {
    await db.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
      country,
      code,
      used: false,
    });
    console.log(`✅ Inserted: ${code} (${country})`);
  } catch (error) {
    console.error(`🚨 Error inserting ${code}:`, error);
  }
}

// ✅ Process CSV File
function processCSV() {
  fs.createReadStream("receipt_codes.csv")
    .pipe(csv())
    .on("data", async (row) => {
      await insertCode(row.country, row.code);
    })
    .on("end", () => {
      console.log("✅ All receipt codes have been uploaded.");
    });
}

// ✅ Process JSON File
function processJSON() {
  const data = JSON.parse(fs.readFileSync("receipt_codes.json", "utf-8"));
  data.forEach(async ({ country, code }) => {
    await insertCode(country, code);
  });
}

// ✅ Choose Format to Upload
const FILE_TYPE = "csv"; // Change to "json" if using JSON
if (FILE_TYPE === "csv") processCSV();
else processJSON();