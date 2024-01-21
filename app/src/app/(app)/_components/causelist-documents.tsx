import { CauseListDocumentParsed } from "@/api";
import Stack from "@mui/material/Stack";
import CauseList from "./causelist.tsx";
import UnassignedMatters from "./unassigned-matters.tsx";

export interface CauseListDocumentsProps {
  data?: CauseListDocumentParsed[];
  highLight?: number[];
}

export default function CauseListDocuments({
  data,
  highLight,
}: CauseListDocumentsProps) {
  return (
    <Stack spacing={0} margin={"0 auto"}>
      {data?.map((c, idx) => {
        switch (c.type) {
          case "CAUSE LIST":
            return <CauseList key={idx} data={c} highLight={highLight} />;
          case "UNASSIGNED MATTERS":
            return (
              <UnassignedMatters key={idx} data={c} highLight={highLight} />
            );
        }
      })}
    </Stack>
  );
}
