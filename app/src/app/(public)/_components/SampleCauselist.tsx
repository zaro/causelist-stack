import { CauseListDocumentParsed } from "@/api";
import Stack from "@mui/material/Stack";
import CauseList from "../../(app)/_components/causelist.tsx";

export interface SampleCauseListsProps {
  data: CauseListDocumentParsed[];
}

export default function SampleCauseLists({ data }: SampleCauseListsProps) {
  return (
    <Stack spacing={0} margin={"0 auto"}>
      {data?.map((c, idx) => (
        <CauseList key={idx} data={c} />
      ))}
    </Stack>
  );
}
