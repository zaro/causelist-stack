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
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Copyright from "../../../_components/copyright.tsx";
import { AppLink } from "../../../_components/app-link.tsx";
import { userStore } from "../../../_store/index.ts";
import formatDistanceToNow from "date-fns/formatDistanceToNow";
import { useRouter } from "next/navigation";

export default function SessionExpired() {
  const router = useRouter();

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
        <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
          Session expired
        </Typography>
        <Grid container justifyContent={"center"}>
          <Grid item>
            <AppLink href="/sign-in" variant="body2">
              Sign in again
            </AppLink>
          </Grid>
        </Grid>
      </Box>
      <Copyright sx={{ mt: 5 }} />
    </Container>
  );
}
