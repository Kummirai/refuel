// src/components/ui/LoadingSpinner.tsx
export default function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-light flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-highlight"></div>
        <p className="mt-4 text-primary font-semibold">Loading...</p>
      </div>
    </div>
  );
}
