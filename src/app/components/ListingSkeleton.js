import Skeleton from "./Skeleton";

export default function ListingSkeleton() {
  return (
    <div className="container mx-auto p-6 flex flex-col lg:flex-row gap-8">
      {/* 🔹 Left Section - Image Gallery Skeleton */}
      <div className="lg:w-2/3">
        <Skeleton width="100%" height="400px" className="rounded-lg shadow-lg" />
        <div className="mt-4 flex gap-2">
          {[...Array(4)].map((_, index) => (
            <Skeleton key={index} width="80px" height="60px" className="rounded-lg" />
          ))}
        </div>
      </div>

      {/* 🔹 Right Section - Listing Details Skeleton */}
      <div className="lg:w-1/3 bg-white p-6 shadow-lg rounded-lg border">
        <Skeleton width="70%" height="30px" className="mb-4 rounded-md" />
        <Skeleton width="90%" height="20px" className="mb-2  rounded-md"/>
        <Skeleton width="80%" height="20px" className="mb-4 rounded-md" />
        <Skeleton width="60%" height="30px" className="mb-6 rounded-md" />
        <Skeleton width="100%" height="50px" className="rounded-lg" />

        {/* 🔹 Seller Info Skeleton */}
        <div className="mt-6 flex items-center gap-4">
          <Skeleton width="50px" height="50px" className="rounded-md" />
          <div>
            <Skeleton width="100px" height="20px" className="rounded-md" />
            <Skeleton width="80px" height="14px" className="rounded-md mt-1"/>
          </div>
        </div>
      </div>
    </div>
  );
}