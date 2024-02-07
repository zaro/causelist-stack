import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import LinkIcon from "@mui/icons-material/Link";
import AdbIcon from "@mui/icons-material/Adb";
import HdrAutoIcon from "@mui/icons-material/HdrAuto";
import PermDeviceInformationIcon from "@mui/icons-material/PermDeviceInformation";
import EditNoteIcon from "@mui/icons-material/EditNote";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
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
  GridFilterModel,
} from "@mui/x-data-grid";
import useSearchParamState from "./use-search-param-state.hook.ts";
import { DocumentTypeHint } from "../../../../api/index.ts";
import { useCallback, useEffect, useMemo, useState } from "react";
import ErrorBox from "../../_components/error-box.tsx";
import UploadCorrectionDialog, {
  UploadCorrectionDialogProps,
} from "./upload-correction-dialog.tsx";
import { IInfoFile } from "../../../../api/info-file.ts";
import RemoveCorrectionDialog, {
  RemoveCorrectionDialogProps,
} from "./remove-correction-dialog.tsx";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";

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
    field: "hasCorrection",
    headerName: "Cor",
    description: "THe document has a correction uploaded",
    width: 100,
    valueGetter: (params: GridValueGetterParams) => {
      return params.value ? "Y" : "";
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

const initCorrectionDialogProps = {
  open: false,
  infoFile: null,
};
export default function UnprocessedFiles() {
  const accessToken = userStore.use.accessToken();
  const { searchParams } = useSearchParamState();
  const [error, setError] = useState<string[]>([]);
  const [hideNotices, setHideNotices] = useState(true);
  const [correctionDialogProps, setCorrectionDialogProps] = useState<
    Omit<UploadCorrectionDialogProps, "onClose" | "onComplete">
  >(initCorrectionDialogProps);
  const [removeCorrectionDialogProps, setRemoveCorrectionDialogProps] =
    useState<Omit<RemoveCorrectionDialogProps, "onClose" | "onComplete">>(
      initCorrectionDialogProps
    );

  const court = searchParams.get("court");
  const apiURL = court ? `api/info-files/for-court/${court}/` : null;

  const { data: rows, mutate } = useSWR<IInfoFile[]>(apiURL, fetcher, {
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

  const columns = useMemo<GridColDef<IInfoFile>[]>(
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
            onClick={() =>
              window.open(
                `/api/info-files/get-original-document/${params.row.id}?jwt=${accessToken}`,
                "_blank"
              )
            }
          />,
          <GridActionsCellItem
            key="2"
            icon={<AdbIcon />}
            label="Debug"
            onClick={() =>
              window.open(`/admin/causelist-debug/${params.row.id}`, "_blank")
            }
          />,
          <GridActionsCellItem
            showInMenu={true}
            key="3"
            icon={<EditNoteIcon />}
            label="Upload corrected version"
            onClick={() => {
              setCorrectionDialogProps({
                open: true,
                infoFile: params.row,
              });
            }}
          />,
          <GridActionsCellItem
            showInMenu={true}
            disabled={!params.row.hasCorrection}
            key="4"
            icon={<DeleteOutlineIcon />}
            label="Remove corrected version"
            onClick={() => {
              setRemoveCorrectionDialogProps({
                open: true,
                infoFile: params.row,
              });
            }}
          />,
          <GridActionsCellItem
            showInMenu={true}
            key="5"
            icon={<PermDeviceInformationIcon />}
            label="Set to be processed as NOTICE"
            onClick={() => {
              updateDocumentType(params.row.id, "NOTICE");
            }}
          />,
          <GridActionsCellItem
            showInMenu={true}
            key="6"
            icon={<HdrAutoIcon />}
            label="Set to be processed as AUTO"
            onClick={() => {
              updateDocumentType(params.row.id, "AUTO");
            }}
          />,
        ],
      },
    ],
    []
  );
  useEffect(() => {
    if (!correctionDialogProps.open) {
      mutate(undefined, { revalidate: true });
    }
  }, [correctionDialogProps, mutate]);

  const filterModel: GridFilterModel = hideNotices
    ? {
        items: [
          {
            id: 1,
            field: "overrideDocumentType",
            operator: "equals",
            value: "AUTO",
          },
        ],
      }
    : {
        items: [],
      };

  if (!rows) {
    return <h1>Invalid parameters</h1>;
  }
  return (
    <Stack height={"100%"}>
      <ErrorBox error={error} />
      <UploadCorrectionDialog
        {...correctionDialogProps}
        onClose={() => {
          setCorrectionDialogProps(initCorrectionDialogProps);
        }}
        onComplete={() => {
          setCorrectionDialogProps(initCorrectionDialogProps);
        }}
      />
      <RemoveCorrectionDialog
        {...removeCorrectionDialogProps}
        onClose={() => {
          setRemoveCorrectionDialogProps(initCorrectionDialogProps);
        }}
        onComplete={() => {
          setRemoveCorrectionDialogProps(initCorrectionDialogProps);
        }}
      />

      <Grid container>
        <Grid item xs={10}>
          <Alert severity="info">{court}</Alert>
        </Grid>
        <Grid item xs={2}>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={hideNotices}
                  onChange={(event) => setHideNotices(event.target.checked)}
                />
              }
              label="Hide Notices"
            />
          </FormGroup>
        </Grid>
      </Grid>
      <DataGrid rows={rows} columns={columns} filterModel={filterModel} />
    </Stack>
  );
}
