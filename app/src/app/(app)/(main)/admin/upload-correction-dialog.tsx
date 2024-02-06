import * as React from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog, { DialogProps } from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Box from "@mui/material/Box";
import { styled } from "@mui/material/styles";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import LinearProgress from "@mui/material/LinearProgress";

import useMediaQuery from "@mui/material/useMediaQuery";
import useTheme from "@mui/material/styles/useTheme";
import { IInfoFile } from "../../../../api/info-file.ts";
import { addAuthHeader } from "../../_components/fetcher.ts";
import ErrorBox from "../../_components/error-box.tsx";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

export interface UploadCorrectionDialogProps {
  open: boolean;
  infoFile: IInfoFile | null;
  onClose: () => void;
  onComplete: () => void;
}

export default function UploadCorrectionDialog({
  open,
  infoFile,
  onClose,
  onComplete,
}: UploadCorrectionDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
  const [working, setWorking] = React.useState(false);
  const [file, setFile] = React.useState("");
  const [error, setError] = React.useState<string[] | string>();

  React.useEffect(() => {
    setFile("");
    setError(undefined);
  }, [open, infoFile]);

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const filePath = event.target.value;
    setFile(filePath.split(/(\\|\/)/g).pop() as string);
  };
  const onSubmit: React.FocusEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    const form = event.target;

    setWorking(true);
    setError(undefined);
    // Post data using the Fetch API
    fetch(
      form.action,
      addAuthHeader({
        method: form.method,
        body: new FormData(form),
      })
    ).then(async (r) => {
      try {
        const body = await r.json();
        if (r.ok && body === true) {
          onComplete();
          setFile("");
        }
      } catch {
        setError(["Failed to parse response", `${r.status} ${r.statusText}`]);
      }
      setWorking(false);
    });
  };
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      disableEscapeKeyDown={true}
      maxWidth="lg"
    >
      <DialogTitle>Upload Correction For</DialogTitle>
      <form
        method="POST"
        action={`/api/info-files/upload-correction/${infoFile?.id}`}
        onSubmit={onSubmit}
      >
        <DialogContent>
          <DialogContentText variant="body1">
            {infoFile?.fileName}
          </DialogContentText>
          <Box textAlign="center" justifyContent="center" padding="1em">
            <TextField
              value={file}
              size="small"
              disabled={true}
              sx={{ marginRight: "0.5em" }}
            />
            <Button
              component="label"
              variant="contained"
              startIcon={<CloudUploadIcon />}
            >
              Select file
              <VisuallyHiddenInput
                type="file"
                name="corrected"
                onChange={onFileChange}
              />
            </Button>
          </Box>
          {working && <LinearProgress />}
          <ErrorBox error={error} />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={working}>
            Cancel
          </Button>
          <Button type="submit" disabled={working}>
            Upload
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
