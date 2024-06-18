"use client";
import Stack from "@mui/material/Stack";
import CaseSearchBox from "./case-search-box";

export default function Page() {
  return (
    <Stack alignContent={"center"}>
      <CaseSearchBox initialSearchText="" />
    </Stack>
  );
}
