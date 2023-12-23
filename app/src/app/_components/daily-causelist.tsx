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
import { fetcher } from "./fetcher.ts";
import useSWR from "swr";
import { formatOrdinals } from "./ordinal.ts";

import { CauseListDocumentParsed } from "@/api";
import CauseList from "./causelist.tsx";
import JudgeSelector from "./judge-selector.tsx";
import { causeListStore } from "../_store/index.ts";

export interface DailyCauseListProps {
  date: Date | null;
  court: string | null;
}

export default function DailyCauseLists({ date, court }: DailyCauseListProps) {
  const day = date?.getDate();
  const apiURL =
    date && court
      ? `/api/courts/${date.getFullYear()}/${
          date.getMonth() + 1
        }/${day}/${court}/list`
      : null;
  // console.log("Date:", seledemoctedDate);
  // console.log("Court:", selectedCourt);
  // console.log("ApiURK:", apiURL);
  const { data, error } = useSWR<CauseListDocumentParsed[]>(apiURL, fetcher, {
    suspense: true,
  });
  const selectedJudges = causeListStore.use.judgesForCurrentCourt() ?? [];
  const filteredData =
    selectedJudges.length === 0
      ? data
      : data?.filter((c) => selectedJudges.indexOf(c.header.judge) > -1);
  return (
    <>
      <Stack spacing={0} margin={"0 auto"}>
        {filteredData?.map((c, idx) => (
          <CauseList key={idx} data={c} />
        ))}
      </Stack>
    </>
  );
}
