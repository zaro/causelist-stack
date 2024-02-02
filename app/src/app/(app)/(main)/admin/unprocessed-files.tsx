import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import LinkIcon from "@mui/icons-material/Link";
import AdbIcon from "@mui/icons-material/Adb";
import HdrAutoIcon from "@mui/icons-material/HdrAuto";
import PermDeviceInformationIcon from "@mui/icons-material/PermDeviceInformation";
import { userStore } from "../../_store/index.ts";
import useSWR from "swr";
import { ICourtStats } from "../../../../api/courts.ts";
import { addAuthHeader, fetcher } from "../../_components/fetcher.ts";

import {
  DataGrid,
  GridRowsProp,
  GridColDef,
  GridValueGetterParams,
  GridRowParams,
  GridActionsCellItem,
} from "@mui/x-data-grid";
import useSearchParamState from "./use-search-param-state.hook.ts";
import { DocumentTypeHint } from "../../../../api/index.ts";
import { useCallback, useMemo, useState } from "react";
import ErrorBox from "../../_components/error-box.tsx";

const dataColumns: GridColDef[] = [
  {
    field: "fileName",
    headerName: "Filename",
    minWidth: 200,
    flex: 1,
    valueGetter: (params: GridValueGetterParams) => {
      return params.value ? params.value.replace(":", " / ") : null;
    },
  },
  {
    field: "overrideDocumentType",
    headerName: "Type",
    description: "Override how this file should be processed",
    width: 100,
    valueGetter: (params: GridValueGetterParams) => {
      return params.value ?? "AUTO";
    },
  },
  {
    field: "createdAt",
    headerName: "Downloaded",
    description: "The date file was downloaded",
    width: 200,
    type: "dateTime",
    valueGetter: (params: GridValueGetterParams) => {
      return params.value ? new Date(params.value) : null;
    },
  },
];

export default function UnprocessedFiles() {
  const accessToken = userStore.use.accessToken();
  const { searchParams } = useSearchParamState();
  const [error, setError] = useState<string[]>([]);

  const court = searchParams.get("court");
  const apiURL = court ? `api/info-files/for-court/${court}/` : null;

  const { data: rows, mutate } = useSWR<ICourtStats[]>(apiURL, fetcher, {
    suspense: true,
  });

  const updateDocumentType = useCallback(
    (docId: string, type: DocumentTypeHint) => {
      fetch(
        `/api/info-files/${docId}`,
        addAuthHeader({
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ overrideDocumentType: type }),
        })
      ).then(async (r) => {
        const body = await r.json();
        if (r.status === 200) {
          mutate(undefined, { revalidate: true });
        } else {
          console.error(body);
          setError([JSON.stringify(body)]);
        }
      });
    },
    []
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      ...dataColumns,
      {
        field: "actions",
        type: "actions",
        getActions: (params: GridRowParams) => [
          <GridActionsCellItem
            key="1"
            icon={<LinkIcon />}
            label="Open"
            onClick={() => window.open(params.row.fileUrl, "_blank")}
          />,
          <GridActionsCellItem
            key="2"
            icon={<AdbIcon />}
            label="Debug"
            onClick={() =>
              window.open(`/admin/causelist-debug/${params.row._id}`, "_blank")
            }
          />,
          <GridActionsCellItem
            showInMenu={true}
            key="3"
            icon={<PermDeviceInformationIcon />}
            label="Set to be processed as NOTICE"
            onClick={() => {
              updateDocumentType(params.row._id, "NOTICE");
            }}
          />,
          <GridActionsCellItem
            showInMenu={true}
            key="4"
            icon={<HdrAutoIcon />}
            label="Set to be processed as AUTO"
            onClick={() => {
              updateDocumentType(params.row._id, "AUTO");
            }}
          />,
        ],
      },
    ],
    []
  );

  if (!rows) {
    return <h1>Invalid parameters</h1>;
  }
  return (
    <Stack height={"100%"}>
      <ErrorBox error={error} />

      <Grid container>
        <Grid item xs={10}>
          <Alert severity="info">{court}</Alert>
        </Grid>
      </Grid>
      <DataGrid rows={rows} columns={columns} getRowId={(r) => r._id} />
    </Stack>
  );
}
