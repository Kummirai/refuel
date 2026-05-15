export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-200/80 rounded-full ${className}`}
    />
  );
}
