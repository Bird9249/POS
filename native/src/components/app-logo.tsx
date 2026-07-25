import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import appIcon from "@/assets/app-icon.svg";
import { resolveFileSrc } from "@/lib/api/file-url";
import { getLocalDb } from "@/lib/db/client";
import { loadReceiptSettings } from "@/lib/sync/pull-settings";
import { cn } from "@/lib/utils";

export const STORE_LOGO_QUERY_KEY = ["receipt-settings"] as const;

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
  const [broken, setBroken] = useState(false);

  const settings = useQuery({
    queryKey: STORE_LOGO_QUERY_KEY,
    queryFn: async () => loadReceiptSettings(await getLocalDb()),
    staleTime: 60_000,
  });

  const logoKey = settings.data?.logoKey ?? null;
  const storeLogo = resolveFileSrc(logoKey);

  useEffect(() => {
    setBroken(false);
  }, [logoKey]);

  const src = !broken && storeLogo ? storeLogo : appIcon;
  const px = size === "lg" ? 64 : size === "md" ? 48 : 32;

  return (
    <img
      src={src}
      alt={settings.data?.storeName?.trim() || "POS"}
      width={px}
      height={px}
      className={cn("rounded-xl object-cover", sizeClass[size], className)}
      onError={() => setBroken(true)}
    />
  );
}
