import { ImageResponse } from 'next/og';
import { db, Query } from '../../../../lib/appwrite';

export const runtime = 'edge';
export const alt = 'User Profile';
export const size = {
  width: 1200,
  height: 630,
};

export default async function Image({ params }) {
  try {
    // Get user data
    const userResponse = await db.listDocuments(
      "67a8e81100361d527692",
      "67a900dc003e3b7524ee",
      [Query.equal("uuid", params.id)]
    );

    const userData = userResponse.documents[0];
    
    // Fetch Minecraft username
    const mcResponse = await fetch(`https://rigabank.dyplay.at/api/uuid?uuid=${params.id}`);
    const mcData = await mcResponse.json();
    const mcUsername = mcData.name;

    // Fetch user's listings count
    const listingsResponse = await db.listDocuments(
      "67a8e81100361d527692",
      "67b2fdc20027f4d55440",
      [Query.equal("sellerUUID", params.id)]
    );

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#111827',
            background: 'linear-gradient(to top, #F97316 0%, rgba(249, 115, 22, 0) 50%, #111827 100%)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              marginBottom: '20px',
            }}
          >
            <img
              src={`https://crafthead.net/helm/${params.id}`}
              width="120"
              height="120"
              style={{
                borderRadius: '16px',
                border: '4px solid #F97316',
              }}
            />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
              }}
            >
              <h1
                style={{
                  fontSize: 60,
                  fontWeight: 'bold',
                  color: 'white',
                  margin: 0,
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
                }}
              >
                {mcUsername}
              </h1>
              <p
                style={{
                  fontSize: 30,
                  color: '#F97316',
                  margin: 0,
                  opacity: 0.9,
                }}
              >
                {listingsResponse.documents.length} Properties Listed
              </p>
            </div>
          </div>
          {/* Logo */}
          <div
            style={{
              position: 'absolute',
              bottom: 40,
              left: 40,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div
              style={{
                width: '120px',
                height: '120px',
                backgroundColor: '#F97316',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px',
                fontWeight: 'bold',
              }}
            >
              MRE
            </div>
          </div>
        </div>
      ),
      {
        ...size,
      }
    );
  } catch (error) {
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#111827',
            background: 'linear-gradient(to top, #F97316 0%, rgba(249, 115, 22, 0) 50%, #111827 100%)',
          }}
        >
          <h1
            style={{
              fontSize: 60,
              fontWeight: 'bold',
              color: 'white',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
            }}
          >
            Minecraft Real Estate Profile
          </h1>
        </div>
      ),
      {
        ...size,
      }
    );
  }
} 