import useSWR from "swr";
import { fetcher } from "../_components/fetcher.ts";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function useUser() {
  const router = useRouter();
  const { data, mutate, error } = useSWR("/api/auth/me", fetcher);

  const loadingUser = !data && !error;
  const loggedOut = error && error.status === 401;

  useEffect(() => {
    if (loggedOut) {
      router.push("/session-expired");
    }
  }, [loggedOut, router]);

  return {
    loadingUser,
    loggedOut,
    user: data,
    mutateUser: mutate,
  };
}
