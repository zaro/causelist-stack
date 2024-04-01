"use client";
import { Stack } from "@mui/material";
import Box from "@mui/material/Box";
import CourtSelector from "../../_components/court-selector.tsx";
import { causeListStore } from "../../_store/index.ts";
import { Suspense } from "react";
import DailyCauseLists from "../../_components/daily-causelist.tsx";
import Calendar from "../../_components/calendar.tsx";
import JudgeSelector from "../../_components/judge-selector.tsx";
import Centered from "../../_components/centered.tsx";
import InAppNotice from "../../_components/in-app-notice.tsx";
import ErrorBoundary from "../../../_common/error-boundary.tsx";
import SubscriptionRequired from "../../_components/subscription-required.tsx";

export default function Page() {
  const selectedCourt = causeListStore.use.selectedCourt();
  const selectedDate = causeListStore.use.selectedDate();

  return (
    <Stack height={"100%"} justifyContent="space-between">
      <CourtSelector />
      {selectedCourt ? (
        selectedCourt.hasData ? (
          <>
            <JudgeSelector court={selectedCourt} />
            <Calendar />
            <ErrorBoundary
              fallback={<h3>failed</h3>}
              subscriptionRequired={<SubscriptionRequired />}
            >
              <Suspense fallback={<h3>Loading data</h3>}>
                <DailyCauseLists date={selectedDate} court={selectedCourt} />
              </Suspense>
            </ErrorBoundary>
          </>
        ) : (
          <Centered sx={{ marginBottom: "10em" }}>
            We do not support this court yet, but we are working hard to add it
            to our database.
          </Centered>
        )
      ) : (
        <Box>
          <Centered sx={{ marginBottom: "10em" }}>
            Select court to view data
          </Centered>

          <InAppNotice />
        </Box>
      )}
    </Stack>
  );
}
