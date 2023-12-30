"use client";
import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Copyright from "../../_components/copyright.tsx";
import { userStore } from "../../_store/index.ts";
import { useRouter } from "next/navigation";

export default function SignOut() {
  const router = useRouter();
  React.useEffect(() => {
    setTimeout(() => {
      userStore.set.accessToken(null);
      router.push("/");
    }, 1000);
  });

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
          Signing out
        </Typography>
      </Box>
      <Copyright sx={{ mt: 5 }} />
    </Container>
  );
}
