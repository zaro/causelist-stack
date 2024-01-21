"use client";
import { Stack } from "@mui/material";
import { fetcher } from "./fetcher.ts";
import useSWR from "swr";

import { CauseListDocumentParsed } from "@/api";
import CauseList from "./causelist.tsx";
import { causeListStore } from "../_store/index.ts";
import { ICourt } from "@/api/courts";
import CauseListDocuments from "./causelist-documents.tsx";

export interface DailyCauseListProps {
  date: Date | null;
  court: ICourt | null;
}

export default function DailyCauseLists({ date, court }: DailyCauseListProps) {
  const day = date?.getDate();
  const apiURL =
    date && court
      ? `/api/courts/${date.getFullYear()}/${date.getMonth() + 1}/${day}/${
          court.path
        }/list`
      : null;
  // console.log("Date:", seledemoctedDate);
  // console.log("Court:", selectedCourt);
  // console.log("ApiURK:", apiURL);
  const { data, error } = useSWR<CauseListDocumentParsed[]>(apiURL, fetcher, {
    suspense: true,
  });
  const selectedJudges = causeListStore.use.selectedJudges() ?? [];
  const filteredData =
    selectedJudges.length === 0
      ? data
      : data?.filter(
          (c) =>
            c.type === "CAUSE LIST" &&
            selectedJudges.indexOf(c.header.judge) > -1
        );
  return <CauseListDocuments data={filteredData} />;
}
