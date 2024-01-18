import useSWR, { useSWRConfig } from "swr";
import { fetcher } from "../_components/fetcher.ts";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { IUser, UserRole } from "../../../api/users.ts";

export const USER_ENDPOINT = "/api/auth/me";

export interface UseUserProps {
  noAutoLogOut?: boolean;
}

export default function useUser({ noAutoLogOut }: UseUserProps = {}) {
  const router = useRouter();
  const { data, mutate, error, isLoading, isValidating } = useSWR<IUser>(
    USER_ENDPOINT,
    fetcher,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );
  const loggedOut =
    !isValidating && !isLoading && error && error.status === 401;

  useEffect(() => {
    if (loggedOut && !noAutoLogOut) {
      mutate();
      console.log("Logging out because of loggedOut");
      router.push("/session-expired");
    }
  }, [loggedOut, router, noAutoLogOut, mutate]);

  return {
    router,
    loggedOut,
    user: data,
    isLoading,
    isValidating,
    isAdminUser: UserRole.Admin === data?.role,
    mutateUser: mutate,
  };
}

export function useRevalidateUser() {
  const { mutate } = useSWRConfig();
  return {
    revalidateUser: () =>
      mutate(USER_ENDPOINT, fetcher(USER_ENDPOINT), { populateCache: true }),
  };
}
