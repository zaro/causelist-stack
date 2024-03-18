import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ViewListIcon from "@mui/icons-material/ViewList";
import ViewHeadlineIcon from "@mui/icons-material/ViewHeadline";
import { userStore } from "../../_store/index.ts";
import useSWR from "swr";
import { ICourtStats } from "../../../../api/courts.ts";
import { addAuthHeader, fetcher } from "../../_components/fetcher.ts";

import {
  DataGrid,
  GridRowsProp,
  GridColDef,
  GridValueGetterParams,
  GridActionsCellItem,
  gridDateComparator,
  GridRowParams,
} from "@mui/x-data-grid";
import { useMemo, useState } from "react";
import useSearchParamState from "./use-search-param-state.hook.ts";
import { IAutomatedJob, ICorrectionJob } from "../../../../api/jobs.ts";

const dataColumns: GridColDef[] = [
  {
    field: "type",
    headerName: "Type",
    width: 100,
  },
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
      return (v1 as Date).getTime() - (v2 as Date).getTime();
    },
  },
  {
    field: "crawlTimeH",
    headerName: "Crawl Time",
    description: "Time when crawling started",
    width: 200,
    type: "dateTime",
    valueGetter: (params: GridValueGetterParams) => {
      return params.row.crawlTime ? new Date(params.row.crawlTime) : null;
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
      return (v1 as Date).getTime() - (v2 as Date).getTime();
    },
  },
  { field: "crawlTime", headerName: "Crawl Key", width: 200, flex: 1 },
  { field: "status", headerName: "Status", width: 200 },
];

export default function DisplayAutomatedJobs() {
  const accessToken = userStore.use.accessToken();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const {
    data: rows,
    error,
    mutate,
  } = useSWR<IAutomatedJob[]>(`/api/k8s-jobs/automated`, fetcher, {
    suspense: true,
    refreshInterval: 10000,
  });

  const columns = useMemo<GridColDef[]>(
    () => [
      ...dataColumns,
      {
        field: "actions",
        type: "actions",
        getActions: (params: GridRowParams) => [
          <GridActionsCellItem
            showInMenu={true}
            key="5"
            icon={<ViewHeadlineIcon />}
            label="View Job Log"
            onClick={() => {
              window.open(
                `/api/k8s-jobs/job-log/${params.row.type}/${params.row.crawlTime}?jwt=${accessToken}`,
                "_blank"
              );
            }}
          />,
        ],
      },
    ],
    []
  );

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
        getRowId={(row) => `${row.type}-${row.id}`}
        initialState={{
          sorting: {
            sortModel: [{ field: "finishedOn", sort: "desc" }],
          },
        }}
      />
    </Stack>
  );
}
