import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "default" | "icon";
};

export function Button({
  className,
  variant = "primary",
  size = "default",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b99855] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" &&
          "bg-[#20201e] text-white shadow-sm hover:-translate-y-0.5 hover:bg-[#343430]",
        variant === "secondary" &&
          "border border-[#dfdbd1] bg-white text-[#292824] hover:border-[#c8b98f] hover:bg-[#fbfaf6]",
        variant === "ghost" &&
          "text-[#67645d] hover:bg-[#f0ede6] hover:text-[#292824]",
        variant === "danger" &&
          "text-[#8b4039] hover:bg-[#f8ece8]",
        size === "icon" && "size-10 px-0",
        className,
      )}
      {...props}
    />
  );
}
