import React from "react";
import { loginStore } from "../_store/index.ts";
import { useRouter } from "next/navigation";

export default function useSendOtp() {
  const [working, setWorking] = React.useState(false);
  const [userMissing, setUserMissing] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string[] | null>(null);
  const router = useRouter();
  const sendOtp = (phone: string) => {
    setUserMissing(null);
    setError(null);
    setWorking(true);
    return fetch("/api/auth/send-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone }),
    })
      .then(async (response) => {
        const r = await response.json();
        if (response.status == 400) {
          setUserMissing(r?.phone?.[0] ?? r?.phone);
        } else if (r?.userMissing) {
          setUserMissing(
            `${r?.phone ?? phone} is not a registered phone number`
          );
        } else if (r?.expiresAt) {
          loginStore.set.otpExpiresAt(new Date(r.expiresAt));
          loginStore.set.phoneForOtp(r.phone);
          router.push("/check-otp");
          return;
        } else if (r?.statusCode === 400) {
          setError(r?.message ?? [r?.error]);
        } else {
          setError(["Invalid server response"]);
        }
        setWorking(false);
      })
      .catch((e) => {
        setError(e.toString());
        setWorking(false);
      });
  };
  return {
    working,
    setWorking,
    error,
    setError,
    userMissing,
    setUserMissing,
    sendOtp,
  };
}
