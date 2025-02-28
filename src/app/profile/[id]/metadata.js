import { db, Query } from '../../../../lib/appwrite';

export async function generateMetadata({ params }) {
  try {
    // Get user data
    const userResponse = await db.listDocuments(
      "67a8e81100361d527692",
      "67a900dc003e3b7524ee",
      [Query.equal("uuid", params.id)]
    );

    if (userResponse.documents.length === 0) {
      return {
        title: 'Profile Not Found - Minecraft Real Estate',
        description: 'This user profile could not be found.',
      };
    }

    const userData = userResponse.documents[0];
    
    // Fetch Minecraft username
    const mcResponse = await fetch(`https://rigabank.dyplay.at/api/uuid?uuid=${params.id}`);
    const mcData = await mcResponse.json();
    const mcUsername = mcData.name;

    // Fetch user's listings
    const listingsResponse = await db.listDocuments(
      "67a8e81100361d527692",
      "67b2fdc20027f4d55440",
      [Query.equal("sellerUUID", params.id)]
    );

    const title = `${mcUsername}'s Profile - Minecraft Real Estate`;
    const description = `View ${mcUsername}'s profile and their ${listingsResponse.documents.length} property listings on Minecraft Real Estate.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [{
          url: `/profile/${params.id}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: 'Profile OpenGraph Image',
        }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [`/profile/${params.id}/opengraph-image`],
      },
    };
  } catch (error) {
    return {
      title: 'User Profile - Minecraft Real Estate',
      description: 'View user profile and their property listings on Minecraft Real Estate.',
    };
  }
} 