"use client";
import { Stack } from "@mui/material";
import CourtSelector from "../../../_components/court-selector.tsx";
import { causeListStore } from "../../../_store/index.ts";
import { Suspense } from "react";
import DailyCauseLists from "../../../_components/daily-causelist.tsx";
import Calendar from "../../../_components/calendar.tsx";
import JudgeSelector from "../../../_components/judge-selector.tsx";

const minDate = new Date("2023-01-01");
const maxDate = new Date(`${new Date().getFullYear() + 1}-12-31`);

export default function Page() {
  const selectedCourt = causeListStore.use.selectedCourt();
  const selectedDate = causeListStore.use.selectedDate();

  return (
    <Stack>
      <CourtSelector />
      <JudgeSelector court={selectedCourt} />
      <Calendar />
      <Suspense fallback={<h3>Loading data</h3>}>
        <DailyCauseLists date={selectedDate} court={selectedCourt} />
      </Suspense>
    </Stack>
  );
}
