"use client";

export function UnitPricePreview() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
      <div className="text-center space-y-2">
        <div className="text-4xl font-bold text-emerald-600">$2.50</div>
        <div className="text-xs text-gray-600">per unit</div>
      </div>
    </div>
  );
}
