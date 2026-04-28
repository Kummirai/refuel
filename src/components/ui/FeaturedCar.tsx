// src/components/ui/FeaturedCar.tsx
export default function FeaturedCar() {
  return (
    <div className="mb-6 bg-gradient-to-r from-primary to-secondary rounded-2xl overflow-hidden shadow-xl">
      <div className="relative">
        <img
          src="/images/mustang-featured.jpg"
          alt="Ford Mustang GT"
          className="w-full h-40 object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-white text-xs">Featured</p>
              <h3 className="text-white font-bold text-lg">
                Ford Mustang GT 2024
              </h3>
              <p className="text-white/80 text-xs">5.0L V8 • 450hp</p>
            </div>
            <div className="bg-highlight px-3 py-1 rounded-lg">
              <p className="text-primary font-bold text-sm">4.9 ★</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
