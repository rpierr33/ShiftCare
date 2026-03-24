import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-blue-50 text-blue-700 ring-1 ring-blue-600/10",
        success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10",
        warning: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/10",
        danger: "bg-red-50 text-red-700 ring-1 ring-red-600/10",
        secondary: "bg-gray-50 text-gray-600 ring-1 ring-gray-500/10",
        outline: "border border-gray-200 text-gray-700 bg-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
