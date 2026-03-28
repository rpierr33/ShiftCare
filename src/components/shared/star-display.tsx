import { Star } from "lucide-react";

interface StarDisplayProps {
  average: number;
  count: number;
  size?: "sm" | "md";
}

export function StarDisplay({ average, count, size = "sm" }: StarDisplayProps) {
  if (count === 0) return null;

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <span className={`inline-flex items-center gap-1 ${textSize}`}>
      <Star className={`${iconSize} fill-amber-400 text-amber-400`} />
      <span className="font-medium text-slate-700">
        {average.toFixed(1)}
      </span>
      <span className="text-slate-400">({count})</span>
    </span>
  );
}
