"use client";
import { Stack } from "@mui/material";
import CourtSelector from "../../_components/court-selector.tsx";
import { causeListStore } from "../../_store/index.ts";
import { Suspense } from "react";
import DailyCauseLists from "../../_components/daily-causelist.tsx";
import Calendar from "../../_components/calendar.tsx";
import JudgeSelector from "../../_components/judge-selector.tsx";
import Centered from "../../_components/centered.tsx";

export default function Page() {
  const selectedCourt = causeListStore.use.selectedCourt();
  const selectedDate = causeListStore.use.selectedDate();

  return (
    <Stack height={"100%"}>
      <CourtSelector />
      {selectedCourt ? (
        selectedCourt.hasData ? (
          <>
            <JudgeSelector court={selectedCourt} />
            <Calendar />
            <Suspense fallback={<h3>Loading data</h3>}>
              <DailyCauseLists date={selectedDate} court={selectedCourt} />
            </Suspense>
          </>
        ) : (
          <Centered>
            We do not support this court yet, but we are working hard to add it
            to our database.
          </Centered>
        )
      ) : (
        <Centered>Select court to view data</Centered>
      )}
    </Stack>
  );
}
