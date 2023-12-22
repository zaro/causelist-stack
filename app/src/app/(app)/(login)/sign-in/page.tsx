"use client";
import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Copyright from "../../../_components/copyright.tsx";
import { AppLink } from "../../../_components/app-link.tsx";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import { loginStore } from "../../../_store/index.ts";
import useSendOtp from "../send-otp.hook.tsx";

export default function SignIn() {
  const { working, error, userMissing, sendOtp } = useSendOtp();

  return (
    <Container maxWidth="xs">
      <CssBaseline />
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
        <Box component="form" noValidate onSubmit={sendOtp} sx={{ mt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="phone"
                label="Phone"
                name="phone"
                autoComplete="phone"
                disabled={working}
              />
            </Grid>
          </Grid>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={working}
          >
            Sign In
          </Button>
          {userMissing && (
            <Alert severity="error" sx={{ mt: 1, mb: 2 }}>
              <AlertTitle>User Not Found</AlertTitle>
              <strong>{userMissing}</strong> is is not registered. Please{" "}
              <AppLink href="/sign-up">sign up</AppLink> first
            </Alert>
          )}
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
