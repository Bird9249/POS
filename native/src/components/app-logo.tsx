import appIcon from "@/assets/app-icon.svg";
import { cn } from "@/lib/utils";

const sizeClass = {
  sm: "size-8",
  md: "size-12",
  lg: "size-16",
} as const;

type AppLogoProps = {
  size?: keyof typeof sizeClass;
  className?: string;
};

export function AppLogo({ size = "md", className }: AppLogoProps) {
  return (
    <img
      src={appIcon}
      alt="POS"
      width={size === "lg" ? 64 : size === "md" ? 48 : 32}
      height={size === "lg" ? 64 : size === "md" ? 48 : 32}
      className={cn("rounded-xl object-cover", sizeClass[size], className)}
    />
  );
}
