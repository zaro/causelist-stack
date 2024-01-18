"use client";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import CourtSelector from "../../_components/court-selector.tsx";
import { causeListStore, userStore } from "../../_store/index.ts";
import { Suspense } from "react";
import { BarChart } from "@mui/x-charts/BarChart";

import DailyCauseLists from "../../_components/daily-causelist.tsx";
import Calendar from "../../_components/calendar.tsx";
import { IUserStats } from "../../../../api/users.ts";
import useSWR from "swr";
import { fetcher } from "../../_components/fetcher.ts";

const version = process.env.NEXT_PUBLIC_APP_VERSION ?? "dev";

function DisplayStats() {
  const accessToken = userStore.use.accessToken();
  const { data, error } = useSWR<IUserStats>(`/api/users/stats`, fetcher, {
    suspense: true,
  });

  if (!data) {
    return <h1>Loading failed</h1>;
  }
  return (
    <Stack height={"100%"}>
      <Grid container>
        <Grid item xs={10}>
          <Alert severity="info">{data.totalCount} users total</Alert>
        </Grid>
        <Grid item xs={2}>
          <Button href={`/api/users/export?jwt=${accessToken}`} target="_blank">
            Download CSV
          </Button>
        </Grid>
      </Grid>
      <BarChart
        xAxis={[
          {
            id: "barCategories",
            data: Object.keys(data.countByDay),
            scaleType: "band",
            label: "Day",
          },
        ]}
        series={[
          {
            data: Object.values(data.countByDay).map((c) => c.totalCount),
            color: "#e08f4f",
            label: "Daily users total",
          },
          {
            data: Object.values(data.countByDay).map((c) => c.otpUsedCount),
            color: "#932c2b",
            label: "Daily users signed up and logged in",
          },
          {
            data: Object.values(data.countByDay).map((c) => c.otpUnusedCount),
            color: "red",
            label: "Daily users signed up and never logged in",
          },
        ]}
        width={500}
        height={500}
      />
    </Stack>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<h3>Loading data</h3>}>
      <DisplayStats />
    </Suspense>
  );
}
