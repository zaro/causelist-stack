"use client";
import * as React from "react";
import Avatar from "@mui/material/Avatar";
import LoadingButton from "@mui/lab/LoadingButton";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import AppFooter from "../../_components/app-footer.tsx";
import { AppLink } from "../../_components/app-link.tsx";
import Link from "@mui/material/Link";
import ErrorBox from "../../_components/error-box.tsx";

import useUser from "../use-user.hook.ts";
import PhoneTextField from "../../_components/phone-text-field.tsx";
import { IUpdateUserDataParams } from "../../../../api/users.ts";
import { addAuthHeader, fetcher } from "../../_components/fetcher.ts";

export default function Page() {
  const { user, mutateUser } = useUser();
  const [working, setWorking] = React.useState(false);
  const [error, setError] = React.useState<string[]>([]);
  const [validationErrors, setValidationErrors] = React.useState<
    Partial<IUpdateUserDataParams>
  >({});

  const updateUser = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const updateData: IUpdateUserDataParams = {
      firstName: data.get("firstName") as string,
      lastName: data.get("lastName") as string,
      email: data.get("email") as string,
    };
    setValidationErrors({});
    setWorking(true);
    setError([]);
    fetch(
      "/api/users/update",
      addAuthHeader({
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })
    )
      .then(async (r) => {
        const body = await r.json();
        if (r.status == 400) {
          setValidationErrors(body);
          return;
        } else if (r.status === 200) {
          mutateUser(body, {
            optimisticData: body,
            revalidate: false,
            populateCache: true,
          });
        } else {
          console.error(body);
          setError([JSON.stringify(body)]);
        }
      })
      .catch((e) => {
        console.error(e);
        setError([e.toString()]);
      })
      .finally(() => {
        setWorking(false);
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
        <Avatar sx={{ m: 1, bgcolor: "info.main" }}>
          <AccountCircleIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Account
        </Typography>
        <Box component="form" noValidate onSubmit={updateUser} sx={{ mt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                error={!!validationErrors.firstName}
                autoComplete="given-name"
                name="firstName"
                required
                fullWidth
                id="firstName"
                label="First Name"
                defaultValue={user?.firstName}
                autoFocus
                helperText={validationErrors.firstName}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                error={!!validationErrors.lastName}
                required
                fullWidth
                id="lastName"
                label="Last Name"
                name="lastName"
                defaultValue={user?.lastName}
                autoComplete="family-name"
                helperText={validationErrors.lastName}
              />
            </Grid>
            <Grid item xs={12}>
              <PhoneTextField
                fullWidth
                id="phone"
                label="Phone"
                name="phone"
                value={user?.phone}
                disabled
                autoComplete="phone"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                error={!!validationErrors.email}
                required
                fullWidth
                id="email"
                label="Email Address"
                defaultValue={user?.email}
                name="email"
                autoComplete="email"
                helperText={validationErrors.email}
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
            Save
          </LoadingButton>
        </Box>
        <ErrorBox error={error} />
      </Box>
    </Container>
  );
}
