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
  gridDateComparator,
} from "@mui/x-data-grid";
import { useMemo } from "react";
import useSearchParamState from "./use-search-param-state.hook.ts";
import { ICorrectionJob } from "../../../../api/jobs.ts";

const dataColumns: GridColDef[] = [
  {
    field: "finishedOn",
    headerName: "Finished On",
    description: "Job completion time",
    width: 200,
    type: "dateTime",
    valueGetter: (params: GridValueGetterParams) => {
      return params.value ? new Date(params.value) : null;
    },
    sortComparator: (v1: Date | null, v2: Date | null) => {
      if (!v1 && !v2) {
        return 0;
      }
      if (!v1 && v2) {
        return 1;
      }
      if (v1 && !v2) {
        return -1;
      }
      return (v1 as Date).getDate() - (v2 as Date).getDate();
    },
  },
  { field: "sha1", headerName: "Sha1", width: 200 },
  { field: "fileName", headerName: "File Name", minWidth: 200, flex: 1 },
  { field: "status", headerName: "Status", width: 200 },
];

export default function DisplayCorrectionJobs() {
  const accessToken = userStore.use.accessToken();

  const { data: rows, error } = useSWR<ICorrectionJob[]>(
    `/api/k8s-jobs/corrections`,
    fetcher,
    {
      suspense: true,
      refreshInterval: 10000,
    }
  );

  const columns = useMemo<GridColDef[]>(() => [...dataColumns], []);

  if (!rows) {
    return <h1>Loading failed</h1>;
  }
  return (
    <Stack height={"100%"}>
      <Grid container>
        <Grid item xs={12}>
          <Alert severity="info">{rows.length} jobs total</Alert>
        </Grid>
      </Grid>
      <DataGrid
        rows={rows}
        columns={columns}
        initialState={{
          sorting: {
            sortModel: [{ field: "finishedOn", sort: "desc" }],
          },
        }}
      />
    </Stack>
  );
}
