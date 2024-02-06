"use client";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import Box from "@mui/material/Box";
import { Suspense, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import React from "react";
import DisplayCourts from "./display-courts.tsx";
import DisplayStats from "./display-stats.tsx";
import UnprocessedFiles from "./unprocessed-files.tsx";
import useSearchParamState from "./use-search-param-state.hook.ts";
import DisplayJobs from "./display-jobs.tsx";

export default function Page() {
  const { searchParams, setParam } = useSearchParamState();

  const tab = searchParams.get("tab") ?? "stats";

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setParam("tab", newValue);
  };

  return (
    <Suspense fallback={<h3>Loading data</h3>}>
      <Box sx={{ width: "100%", typography: "body1" }}>
        <TabContext value={tab}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <TabList onChange={handleChange} aria-label="lab API tabs example">
              <Tab label="Home" value="stats" />
              <Tab label="Courts" value="courts" />
              <Tab label="Unprocessed" value="unprocessed" />
              <Tab label="Jobs" value="jobs" />
            </TabList>
          </Box>
          <TabPanel value="stats">
            <DisplayStats />
          </TabPanel>
          <TabPanel value="courts">
            <DisplayCourts />
          </TabPanel>
          <TabPanel value="unprocessed">
            <UnprocessedFiles />
          </TabPanel>
          <TabPanel value="jobs">
            <DisplayJobs />
          </TabPanel>
        </TabContext>
      </Box>
    </Suspense>
  );
}
