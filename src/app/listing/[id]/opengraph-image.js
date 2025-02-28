import { ImageResponse } from 'next/og';
import { db } from '../../../../lib/appwrite';

export const runtime = 'edge';
export const alt = 'Property Listing';
export const size = {
  width: 1200,
  height: 630,
};

export default async function Image({ params }) {
  try {
    // Fetch listing data
    const listing = await db.getDocument(
      "67a8e81100361d527692",
      "67b2fdc20027f4d55440",
      params.id
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
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <h1
              style={{
                fontSize: 60,
                fontWeight: 'bold',
                color: 'white',
                marginBottom: 20,
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
              }}
            >
              {listing?.title || 'Property Listing'}
            </h1>
            <h2
              style={{
                fontSize: 40,
                color: 'white',
                opacity: 0.9,
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
              }}
            >
              Minecraft Real Estate
            </h2>
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
            Minecraft Real Estate
          </h1>
        </div>
      ),
      {
        ...size,
      }
    );
  }
} 