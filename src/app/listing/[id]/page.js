import { useRouter } from "next/router";
import { db, getListingById } from "../../lib/appwrite";
import Image from "next/image";

export default function ListingPage({ listing, seller }) {
  const router = useRouter();
  if (router.isFallback) return <div>Loading...</div>;

  return (
    <div>
      <h1>{listing.title}</h1>
      <p>{listing.description}</p>
      <p>Price: {listing.price}€</p>

      {/* Seller Profile */}
      <div className="flex items-center mt-4">
        <Image src={`https://crafthead.net/avatar/${seller.uuid}`} width={48} height={48} className="rounded-full" />
        <div className="ml-3">
          <p className="text-lg">{seller.mcUsername}</p>
          <p className="text-sm text-gray-400">UUID: {seller.uuid}</p>
        </div>
      </div>

      <button>Buy</button>
      <button>Rent</button>
    </div>
  );
}

export async function getStaticPaths() {
  const response = await db.listDocuments("YOUR_DB_ID", "listings");
  const paths = response.documents.map((listing) => ({ params: { id: listing.$id } }));
  return { paths, fallback: true };
}

export async function getStaticProps({ params }) {
  const listing = await getListingById(params.id);
  const seller = await db.getDocument("YOUR_DB_ID", "users", listing.seller);
  return { props: { listing, seller }, revalidate: 10 };
}