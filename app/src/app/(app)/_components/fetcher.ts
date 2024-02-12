import { FetcherError } from "../../_common/fetcher-error.ts";
import { userStore } from "../_store/index.ts";

export const addAuthHeader = (init: RequestInit | undefined) => {
  const accessToken = userStore.get.accessToken();
  if (accessToken) {
    if (!init) {
      init = {};
    }
    init.headers = {
      ...init.headers,
      "Auth-Token": accessToken,
    };
  }
  return init;
};

export const fetcher = async (
  input: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1]
) => {
  init = addAuthHeader(init);
  // console.log("Fetching ", input, "with headers: ", init?.headers);
  const res = await fetch(input, init);
  if (!res.ok) {
    throw new FetcherError(
      "An error occurred while fetching the data.",
      await res.json(),
      res.status
    );
  }
  const result = await res.json();
  // console.log("Fetched ", res.status, result);
  return result;
};
