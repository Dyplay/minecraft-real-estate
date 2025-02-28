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
    const userResponse = await db.listDocuments(
      "67a8e81100361d527692",
      "67a900dc003e3b7524ee",
      [Query.equal("uuid", params.id)]
    );

    const userData = userResponse.documents[0];
    
    const mcResponse = await fetch(`https://rigabank.dyplay.at/api/uuid?uuid=${params.id}`);
    const mcData = await mcResponse.json();
    const mcUsername = mcData.name;

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
            backgroundColor: '#2E3440',
            padding: '32px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background Gradient */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '70%',
              height: '100%',
              background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(249, 115, 22, 0) 100%)',
              zIndex: 0,
            }}
          />

          {/* Main Content */}
          <div
            style={{
              display: 'flex',
              width: '100%',
              zIndex: 1,
            }}
          >
            {/* Left Column - Profile Info */}
            <div
              style={{
                width: '40%',
                display: 'flex',
                flexDirection: 'column',
                borderRight: '1px solid rgba(249, 115, 22, 0.2)',
                paddingRight: '32px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  marginBottom: '24px',
                }}
              >
                <img
                  src={`https://crafthead.net/helm/${params.id}`}
                  width="120"
                  height="120"
                  style={{
                    borderRadius: '16px',
                    border: '3px solid #F97316',
                  }}
                />
                <div>
                  <h1
                    style={{
                      fontSize: 48,
                      fontWeight: 'bold',
                      color: 'white',
                      margin: '0 0 8px 0',
                    }}
                  >
                    {mcUsername}
                  </h1>
                  <p
                    style={{
                      fontSize: 20,
                      color: '#F97316',
                      margin: 0,
                      opacity: 0.9,
                    }}
                  >
                    Minecraft Real Estate
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div
                style={{
                  display: 'grid',
                  gap: '16px',
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
                  <p style={{ color: '#F97316', fontSize: 16, margin: '0 0 4px 0' }}>Properties Listed</p>
                  <p style={{ color: 'white', fontSize: 32, fontWeight: 'bold', margin: 0 }}>
                    {listingsResponse.documents.length}
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
                  <p style={{ color: '#F97316', fontSize: 16, margin: '0 0 4px 0' }}>Member Since</p>
                  <p style={{ color: 'white', fontSize: 24, fontWeight: 'bold', margin: 0 }}>
                    {new Date(userData.$createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Listings Preview */}
            <div
              style={{
                flex: 1,
                paddingLeft: '32px',
              }}
            >
              <h2
                style={{
                  fontSize: 24,
                  color: '#F97316',
                  margin: '0 0 16px 0',
                  fontWeight: 'bold',
                }}
              >
                Recent Listings
              </h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '16px',
                }}
              >
                {listingsResponse.documents.slice(0, 4).map((listing, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor: 'rgba(249, 115, 22, 0.1)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '1px solid rgba(249, 115, 22, 0.2)',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '120px',
                        backgroundImage: `url(${listing.imageUrls[0]})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                    <div style={{ padding: '12px' }}>
                      <p style={{ color: 'white', fontSize: 16, margin: '0 0 4px 0', fontWeight: 'bold' }}>
                        {listing.title}
                      </p>
                      <p style={{ color: '#F97316', fontSize: 14, margin: 0 }}>
                        {new Intl.NumberFormat("de-DE").format(listing.price)}€
                      </p>
                    </div>
                  </div>
                ))}
              </div>
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
            }}
          />
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