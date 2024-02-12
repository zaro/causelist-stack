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
  useEmail: boolean | null;
  skipSms: boolean | null;
}

const initialLoginStoreState: LoginState = {
  phoneForOtp: null,
  otpExpiresAt: null,
  useEmail: null,
  skipSms: null,
};

export const loginStore = createStore("login")(
  initialLoginStoreState
).extendActions((set) => ({
  reset: () => {
    set.mergeState(initialLoginStoreState);
  },
}));

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

interface AppState {
  isPwa: boolean;
}

export const appStore = createStore("app")({
  isPwa: false,
} as AppState);
