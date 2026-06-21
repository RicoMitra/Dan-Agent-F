import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-xl border border-[#ddd8ce] bg-[#fcfbf8] px-3 text-sm text-[#292824] outline-none transition placeholder:text-[#aaa69d] focus:border-[#b99855] focus:ring-2 focus:ring-[#b99855]/15",
        className,
      )}
      {...props}
    />
  );
}
