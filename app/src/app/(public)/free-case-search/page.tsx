"use client";
import Stack from "@mui/material/Stack";
import CaseSearchBox from "../../(app)/(main)/case-search/case-search-box.tsx";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import { AppLink } from "../../(app)/_components/app-link.tsx";

export default function Page() {
  return (
    <Stack minHeight="50vh" justifyItems="center">
      <Alert
        variant="outlined"
        severity="warning"
        sx={{ marginX: "auto", marginBottom: "4em" }}
      >
        Search all cases up to year 2010.{" "}
        <AppLink href="/sign-up">Sign up</AppLink> to get free unlimited access!
      </Alert>
      <CaseSearchBox initialSearchText="" caseSearchPath="/free-case-search" />
    </Stack>
  );
}
