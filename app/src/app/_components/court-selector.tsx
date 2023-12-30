import * as React from "react";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Autocomplete from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog, { DialogProps } from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import ListSubheader from "@mui/material/ListSubheader";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import ClearIcon from "@mui/icons-material/Clear";
import BackspaceIcon from "@mui/icons-material/Backspace";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import useSWR from "swr";
import { causeListStore } from "../_store";
import { fetcher } from "./fetcher.ts";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import CourtTree from "./court-tree.tsx";
import IconButton from "@mui/material/IconButton";
import { ICourt } from "../../api/courts.ts";

export default function CourtSelector() {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
  const selectedCourt = causeListStore.use.selectedCourt();
  const [nameFilter, setNameFilter] = React.useState<string>("");
  const [open, setOpen] = React.useState(false);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const onSelected = (court: ICourt) => {
    causeListStore.set.changeCourt(court);
    setOpen(false);
  };

  const descriptionElementRef = React.useRef<HTMLElement>(null);
  React.useEffect(() => {
    if (open) {
      const { current: descriptionElement } = descriptionElementRef;
      if (descriptionElement !== null) {
        descriptionElement.focus();
      }
    }
  }, [open]);

  return (
    <>
      <Button onClick={handleOpen} variant="outlined">
        {" "}
        {selectedCourt ? selectedCourt.name : <i>Click to select a court</i>}
      </Button>
      <Dialog
        open={open}
        onClose={handleClose}
        scroll="paper"
        fullScreen={fullScreen}
        disableRestoreFocus={true}
      >
        <DialogTitle>Select Court</DialogTitle>
        <IconButton
          onClick={handleClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <ClearIcon />
        </IconButton>
        <DialogContent dividers={true} sx={{ minHeight: { md: "40em" } }}>
          <TextField
            label="Filter by Name"
            variant="standard"
            sx={{ width: "100%", paddingBottom: "1rem" }}
            onChange={(v) => setNameFilter(v.target.value)}
            value={nameFilter}
            autoFocus
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setNameFilter("")}
                    edge="end"
                    sx={{ color: (theme) => theme.palette.grey[500] }}
                  >
                    <BackspaceIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <React.Suspense fallback={<CircularProgress />}>
            <CourtTree filter={nameFilter} onChange={onSelected} />
          </React.Suspense>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
