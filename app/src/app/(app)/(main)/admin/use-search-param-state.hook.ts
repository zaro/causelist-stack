import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export default function useSearchParamState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (
      name: string,
      value: string,
      n2?: string,
      v2?: string,
      n3?: string,
      v3?: string
    ) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
      if (n2 && v2) {
        params.set(n2, v2);
      }
      if (n3 && v3) {
        params.set(n3, v3);
      }

      return params.toString();
    },
    [searchParams]
  );

  const setParam = (
    key: string,
    newValue: string,
    n2?: string,
    v2?: string,
    n3?: string,
    v3?: string
  ) => {
    router.push(
      pathname + "?" + createQueryString(key, newValue, n2, v2, n3, v3)
    );
  };

  return {
    searchParams,
    setParam,
  };
}
