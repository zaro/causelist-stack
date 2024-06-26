"use client";
import Stack from "@mui/material/Stack";
import CaseSearchBox from "./case-search-box";
import { AdCarousel } from "../../_components/ad-carousell.tsx";

export default function Page() {
  return (
    <Stack
      alignContent={"center"}
      justifyContent="space-between"
      minHeight="80vh"
    >
      <CaseSearchBox initialSearchText="" />
      <AdCarousel />
    </Stack>
  );
}
