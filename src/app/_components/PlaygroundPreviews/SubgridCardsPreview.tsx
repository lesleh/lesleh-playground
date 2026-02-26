"use client";

export function SubgridCardsPreview() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 p-4">
      <div className="grid grid-cols-2 gap-2 w-full h-full">
        <div className="bg-white rounded border border-gray-200"></div>
        <div className="bg-white rounded border border-gray-200"></div>
        <div className="bg-white rounded border border-gray-200"></div>
        <div className="bg-white rounded border border-gray-200"></div>
      </div>
    </div>
  );
}
