// src/components/ui/PopularBrands.tsx
export default function PopularBrands() {
  const brands = [
    {
      name: "Mercedes",
      logo: "/images/mercedes-logo.png",
      color: "bg-gray-800",
    },
    { name: "Audi", logo: "/images/audi-logo.png", color: "bg-red-600" },
    { name: "Jaguar", logo: "/images/jaguar-logo.png", color: "bg-green-800" },
    { name: "BMW", logo: "/images/bmw-logo.png", color: "bg-blue-800" },
  ];

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-primary">Popular Brands</h2>
        <button className="text-accent text-sm">See All</button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
        {brands.map((brand) => (
          <div
            key={brand.name}
            className="flex flex-col items-center min-w-[80px]"
          >
            <div
              className={`${brand.color} w-16 h-16 rounded-full flex items-center justify-center mb-2 shadow-md`}
            >
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <span className="font-bold text-primary text-xs">
                  {brand.name[0]}
                </span>
              </div>
            </div>
            <span className="text-primary font-semibold text-sm">
              {brand.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
