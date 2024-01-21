"use client";
import { Stack } from "@mui/material";
import { causeListStore } from "../../../../_store/index.ts";
import { Suspense } from "react";
import DailyCauseLists from "../../../../_components/daily-causelist.tsx";
import useSWR from "swr";
import { CauseListDocumentParsed } from "../../../../../../api/index.ts";
import { fetcher } from "../../../../_components/fetcher.ts";
import CauseList from "../../../../_components/causelist.tsx";
import CauseListDocuments from "../../../../_components/causelist-documents.tsx";

function SingleCauseList({
  documentId,
  hightLight,
}: {
  documentId: string;
  hightLight: number[];
}) {
  const apiURL = documentId ? `/api/courts/causelist/${documentId}` : null;
  const { data, error } = useSWR<CauseListDocumentParsed>(apiURL, fetcher, {
    suspense: true,
  });
  if (!data) {
    return <h1>Loading failed</h1>;
  }
  return (
    <Stack spacing={0} margin={"0 auto"}>
      <CauseListDocuments data={[data]} highLight={hightLight} />
    </Stack>
  );
}

export default function Page({ params }: { params: { document: string[] } }) {
  const documentId = params.document[0];
  const hightLight = params.document[1]
    ? decodeURIComponent(params.document[1])
        .split(",")
        .map((v) => parseInt(v, 10))
    : [];

  console.log(">>>", params);
  return (
    <Stack height={"100%"}>
      <Suspense fallback={<h3>Loading data</h3>}>
        <SingleCauseList documentId={documentId} hightLight={hightLight} />
      </Suspense>
    </Stack>
  );
}
