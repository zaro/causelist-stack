"use client";
import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Copyright from "../../_components/copyright.tsx";
import { AppLink } from "../../_components/app-link.tsx";
import { loginStore, userStore } from "../../_store/index.ts";
import formatDistanceToNow from "date-fns/formatDistanceToNow";
import { useRouter } from "next/navigation";

function ExpiresIn({ expiresIn }: { expiresIn: Date | null }) {
  if (!expiresIn) {
    return <span>Invalid code</span>;
  }
  return (
    <span>{formatDistanceToNow(expiresIn, { includeSeconds: true })}</span>
  );
}

export default function CheckOtp() {
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
          setSignedIn(true);
        } else {
          setError(["Invalid server response"]);
        }
      })
      .catch((e) => {
        setError([e.toString()]);
      })
      .finally(() => setWorking(false));
  };
  React.useEffect(() => {
    if (signedIn) {
      console.log("Signed in, redirect to /calendar");
      router.push("/calendar");
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
          Code expires in :{" "}
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
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Verify Code
          </Button>
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
      <Copyright sx={{ mt: 5 }} />
    </Container>
  );
}
