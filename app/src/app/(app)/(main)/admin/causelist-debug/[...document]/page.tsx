"use client";
import Stack from "@mui/material/Stack";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import IframeResizer from "iframe-resizer-react";
import { causeListStore } from "../../../../_store/index.ts";
import { Suspense, useState } from "react";
import DailyCauseLists from "../../../../_components/daily-causelist.tsx";
import useSWR from "swr";
import { CauseListDocumentParsed } from "../../../../../../api/index.ts";
import { fetcher } from "../../../../_components/fetcher.ts";
import CauseList from "../../../../_components/causelist.tsx";

function DisplayDebug({ documentId }: { documentId: string }) {
  const [corrected, setCorrected] = useState<boolean | undefined>();
  const apiURL = documentId
    ? `/api/courts/causelist/debug/${documentId}` +
      (typeof corrected === "boolean" ? "/" + corrected.toString() : "")
    : null;

  const { data, error } = useSWR(apiURL, fetcher, {
    suspense: true,
  });

  if (!data) {
    return <h1>Loading failed</h1>;
  }
  return (
    <Stack>
      <div>
        File Sha1 : {data.infoFile.sha1} , Has Correction:{" "}
        {data.infoFile.hasCorrection ? "YES" : "NO"}
      </div>
      <FormGroup>
        <FormControlLabel
          disabled={!data.infoFile.hasCorrection}
          control={
            <Switch
              checked={data.usedCorrectedVersion}
              onChange={(event) => setCorrected(event.target.checked)}
            />
          }
          label="Use Corrected Version"
        />
      </FormGroup>
      <IframeResizer
        height="600px"
        srcDoc={data.debugHTML}
        log={false}
        scrolling={true}
      ></IframeResizer>
    </Stack>
  );
}

export default function Page({ params }: { params: { document: string[] } }) {
  const documentId = params.document[0];

  return (
    <Stack height={"100%"}>
      <Suspense fallback={<h3>Loading data</h3>}>
        <DisplayDebug documentId={documentId} />
      </Suspense>
    </Stack>
  );
}
