import { useQuery } from "@tanstack/react-query";
import { fetchHealth } from "@/lib/api/health";

export type OnlineStatus = "online" | "offline" | "checking";

export function useOnlineStatus() {
  const browserOnline =
    typeof navigator === "undefined" ? true : navigator.onLine;

  const { data, isFetching, isError } = useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
    enabled: browserOnline,
    refetchInterval: 15_000,
    retry: 0,
    staleTime: 5_000,
  });

  let status: OnlineStatus = "checking";
  if (!browserOnline || isError) status = "offline";
  else if (data?.ok) status = "online";
  else if (isFetching) status = "checking";
  else status = "offline";

  return { status, isFetching };
}
