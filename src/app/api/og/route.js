import { ImageResponse } from '@vercel/og';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || 'Minecraft Real Estate';
    const subtitle = searchParams.get('subtitle') || '';

    // Load the logo from a public URL (you'll need to replace this with your actual logo URL)
    const logoData = await fetch(new URL('/public/logo.png', request.url)).then(res => res.arrayBuffer());

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
            backgroundColor: '#111827', // dark background
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
              {title}
            </h1>
            {subtitle && (
              <h2
                style={{
                  fontSize: 40,
                  color: 'white',
                  opacity: 0.9,
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
                }}
              >
                {subtitle}
              </h2>
            )}
          </div>
          <img
            src={logoData}
            style={{
              position: 'absolute',
              bottom: 40,
              left: 40,
              width: 120,
              height: 'auto',
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
} 