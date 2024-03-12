"use client";
import Stack from "@mui/material/Stack";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Editor from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { causeListStore } from "../../../../_store/index.ts";
import { Suspense, useRef, useState } from "react";
import DailyCauseLists from "../../../../_components/daily-causelist.tsx";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { CauseListDocumentParsed } from "../../../../../../api/index.ts";
import {
  addAuthHeader,
  fetcher,
  fetcherPlainText,
} from "../../../../_components/fetcher.ts";
import CauseList from "../../../../_components/causelist.tsx";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import LinearProgress from "@mui/material/LinearProgress";

async function savePlainText(url: string, { arg }: { arg: string }) {
  return fetch(
    url,
    addAuthHeader({
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: arg,
      }),
    })
  ).then((res) => res.json());
}

function EditPlainText({ documentId }: { documentId: string }) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const apiURL = documentId ? `/api/info-files/plain-text/${documentId}` : null;

  const { data } = useSWR(apiURL, fetcher, {
    suspense: true,
  });
  const { trigger: saveText, isMutating } = useSWRMutation(
    apiURL,
    savePlainText
  );

  if (!data) {
    return <h1>Loading failed</h1>;
  }
  return (
    <Stack>
      <Grid container spacing="0.5em" marginBottom="1em">
        <Grid item xs={8}>
          {isMutating ? (
            <LinearProgress color="success" />
          ) : (
            <b>{data.infoFile.fileName}</b>
          )}
        </Grid>
        <Grid item xs={1}>
          <Button
            variant="outlined"
            disabled={isMutating}
            onClick={() => editorRef.current?.setValue(data.content)}
          >
            Revert
          </Button>
        </Grid>
        <Grid item xs={1}>
          <Button
            variant="outlined"
            disabled={isMutating}
            onClick={() => saveText(editorRef.current?.getValue() ?? "")}
          >
            Save
          </Button>
        </Grid>
        <Grid item xs={2}>
          <Button
            variant="contained"
            disabled={isMutating}
            onClick={() =>
              saveText(editorRef.current?.getValue() ?? "").then(() => {
                window.open(`/admin/causelist-debug/${documentId}`, "_blank");
              })
            }
          >
            Save & Debug
          </Button>
        </Grid>
      </Grid>
      <Editor
        height="70vh"
        defaultLanguage="text"
        defaultValue={data.content}
        onMount={(editor, monaco) => {
          editorRef.current = editor;
        }}
      />
    </Stack>
  );
}

export default function Page({ params }: { params: { document: string[] } }) {
  const documentId = params.document[0];

  return (
    <Stack height={"100%"}>
      <Suspense fallback={<h3>Loading data</h3>}>
        <EditPlainText documentId={documentId} />
      </Suspense>
    </Stack>
  );
}
