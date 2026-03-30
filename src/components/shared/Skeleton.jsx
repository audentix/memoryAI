export default function Skeleton({ className = '', variant = 'text' }) {
  const variants = {
    text: 'h-4 rounded',
    circle: 'rounded-full',
    card: 'h-32 rounded-xl',
    rect: 'rounded-lg',
  };

  return (
    <div
      className={`bg-surface-light animate-pulse ${variants[variant]} ${className}`}
    />
  );
}

export function SkeletonList({ count = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton variant="circle" className="w-10 h-10 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="w-3/4" />
            <Skeleton className="w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
