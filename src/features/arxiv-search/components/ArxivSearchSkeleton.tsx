import React from 'react';

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3" />
      <div className="space-y-1.5">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
      </div>
    </div>
  );
}

const ArxivSearchSkeleton: React.FC = () => (
  <div className="flex-1 overflow-y-auto px-3 pb-3">
    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2 animate-pulse" />
    <div className="flex flex-col gap-2">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  </div>
);

export default ArxivSearchSkeleton;