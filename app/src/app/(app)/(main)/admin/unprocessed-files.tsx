import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import LinkIcon from "@mui/icons-material/Link";
import AdbIcon from "@mui/icons-material/Adb";
import { userStore } from "../../_store/index.ts";
import useSWR from "swr";
import { ICourtStats } from "../../../../api/courts.ts";
import { fetcher } from "../../_components/fetcher.ts";

import {
  DataGrid,
  GridRowsProp,
  GridColDef,
  GridValueGetterParams,
  GridRowParams,
  GridActionsCellItem,
} from "@mui/x-data-grid";
import useSearchParamState from "./use-search-param-state.hook.ts";

const columns: GridColDef[] = [
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
    field: "createdAt",
    headerName: "Downloaded",
    description: "The date file was downloaded",
    width: 200,
    type: "dateTime",
    valueGetter: (params: GridValueGetterParams) => {
      return params.value ? new Date(params.value) : null;
    },
  },
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
    ],
  },
];

export default function UnprocessedFiles() {
  const accessToken = userStore.use.accessToken();
  const { searchParams } = useSearchParamState();

  const court = searchParams.get("court");
  const apiURL = court ? `api/info-files/for-court/${court}/` : null;

  const { data: rows, error } = useSWR<ICourtStats[]>(apiURL, fetcher, {
    suspense: true,
  });

  if (!rows) {
    return <h1>Invalid parameters</h1>;
  }
  return (
    <Stack height={"100%"}>
      <Grid container>
        <Grid item xs={10}>
          <Alert severity="info">{court}</Alert>
        </Grid>
      </Grid>
      <DataGrid rows={rows} columns={columns} getRowId={(r) => r._id} />
    </Stack>
  );
}
