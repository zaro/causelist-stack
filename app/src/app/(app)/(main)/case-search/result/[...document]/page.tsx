"use client";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import IframeResizer from "iframe-resizer-react";
import { Hit } from "meilisearch";

import { causeListStore } from "../../../../_store/index.ts";
import { Suspense } from "react";
import DailyCauseLists from "../../../../_components/daily-causelist.tsx";
import useSWR from "swr";
import { CauseListDocumentParsed } from "../../../../../../api/index.ts";
import { fetcher } from "../../../../_components/fetcher.ts";
import CauseList from "../../../../_components/causelist.tsx";
import CauseListDocuments from "../../../../_components/causelist-documents.tsx";
import ErrorBoundary from "../../../../../_common/error-boundary.tsx";
import { CaseIndex } from "../../../../../../api/search-index.ts";

import Typography from "@mui/material/Typography";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { AppLink } from "../../../../_components/app-link.tsx";
import CircularProgress from "@mui/material/CircularProgress";

function CaseSpinner() {
  return (
    <Grid container justifyContent={"center"}>
      <Grid item>
        <CircularProgress />
      </Grid>
    </Grid>
  );
}

function CaseContent({
  documentId,
  hightLight,
}: {
  documentId: string;
  hightLight: string;
}) {
  const apiURL = documentId
    ? `/api/cases/load/${documentId}/${hightLight}`
    : null;
  const { data, isLoading, error } = useSWR<Hit<CaseIndex>>(apiURL, fetcher, {
    suspense: true,
  });
  if (!data) {
    return <h1>Loading failed</h1>;
  }
  const iframeData = data._formatted?.html?.replace(
    "</head>",
    `
    <style>
      body {
        background: #f0f0f0;
      }
      p {
        white-space: pre-wrap;
      }
      b {
        background: yellow;
      }

    .page {
      position: relative;
      padding: 1em;
      background: #fff;
      margin: 3em auto;
      box-shadow: 0px 2px 38px rgba(0, 0, 0, 0.2);
    }
    .page:after, .page:before{
      content: '';
      position: absolute;
      left: auto;
      background:none;
      z-index: -1;
    }
    .page:after{
      width: 90%;
      height: 10px;
      top: 30px;
      right:8px;
      -webkit-transform: rotate(-3deg);
      -moz-transform: rotate(-3deg);
      -o-transform: rotate(-3deg);
      -ms-transform: rotate(-3deg);
      transform: rotate(-3deg);
      -webkit-box-shadow: 0px -20px 36px 5px #295d92;
      -moz-box-shadow: 0px -20px 36px 5px #295d92;
      box-shadow: 0px -25px 35px 0px rgba(0,0,0,0.5);
    }

    .page:before{
      width: 10px;
      height: 95%;
      top: 5px;
      right:18px;
      -webkit-transform: rotate(3deg);
      -moz-transform: rotate(3deg);
      -o-transform: rotate(3deg);
      -ms-transform: rotate(3deg);
      transform: rotate(3deg);
      -webkit-box-shadow: 20px 0px 25px 5px #295d92;
      -moz-box-shadow: 20px 0px 25px 5px #295d92;
      box-shadow: 22px 0px 35px 0px rgba(0,0,0,0.5);
    }

    </style>
    <script src="/iframe-resizer-child.js"></script>

    </head>
    `
  );
  let metadata = data?.meta?.metadata;
  return isLoading ? (
    <CaseSpinner />
  ) : (
    <>
      <Accordion>
        <AccordionSummary
          expandIcon={<ArrowDropDownIcon />}
          aria-controls="panel1-content"
          id="panel1-header"
        >
          <Typography variant="h4">{data.title}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {metadata && (
            <table style={{ borderCollapse: "collapse" }}>
              {Object.entries(metadata).map(([k, v]) => (
                <tr key={k} style={{ borderBottom: "1pt solid grey" }}>
                  <td style={{ whiteSpace: "nowrap", paddingRight: "1em" }}>
                    <b>{k}</b>
                  </td>
                  <td>{v as string}</td>
                </tr>
              ))}
              <tr></tr>
            </table>
          )}
        </AccordionDetails>
      </Accordion>
      <Button
        onClick={() => window.open(`/api/cases/pdf/${documentId}`, "_blank")}
      >
        PDF
      </Button>
      <IframeResizer
        width={"100%"}
        srcDoc={iframeData}
        log={false}
        scrolling={false}
        checkOrigin={false}
        bodyPadding="0 0 3em 0"
        style={{
          border: 0,
        }}
      ></IframeResizer>
    </>
  );
}

export default function Page({ params }: { params: { document: string[] } }) {
  const documentId = params.document[0];
  const hightLight = params.document[1]
    ? decodeURIComponent(params.document[1])
    : "";

  return (
    <Stack
      height={"100%"}
      sx={{ background: "#f0f0f0", borderRadius: "10px", padding: "10px" }}
    >
      <ErrorBoundary fallback={<h3>Invalid search</h3>}>
        <Suspense fallback={<h3>Loading data</h3>}>
          <CaseContent documentId={documentId} hightLight={hightLight} />
        </Suspense>
      </ErrorBoundary>
    </Stack>
  );
}
