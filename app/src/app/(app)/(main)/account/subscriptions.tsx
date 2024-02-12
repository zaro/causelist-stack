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
import { ICorrectionJob } from "../../../../api/jobs.ts";
import { ISubscription } from "../../../../api/users.ts";
import { formatDistance } from "date-fns/esm";

const columns: GridColDef[] = [
  {
    field: "tier",
    headerName: "Type",
    width: 100,
  },
  {
    field: "from",
    headerName: "From",
    description: "Subscription Start Time",
    width: 200,
    type: "date",
    valueGetter: (params: GridValueGetterParams) => {
      return params.value ? new Date(params.value) : null;
    },
  },
  {
    field: "to",
    headerName: "To",
    description: "Subscription End Time",
    width: 200,
    type: "date",
    valueGetter: (params: GridValueGetterParams) => {
      return params.value ? new Date(params.value) : null;
    },
  },
];

export default function Subscriptions() {
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
  } = useSWR<ISubscription[]>(`/api/subscription/all`, fetcher, {
    suspense: true,
    refreshInterval: 10000,
  });

  if (!rows) {
    return <h1>Loading failed</h1>;
  }

  const now = new Date();
  const hasActive = rows.some(
    (r) => new Date(r.from) <= now && now <= new Date(r.to)
  );

  const subscriptionEnd = rows.reduce((max, r) => {
    const end = new Date(r.to);
    if (end > max) {
      return end;
    }
    return max;
  }, new Date(0));

  return (
    <Stack height={"100%"}>
      <Grid container>
        <Grid item xs={10}>
          <Alert severity={hasActive ? "info" : "error"}>
            {" "}
            {hasActive
              ? "You are currently subscribed! Subsciption Expires in: " +
                formatDistance(subscriptionEnd, new Date())
              : "You have no active subscriptions!"}
          </Alert>
        </Grid>
        <Grid item xs={2} alignItems="end">
          <Button href="/account/subscribe">Subscribe</Button>
        </Grid>
      </Grid>
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => `${row.type}-${row.id}`}
        initialState={{
          sorting: {
            sortModel: [{ field: "to", sort: "desc" }],
          },
        }}
      />
    </Stack>
  );
}
