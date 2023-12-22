import React from "react";
import { loginStore } from "../../_store/index.ts";
import { useRouter } from "next/navigation";

export default function useSendOtp() {
  const [working, setWorking] = React.useState(false);
  const [userMissing, setUserMissing] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string[] | null>(null);
  const router = useRouter();
  const sendOtp = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const phone = data.get("phone");
    setUserMissing(null);
    setError(null);
    setWorking(true);
    fetch("/api/auth/send-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone }),
    })
      .then((r) => r.json())
      .then((r) => {
        if (r?.userMissing) {
          setUserMissing(r?.phone ?? phone);
        }
        if (r?.expiresAt) {
          loginStore.set.otpExpiresAt(new Date(r.expiresAt));
          loginStore.set.phoneForOtp(r.phone);
          router.push("/check-otp");
        } else if (r?.statusCode === 400) {
          setError(r?.message ?? [r?.error]);
        } else {
          setError(["Invalid server response"]);
        }
      })
      .catch((e) => {
        setError(e.toString());
      })
      .finally(() => setWorking(false));
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
