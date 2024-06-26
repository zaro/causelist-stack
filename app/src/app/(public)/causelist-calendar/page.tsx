"use client";
import { Stack } from "@mui/material";
import Box from "@mui/material/Box";
import CourtSelector from "../../(app)/_components/court-selector.tsx";
import { Suspense } from "react";
import DailyCauseLists from "../../(app)/_components/daily-causelist.tsx";
import Calendar from "../../(app)/_components/calendar.tsx";
import JudgeSelector from "../../(app)/_components/judge-selector.tsx";
import Centered from "../../(app)/_components/centered.tsx";
import InAppNotice from "../../(app)/_components/in-app-notice.tsx";
import ErrorBoundary from "../../_common/error-boundary.tsx";
import SubscriptionRequired from "../../(app)/_components/subscription-required.tsx";
import { causeListStore } from "../../(app)/_store/index.ts";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

export default function Page() {
  const selectedCourt = causeListStore.use.selectedCourt();
  const selectedDate = causeListStore.use.selectedDate();

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
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
              We do not support this court yet, but we are working hard to add
              it to our database.
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
    </LocalizationProvider>
  );
}
