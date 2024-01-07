"use client";
import * as React from "react";
import Avatar from "@mui/material/Avatar";
import LoadingButton from "@mui/lab/LoadingButton";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import AppFooter from "../../_components/app-footer.tsx";
import { AppLink } from "../../_components/app-link.tsx";
import { loginStore, userStore } from "../../_store/index.ts";
import formatDistance from "date-fns/formatDistance";
import { useRouter } from "next/navigation";
import { useRevalidateUser } from "../../(main)/use-user.hook.ts";

function ExpiresIn({ expiresIn }: { expiresIn: Date | null }) {
  const [cnt, setCnt] = React.useState(0);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setCnt((v) => v + 1);
    }, 5000);

    return () => clearTimeout(timer);
  });

  if (!expiresIn) {
    return <span>Invalid code</span>;
  }

  const now = new Date();
  if (now >= expiresIn) {
    return (
      <AppLink href="/sign-in">Code expired, click to get a new one</AppLink>
    );
  }

  return (
    <span>
      Code expires{" "}
      {formatDistance(expiresIn, now, {
        includeSeconds: true,
        addSuffix: true,
      })}
    </span>
  );
}

export default function CheckOtp() {
  const { revalidateUser } = useRevalidateUser();
  const [working, setWorking] = React.useState(false);
  const [error, setError] = React.useState<string[] | null>(null);
  const [signedIn, setSignedIn] = React.useState(false);
  const router = useRouter();
  const phoneForOtp = loginStore.get.phoneForOtp();
  // TODO: maybe make this work
  // if (!phoneForOtp) {
  //   router.push("/sign-in");
  // }
  const checkOtp = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const otp = data.get("otp");
    setError(null);
    setWorking(true);
    fetch("/api/auth/login-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone: phoneForOtp, otp }),
    })
      .then((r) => r.json())
      .then((r) => {
        if (r.statusCode === 401) {
          setError(["Invalid or Expired Code"]);
          return;
        }

        if (r.accessToken && r.user) {
          userStore.set.accessToken(r.accessToken);
          loginStore.set.phoneForOtp(null);
          loginStore.set.otpExpiresAt(null);
          return revalidateUser().then(() => {
            setSignedIn(true);
          });
        } else {
          setError(["Invalid server response"]);
        }
        setWorking(false);
      })
      .catch((e) => {
        setError([e.toString()]);
        setWorking(false);
      });
  };
  React.useEffect(() => {
    if (signedIn) {
      console.log("Signed in, redirect to /home");
      router.push("/home");
    }
  }, [signedIn, router]);

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Enter Code
        </Typography>
        <Typography sx={{ mt: 2, mb: 2 }}>
          We&apos;ve sent a login code to <strong>{phoneForOtp}</strong>, enter
          it below to continue
        </Typography>
        <Typography variant="body2">
          <ExpiresIn expiresIn={loginStore.get.otpExpiresAt()} />
        </Typography>
        <Box component="form" noValidate onSubmit={checkOtp} sx={{ mt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="otp"
                label="SMS Code"
                id="otp"
                autoComplete="off"
              />
            </Grid>
          </Grid>
          <LoadingButton
            loading={working}
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Verify Code
          </LoadingButton>
          {error?.length && (
            <Alert severity="error" sx={{ mt: 1, mb: 2 }}>
              <AlertTitle>Error</AlertTitle>
              <ul>
                {error.map((e, idx) => (
                  <li key={idx}>{e}</li>
                ))}
              </ul>
            </Alert>
          )}
          <Grid container justifyContent="flex-end">
            <Grid item>
              <AppLink href="/sign-up">
                Don&apos;t have an account yet? Sign Up
              </AppLink>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
}
