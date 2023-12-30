import { createStore } from "zustand-x";
import { ICourt } from "@/api/courts";

interface CauseListState {
  selectedCourt: ICourt | null;
  selectedDate: Date | null;
  selectedJudges: string[];
}

export const causeListStore = createStore("causeList")({
  selectedCourt: null,
  selectedDate: null,
  selectedJudges: [],
} as CauseListState).extendActions((set, get, api) => ({
  changeCourt: (court: ICourt | null) => {
    const current = get.selectedCourt();
    if (court !== current) {
      set.selectedDate(null);
      set.selectedJudges([]);
    }
    set.selectedCourt(court);
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
}

export const userStore = createStore("user")(
  {
    accessToken: null,
  } as UserState,
  {
    persist: {
      enabled: true,
    },
  }
);
