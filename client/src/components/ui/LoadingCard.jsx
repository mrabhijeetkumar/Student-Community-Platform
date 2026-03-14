export default function LoadingCard({ lines = 3 }) {
    return (
        <div className="card-surface animate-pulse p-5">
            <div className="mb-4 h-4 w-1/3 rounded-full bg-white/25" />
            <div className="space-y-3">
                {Array.from({ length: lines }).map((_, index) => (
                    <div
                        key={`loading-line-${index}`}
                        className="h-3 rounded-full bg-white/20"
                        style={{ width: `${100 - index * 12}%` }}
                    />
                ))}
            </div>
        </div>
    );
}
