import { ImageResponse } from 'next/og';
import { db, Query } from '../../../../lib/appwrite';

export const runtime = 'edge';
export const alt = 'Property Listing';
export const size = {
  width: 1200,
  height: 630,
};

export default async function Image({ params }) {
  try {
    const listing = await db.getDocument(
      "67a8e81100361d527692",
      "67b2fdc20027f4d55440",
      params.id
    );

    const sellerResponse = await db.listDocuments(
      "67a8e81100361d527692",
      "67a900dc003e3b7524ee",
      [Query.equal("uuid", listing.sellerUUID)]
    );
    const seller = sellerResponse.documents[0];

    const mcResponse = await fetch(`https://rigabank.dyplay.at/api/uuid?uuid=${listing.sellerUUID}`);
    const mcData = await mcResponse.json();
    const mcUsername = mcData.name;

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            backgroundColor: '#2E3440',
            padding: '32px',
          }}
        >
          {/* Left side - Main Image */}
          <div
            style={{
              width: '40%',
              height: '100%',
              position: 'relative',
              borderRadius: '16px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `url(${listing.imageUrls[0]})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          </div>

          {/* Right side - Content */}
          <div
            style={{
              flex: 1,
              marginLeft: '32px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }}
          >
            {/* Title and Description */}
            <div
              style={{
                borderLeft: '4px solid #F97316',
                paddingLeft: '16px',
                marginBottom: '24px',
              }}
            >
              <h1
                style={{
                  fontSize: 40,
                  fontWeight: 'bold',
                  color: 'white',
                  margin: '0 0 12px 0',
                }}
              >
                Listing - {listing.title}
              </h1>
              <p
                style={{
                  fontSize: 20,
                  color: '#E5E7EB',
                  margin: 0,
                  opacity: 0.9,
                }}
              >
                {listing.description.length > 120 
                  ? listing.description.substring(0, 120) + '...'
                  : listing.description}
              </p>
            </div>

            {/* Stats Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px',
                marginBottom: '24px',
              }}
            >
              <div
                style={{
                  backgroundColor: 'rgba(249, 115, 22, 0.1)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(249, 115, 22, 0.2)',
                }}
              >
                <p style={{ color: '#F97316', fontSize: 16, margin: '0 0 4px 0' }}>Price</p>
                <p style={{ color: 'white', fontSize: 24, fontWeight: 'bold', margin: 0 }}>
                  {new Intl.NumberFormat("de-DE").format(listing.price)}€
                </p>
              </div>
              <div
                style={{
                  backgroundColor: 'rgba(249, 115, 22, 0.1)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(249, 115, 22, 0.2)',
                }}
              >
                <p style={{ color: '#F97316', fontSize: 16, margin: '0 0 4px 0' }}>Location</p>
                <p style={{ color: 'white', fontSize: 24, fontWeight: 'bold', margin: 0 }}>
                  {listing.country || 'Not specified'}
                </p>
              </div>
            </div>

            {/* Seller Info */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid rgba(249, 115, 22, 0.2)',
              }}
            >
              <img
                src={`https://crafthead.net/helm/${listing.sellerUUID}`}
                width="48"
                height="48"
                style={{
                  borderRadius: '8px',
                  border: '2px solid #F97316',
                }}
              />
              <div>
                <p style={{ color: '#F97316', fontSize: 16, margin: '0 0 4px 0' }}>Seller</p>
                <p style={{ color: 'white', fontSize: 20, fontWeight: 'bold', margin: 0 }}>
                  {mcUsername}
                </p>
              </div>
            </div>

            {/* Bottom Bar */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(to right, #F97316, rgba(249, 115, 22, 0.2))',
                borderRadius: '2px',
              }}
            />
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
            backgroundColor: '#2E3440',
            padding: '32px',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <h1
            style={{
              fontSize: 48,
              fontWeight: 'bold',
              color: 'white',
              textAlign: 'center',
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