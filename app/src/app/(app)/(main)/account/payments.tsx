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

const columns: GridColDef[] = [
  {
    field: "orderId",
    headerName: "Order",
    width: 100,
  },
  { field: "amount", headerName: "Amount", width: 200 },
  { field: "status", headerName: "Status", width: 200 },
  {
    field: "updatedAt",
    headerName: "Date",
    description: "Payment last Update",
    width: 200,
    type: "dateTime",
    valueGetter: (params: GridValueGetterParams) => {
      return params.value ? new Date(params.value) : null;
    },
  },
];

export default function Payments() {
  const accessToken = userStore.use.accessToken();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const { data: rows, error } = useSWR<ICorrectionJob[]>(
    `/api/payments/all`,
    fetcher,
    {
      suspense: true,
      refreshInterval: 10000,
    }
  );

  if (!rows) {
    return <h1>Loading failed</h1>;
  }
  return (
    <Stack height={"100%"}>
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => `${row.type}-${row.id}`}
        initialState={{
          sorting: {
            sortModel: [{ field: "updatedAt", sort: "desc" }],
          },
        }}
      />
    </Stack>
  );
}
