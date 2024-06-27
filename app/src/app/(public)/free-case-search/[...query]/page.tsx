import Box from "@mui/material/Box";

import CaseSearchResults from "../../../(app)/(main)/case-search/[...query]/case-search-result.tsx";

export default function Page({ params }: { params: { query: string[] } }) {
  return (
    <Box paddingX={{ xs: "1em", md: "2em" }}>
      <CaseSearchResults
        query={params.query}
        caseSearchPath="/free-case-search"
      />
    </Box>
  );
}
