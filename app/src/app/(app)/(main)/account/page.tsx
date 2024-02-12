"use client";
import * as React from "react";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";

import Box from "@mui/material/Box";

import useSearchParamState from "../admin/use-search-param-state.hook.ts";
import EditProfile from "./edit-profile.tsx";
import { Suspense } from "react";
import Subscriptions from "./subscriptions.tsx";
import Payments from "./payments.tsx";

export default function Page() {
  const { searchParams, setParam } = useSearchParamState();

  const tab = searchParams.get("tab") ?? "subscription";

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setParam("tab", newValue);
  };

  return (
    <Suspense fallback={<h3>Loading data</h3>}>
      <Box sx={{ width: "100%" }}>
        <TabContext value={tab}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <TabList onChange={handleChange} aria-label="lab API tabs example">
              <Tab label="Subscription" value="subscription" />
              <Tab label="Profile" value="profile" />
            </TabList>
          </Box>
          <TabPanel value="subscription">
            <Subscriptions />
          </TabPanel>
          <TabPanel value="profile">
            <EditProfile />
          </TabPanel>
        </TabContext>
      </Box>
    </Suspense>
  );
}
