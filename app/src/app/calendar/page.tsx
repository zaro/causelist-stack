"use client";
import {
  List,
  ListItem,
  ListItemText,
  Stack,
  Paper,
  Typography,
} from "@mui/material";
import Chip from "@mui/material/Chip";
import { styled } from "@mui/material/styles";
import CourtSelector from "../_components/court-selector.tsx";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { causeListStore } from "../_store";
import { Suspense, useEffect, useState } from "react";
import useSWR from "swr";
import DailyCauseLists from "../_components/daily-causelist.tsx";
import Calendar from "../_components/calendar.tsx";

const minDate = new Date("2023-01-01");
const maxDate = new Date(`${new Date().getFullYear() + 1}-12-31`);

export default function Page() {
  const selectedCourt = causeListStore.use.selectedCourt();
  const selectedDate = causeListStore.use.selectedDate();

  return (
    <Stack>
      <CourtSelector />
      <Calendar />
      <Suspense fallback={<h3>Loading data</h3>}>
        <DailyCauseLists date={selectedDate} court={selectedCourt} />
      </Suspense>
    </Stack>
  );
}
