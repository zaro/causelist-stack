import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import ViewListIcon from "@mui/icons-material/ViewList";
import { userStore } from "../../_store/index.ts";
import useSWR from "swr";
import { ICourtStats } from "../../../../api/courts.ts";
import { fetcher } from "../../_components/fetcher.ts";

import {
  DataGrid,
  GridRowsProp,
  GridColDef,
  GridValueGetterParams,
  GridActionsCellItem,
} from "@mui/x-data-grid";
import { useMemo } from "react";
import useSearchParamState from "./use-search-param-state.hook.ts";

const dataColumns: GridColDef[] = [
  { field: "name", headerName: "Court", minWidth: 200, flex: 1 },
  {
    field: "documentsCount",
    description:
      "This is the total number of documents for the court we have in the system",
    headerName: "Doc #",
    width: 100,
    type: "number",
  },
  {
    field: "unparsedCount",
    description:
      "This is the number of  Unprocessed documents for the court we have in the system",
    headerName: "Unp #",
    width: 100,
    type: "number",
  },
  {
    field: "unparsedNoticeCount",
    description:
      "This is the number of  Notices for the court we have in the system",
    headerName: "Notice #",
    width: 100,
    type: "number",
  },
  {
    field: "lastImportedDocumentTime",
    headerName: "Newest downloaded Doc",
    description: "This is last date we downloaded a document for this court",
    width: 200,
    type: "dateTime",
    valueGetter: (params: GridValueGetterParams) => {
      return params.value ? new Date(params.value) : null;
    },
  },
  {
    field: "lastParsedDocumentTime",
    headerName: "Newest Parsed Doc",
    description: "This is last date we parsed a document for this court",
    width: 200,
    type: "dateTime",
    valueGetter: (params: GridValueGetterParams) => {
      return params.value ? new Date(params.value) : null;
    },
  },
];

export default function DisplayCourts() {
  const accessToken = userStore.use.accessToken();
  const { searchParams, setParam } = useSearchParamState();

  const { data: rows, error } = useSWR<ICourtStats[]>(
    `/api/courts/admin/stats`,
    fetcher,
    {
      suspense: true,
    }
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      ...dataColumns,
      {
        field: "actions",
        type: "actions",
        width: 80,
        getActions: (params) => [
          <GridActionsCellItem
            key="1"
            icon={<ViewListIcon />}
            label="Show unprocessed"
            onClick={() =>
              setParam("tab", "unprocessed", "court", params.row.path)
            }
          />,
        ],
      },
    ],
    [setParam]
  );

  if (!rows) {
    return <h1>Loading failed</h1>;
  }
  return (
    <Stack height={"100%"}>
      <Grid container>
        <Grid item xs={10}>
          <Alert severity="info">{rows.length} courts total</Alert>
        </Grid>
        <Grid item xs={2}>
          <Button
            href={`/api/courts/admin/stats/export?jwt=${accessToken}`}
            target="_blank"
          >
            Download CSV
          </Button>
        </Grid>
      </Grid>
      <DataGrid rows={rows} columns={columns} />
    </Stack>
  );
}
