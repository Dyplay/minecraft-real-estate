import { db } from '../../../../lib/appwrite';
import { Query } from 'appwrite';

export async function generateMetadata({ params }) {
  try {
    // Fetch listing data
    const listing = await db.getDocument(
      "67a8e81100361d527692",
      "67b2fdc20027f4d55440",
      params.id
    );

    // Fetch seller data
    const sellerResponse = await db.listDocuments(
      "67a8e81100361d527692",
      "67a900dc003e3b7524ee",
      [Query.equal("uuid", listing.sellerUUID)]
    );
    const seller = sellerResponse.documents[0];

    // Format price
    const formattedPrice = new Intl.NumberFormat("de-DE").format(listing.price) + "€";

    return {
      title: `${listing.title} - Minecraft Real Estate`,
      description: listing.description,
      openGraph: {
        title: `${listing.title} - ${formattedPrice}`,
        description: listing.description,
        images: [
          {
            url: listing.imageUrls[0],
            width: 1200,
            height: 630,
            alt: listing.title,
          }
        ],
        locale: 'en_US',
        type: 'website',
        siteName: 'Minecraft Real Estate',
        url: `https://realestate.dyplay.at/listing/${params.id}`,
      },
      twitter: {
        card: 'summary_large_image',
        title: `${listing.title} - ${formattedPrice}`,
        description: listing.description,
        images: [listing.imageUrls[0]],
        creator: '@MinecraftRealEstate',
      },
      other: {
        'theme-color': '#F97316',
      }
    };
  } catch (error) {
    // Fallback metadata if fetching fails
    return {
      title: 'Property Listing - Minecraft Real Estate',
      description: 'View this amazing Minecraft property listing',
      openGraph: {
        title: 'Property Listing - Minecraft Real Estate',
        description: 'View this amazing Minecraft property listing',
        images: ['/default-listing-image.jpg'],
        type: 'website',
        siteName: 'Minecraft Real Estate',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Property Listing - Minecraft Real Estate',
        description: 'View this amazing Minecraft property listing',
        images: ['/default-listing-image.jpg'],
      },
    };
  }
} 