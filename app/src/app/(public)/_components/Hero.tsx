"use client";
import React, { Suspense } from "react";
import { SWRConfig } from "swr";
import AppPreview from "./AppPreview.tsx";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import classes from "./common.module.css";
import CaseSearchBox from "../../(app)/(main)/case-search/case-search-box.tsx";
import Box from "@mui/material/Box";

// export default function Hero({ fallback }: { fallback: any }) {
export default function Hero() {
  return (
    <Box paddingTop="3em">
      <Typography
        variant="h3"
        fontWeight={700}
        className={classes.title}
        paddingBottom="2em"
      >
        Instant search of all court case documents
      </Typography>

      <CaseSearchBox initialSearchText="" caseSearchPath="/free-case-search" />

      {/* <Suspense fallback={<h3>Loading data</h3>}>
        <SWRConfig value={{ fallback }}>
          <AppPreview />
        </SWRConfig>
      </Suspense> */}
    </Box>
  );
}
