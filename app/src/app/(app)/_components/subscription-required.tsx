import * as React from "react";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { Suspense } from "react";
import Stack from "@mui/material/Stack";
import { AppLink } from "./app-link.tsx";

export default function SubscriptionRequired() {
  return (
    <Box
      sx={{
        marginTop: 8,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Box sx={{ marginBottom: "1em" }}>
        <Typography variant="h5" textAlign="center">
          You don&apos;t have an active subscription!
        </Typography>

        <Typography variant="h5" textAlign="center">
          Please subscribe in order to access this page.
        </Typography>

        <Typography variant="h5" textAlign="center" sx={{ marginTop: "1em" }}>
          <AppLink href="/account/subscribe">Subscribe</AppLink>
        </Typography>
      </Box>
    </Box>
  );
}
