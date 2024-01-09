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
import AppFooter from "../../_components/app-footer.tsx";
import { AppLink } from "../../_components/app-link.tsx";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import useSendOtp from "../send-otp.hook.tsx";
import useUser from "../../(main)/use-user.hook.ts";
import PhoneTextField from "../../_components/phone-text-field.tsx";

export default function SignIn() {
  const { working, error, userMissing, sendOtp } = useSendOtp();
  const { user, isLoading, isValidating, router } = useUser({
    noAutoLogOut: true,
  });

  React.useEffect(() => {
    if (!isLoading && !isValidating && user) {
      router.push("/calendar");
    }
  }, [isLoading, isValidating, router, user]);

  const submitSendOtp = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const phone = data.get("phone") as string;
    return sendOtp(phone);
  };
  const disableButton =
    working ||
    isLoading ||
    isValidating ||
    (!isLoading && !isValidating && user);

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
          Sign in
        </Typography>
        <Box
          component="form"
          noValidate
          onSubmit={submitSendOtp}
          sx={{ mt: 3 }}
        >
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <PhoneTextField
                error={!!userMissing}
                required
                fullWidth
                id="phone"
                label="Phone"
                name="phone"
                type="tel"
                autoComplete="phone"
                disabled={working}
                helperText={userMissing}
              />
            </Grid>
          </Grid>
          <LoadingButton
            loading={disableButton}
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Sign In
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
