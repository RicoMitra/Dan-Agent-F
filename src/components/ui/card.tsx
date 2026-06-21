import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[22px] border border-[#e5e1d8] bg-white shadow-[0_12px_40px_rgba(38,35,29,0.045)]",
        className,
      )}
      {...props}
    />
  );
}
