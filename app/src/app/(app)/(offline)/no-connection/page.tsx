"use client";
import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { AppButtonLink, AppLink } from "../../_components/app-link.tsx";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";

export default function SignOut() {
  const router = useRouter();

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
          <WifiOffIcon />
        </Avatar>
        <Typography component="h1" variant="h5" sx={{ mb: "2em" }}>
          Not Connected to internet, please make sure you have internet
          connection and try again.
        </Typography>
        <Button
          onClick={() => router.back()}
          variant="outlined"
          sx={{ mb: "2em" }}
        >
          Go Back
        </Button>
        <AppButtonLink href="/home" variant="outlined">
          Home
        </AppButtonLink>
      </Box>
    </Container>
  );
}
