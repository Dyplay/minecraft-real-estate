import { db } from '../../../../lib/appwrite';

export async function generateMetadata({ params }) {
  try {
    // Fetch listing data
    const listing = await db.getDocument(
      "67a8e81100361d527692",
      "67b2fdc20027f4d55440",
      params.id
    );

    const title = listing ? `${listing.title} - Minecraft Real Estate` : 'Property Listing - Minecraft Real Estate';
    const description = listing?.description || 'View detailed information about this Minecraft property listing';

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [{
          url: `/listing/${params.id}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: 'Property Listing OpenGraph Image',
        }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [`/listing/${params.id}/opengraph-image`],
      },
    };
  } catch (error) {
    return {
      title: 'Property Listing - Minecraft Real Estate',
      description: 'View detailed information about this Minecraft property listing',
    };
  }
} 