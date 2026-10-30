/** Thanh tiến độ, value từ 0 tới 1. */
export default function Bar({ value, className = "" }: { value: number; className?: string }) {
  return (
    <div className={`h-2 overflow-hidden rounded-full bg-panel2 ${className}`}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-brand to-brand2 transition-[width]"
        style={{ width: `${Math.round(Math.min(1, value) * 100)}%` }}
      />
    </div>
  );
}
