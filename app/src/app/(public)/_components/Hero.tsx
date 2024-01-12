"use client";
import React, { Suspense } from "react";
import { SWRConfig } from "swr";
import AppPreview from "./AppPreview.tsx";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import classes from "./common.module.css";

export default function Hero({ fallback }: { fallback: any }) {
  return (
    <div>
      <Typography variant="h3" fontWeight={700} className={classes.title}>
        Causelists made easy
      </Typography>

      <Suspense fallback={<h3>Loading data</h3>}>
        <SWRConfig value={{ fallback }}>
          <AppPreview />
        </SWRConfig>
      </Suspense>
    </div>
  );
}
