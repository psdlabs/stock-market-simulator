export default function LoadingSpinner({ message = "Running simulation...", simCount }) {
  return (
    <div className="card flex flex-col items-center justify-center py-16 sm:py-24 gap-4 sm:gap-5">
      <div className="relative">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-[3px] border-[var(--border-primary)]" />
        <div className="absolute inset-0 w-14 h-14 sm:w-16 sm:h-16 rounded-full border-[3px] border-transparent border-t-[var(--accent)] animate-spin" />
      </div>
      <div className="text-center">
        <p style={{ color: "var(--text-primary)" }} className="text-xs sm:text-sm font-medium">
          {message}
        </p>
        {simCount && (
          <p style={{ color: "var(--text-muted)" }} className="text-[11px] sm:text-xs mt-1">
            Processing {simCount.toLocaleString()} simulations...
          </p>
        )}
      </div>
    </div>
  );
}
