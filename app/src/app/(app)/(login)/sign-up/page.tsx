"use client";
import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";

import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { AppLink } from "../../_components/app-link.tsx";
import Link from "@mui/material/Link";
import PhoneTextField from "../../_components/phone-text-field.tsx";
import LoadingButton from "@mui/lab/LoadingButton";
import useSendOtp from "../send-otp.hook.tsx";
import { ICreateUserDataParams } from "../../../../api/users.ts";

export default function SignUp() {
  const { working, error, setError, userMissing, sendOtp } = useSendOtp();
  const [creatingUser, setCreatingUser] = React.useState(false);
  const [validationErrors, setValidationErrors] = React.useState<
    Partial<ICreateUserDataParams>
  >({});
  const [tacAccepted, setTacAccepted] = React.useState(false);

  const loading = creatingUser || working;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const body: ICreateUserDataParams = {
      phone: data.get("phone") as string,
      firstName: data.get("firstName") as string,
      lastName: data.get("lastName") as string,
      email: data.get("email") as string,
    };
    setError([]);
    setValidationErrors({});
    fetch("/api/users/new", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then(async (r) => {
        if (r.status == 201) {
          return sendOtp(body.phone, true, false, true);
        }
        if (r.status == 409) {
          setValidationErrors({
            phone: "User already exists",
            email: "User already exists",
          });
          return;
        }
        if (r.status == 400) {
          const body = await r.json();
          setValidationErrors(body);
          return;
        }
      })
      .catch((e) => {
        setError([e.toString()]);
        setCreatingUser(false);
      });
  };

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
          Sign up
        </Typography>
        <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <PhoneTextField
                error={!!validationErrors.phone}
                required={true}
                fullWidth
                id="phone"
                label="Phone"
                name="phone"
                type="tel"
                autoComplete="phone"
                autoFocus
                helperText={validationErrors.phone}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                error={!!validationErrors.firstName}
                autoComplete="given-name"
                name="firstName"
                required={true}
                fullWidth
                id="firstName"
                label="First Name"
                helperText={validationErrors.firstName}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                error={!!validationErrors.lastName}
                required={true}
                fullWidth
                id="lastName"
                label="Last Name"
                name="lastName"
                autoComplete="family-name"
                helperText={validationErrors.lastName}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                error={!!validationErrors.email}
                required={true}
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                type="email"
                autoComplete="email"
                helperText={validationErrors.email}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    value="tacAccepted"
                    color="primary"
                    onChange={(e, v) => setTacAccepted(v)}
                  />
                }
                label={
                  <span>
                    I have read and accepted the{" "}
                    <Link target="_blank" href="/terms-and-conditions">
                      Terms And Conditions
                    </Link>
                  </span>
                }
              />
            </Grid>
          </Grid>
          <LoadingButton
            loading={loading}
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={!tacAccepted}
          >
            Sign Up
          </LoadingButton>
          {error?.length ? (
            <Alert severity="error" sx={{ mt: 1, mb: 2 }}>
              <AlertTitle>Error</AlertTitle>
              <ul>
                {error.map((e, idx) => (
                  <li key={idx}>{e}</li>
                ))}
              </ul>
            </Alert>
          ) : null}
          <Grid container justifyContent="flex-end">
            <Grid item>
              <AppLink href="/sign-in" variant="body2">
                Already have an account? Sign in
              </AppLink>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
}
