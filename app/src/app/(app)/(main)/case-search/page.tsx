"use client";
import Stack from "@mui/material/Stack";
import CaseSearchBox from "./case-search-box";
import { AdCarouselBooks } from "../../_components/ad-carousell-books.tsx";
import { AdCarouselFirms } from "../../_components/ad-carousell-firms.tsx";

export default function Page() {
  return (
    <Stack
      alignContent={"center"}
      justifyContent="space-between"
      minHeight="80vh"
    >
      <CaseSearchBox initialSearchText="" />
      <AdCarouselBooks />
      <AdCarouselFirms />
    </Stack>
  );
}
