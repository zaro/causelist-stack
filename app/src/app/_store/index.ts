import { createStore } from "zustand-x";

interface CauseListState {
  selectedCourt: string | null;
  selectedDate: Date | null;
  selectedJudges: { [key: string]: string[] };
}

export const causeListStore = createStore("causeList")({
  selectedCourt: null,
  selectedDate: null,
  selectedJudges: {},
} as CauseListState)
  .extendActions((set, get, api) => ({
    setJudgesForCurrentCourt: (judges: string[]) => {
      const court = get.selectedCourt();
      if (!court) {
        console.warn("setJudgesForCurrentCourt called w/o selected court");
        return;
      }
      set.selectedJudges({
        ...get.selectedJudges(),
        [court]: judges,
      });
    },
  }))
  .extendSelectors((state, get, api) => ({
    judgesForCurrentCourt: () => {
      const court = get.selectedCourt();
      if (!court) {
        return [];
      }
      return get.selectedJudges()[court];
    },
  }));

interface LoginState {
  phoneForOtp: string | null;
  otpExpiresAt: Date | null;
}

export const loginStore = createStore("login")({
  phoneForOtp: null,
  otpExpiresAt: null,
} as LoginState);

interface UserState {
  accessToken: string | null;
  user: any | null;
}

export const userStore = createStore("user")(
  {
    accessToken: null,
    user: null,
  } as UserState,
  {
    persist: {
      enabled: true,
    },
  }
);
