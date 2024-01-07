"use client";
import { Stack } from "@mui/material";
import CourtSelector from "../../_components/court-selector.tsx";
import { causeListStore } from "../../_store/index.ts";
import { Suspense } from "react";
import DailyCauseLists from "../../_components/daily-causelist.tsx";
import Calendar from "../../_components/calendar.tsx";

const version = process.env.NEXT_PUBLIC_APP_VERSION ?? "dev";

export default function Page() {
  return (
    <div>
      <h1 style={{ textAlign: "center" }}>Causelist App</h1>
      <h2 style={{ textAlign: "center" }}>{version}</h2>
    </div>
  );
}
