"use client";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import Box from "@mui/material/Box";
import CourtSelector from "../../_components/court-selector.tsx";
import { causeListStore, userStore } from "../../_store/index.ts";
import { Suspense } from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import {
  DataGrid,
  GridRowsProp,
  GridColDef,
  GridValueGetterParams,
} from "@mui/x-data-grid";

import DailyCauseLists from "../../_components/daily-causelist.tsx";
import Calendar from "../../_components/calendar.tsx";
import { IUserStats } from "../../../../api/users.ts";
import useSWR from "swr";
import { fetcher } from "../../_components/fetcher.ts";
import React from "react";
import { ICourtStats } from "../../../../api/courts.ts";

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
        width={600}
        height={500}
      />
    </Stack>
  );
}

const columns: GridColDef[] = [
  { field: "name", headerName: "Court", minWidth: 200, flex: 1 },
  {
    field: "documentsCount",
    description:
      "This is the total number of documents for the court we have in the system",
    headerName: "Doc Count",
    width: 150,
    type: "number",
  },
  {
    field: "unparsedCount",
    description:
      "This is the number of  Unprocessed documents for the court we have in the system",
    headerName: "Unp Count",
    width: 150,
    type: "number",
  },
  {
    field: "lastImportedDocumentTime",
    headerName: "Newest downloaded Doc",
    description: "This is last date we downloaded a document for this court",
    width: 200,
    type: "dateTime",
    valueGetter: (params: GridValueGetterParams) => {
      return params.value ? new Date(params.value) : null;
    },
  },
  {
    field: "lastParsedDocumentTime",
    headerName: "Newest Parsed Doc",
    description: "This is last date we parsed a document for this court",
    width: 200,
    type: "dateTime",
    valueGetter: (params: GridValueGetterParams) => {
      return params.value ? new Date(params.value) : null;
    },
  },
];

function DisplayCourts() {
  const accessToken = userStore.use.accessToken();
  const { data: rows, error } = useSWR<ICourtStats[]>(
    `/api/courts/admin/stats`,
    fetcher,
    {
      suspense: true,
    }
  );

  if (!rows) {
    return <h1>Loading failed</h1>;
  }
  return (
    <Stack height={"100%"}>
      <Grid container>
        <Grid item xs={10}>
          <Alert severity="info">{rows.length} courts total</Alert>
        </Grid>
        <Grid item xs={2}>
          <Button
            href={`/api/courts/admin/stats/export?jwt=${accessToken}`}
            target="_blank"
          >
            Download CSV
          </Button>
        </Grid>
      </Grid>
      <DataGrid rows={rows} columns={columns} />
    </Stack>
  );
}

export default function Page() {
  const [tab, setTab] = React.useState("1");

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setTab(newValue);
  };

  return (
    <Suspense fallback={<h3>Loading data</h3>}>
      <Box sx={{ width: "100%", typography: "body1" }}>
        <TabContext value={tab}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <TabList onChange={handleChange} aria-label="lab API tabs example">
              <Tab label="Home" value="1" />
              <Tab label="Courts" value="2" />
            </TabList>
          </Box>
          <TabPanel value="1">
            <DisplayStats />
          </TabPanel>
          <TabPanel value="2">
            <DisplayCourts />
          </TabPanel>
        </TabContext>
      </Box>
    </Suspense>
  );
}
