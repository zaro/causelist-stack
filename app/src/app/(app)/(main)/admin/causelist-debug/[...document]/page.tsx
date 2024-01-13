"use client";
import { Stack } from "@mui/material";
import { causeListStore } from "../../../../_store/index.ts";
import { Suspense } from "react";
import DailyCauseLists from "../../../../_components/daily-causelist.tsx";
import useSWR from "swr";
import { CauseListDocumentParsed } from "../../../../../../api/index.ts";
import { fetcher } from "../../../../_components/fetcher.ts";
import CauseList from "../../../../_components/causelist.tsx";

function DisplayDebug({ documentId }: { documentId: string }) {
  const apiURL = documentId
    ? `/api/courts/causelist/debug/${documentId}`
    : null;

  const { data, error } = useSWR(apiURL, fetcher, {
    suspense: true,
  });

  if (!data) {
    return <h1>Loading failed</h1>;
  }
  return <iframe height="600px" srcDoc={data.debugHTML}></iframe>;
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
