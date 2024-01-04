import * as React from "react";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog, { DialogProps } from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import ListSubheader from "@mui/material/ListSubheader";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Button from "@mui/material/Button";
import type { ICourt } from "@/api/courts";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import useSWR from "swr";
import { causeListStore } from "../_store/index.ts";
import { fetcher } from "./fetcher.ts";
import Fuse, { IFuseOptions } from "fuse.js";
import { styled, useTheme } from "@mui/material/styles";

import type { SxProps, Theme } from "@mui/material";

export interface CourtTreeProps {
  filter: string;
  sx?: SxProps<Theme>;
  onChange?: (court: ICourt) => void;
}

const searchOptions: IFuseOptions<ICourt> = {
  includeScore: false,
  ignoreLocation: false,
  threshold: 0.2,
  // Search in `author` and in `tags` array
  keys: ["name", "type"],
};

export default function CourtTree({ filter, sx, onChange }: CourtTreeProps) {
  const theme = useTheme();

  const [openCourt, setOpenCourt] = React.useState<{ [k: string]: boolean }>(
    {}
  );

  const toggleCourt = (court: string) => {
    setOpenCourt({ ...openCourt, [court]: !openCourt[court] });
  };

  const selectCourt = (court: ICourt) => {
    if (onChange) {
      onChange(court);
    }
  };

  const { data, error, isLoading } = useSWR<ICourt[]>(
    "/api/courts/all",
    fetcher,
    {
      suspense: true,
    }
  );

  const filteredData = React.useMemo(() => {
    let l: ICourt[];
    if (!filter || !data) {
      l = data ?? [];
    } else {
      const fuse = new Fuse<ICourt>(data ?? [], searchOptions);
      l = fuse.search(filter).map((e) => e.item);
    }
    const structured = l.reduce(
      (r, c) => ({
        ...r,
        [c.type]: r[c.type] ? [...r[c.type], c] : [c],
      }),
      {} as { [k: string]: ICourt[] }
    );
    return {
      flat: l,
      tree: structured,
    };
  }, [data, filter]);
  const allOpen = filteredData.flat.length < 50;

  if (error) {
    console.error(error);
    return <div>failed</div>;
  }

  return (
    <List
      sx={{ width: "100%", bgcolor: "background.paper", ...sx }}
      component="nav"
    >
      {Object.entries(filteredData.tree).map(([type, courtList]) => {
        return (
          <>
            <ListItemButton key={`b-${type}`} onClick={() => toggleCourt(type)}>
              <ListItemText
                primary={type}
                primaryTypographyProps={{
                  fontWeight: "bold",
                  color: theme.palette.text.secondary,
                }}
                sx={{
                  paddingRight: "2em",
                }}
              />
              {allOpen || openCourt[type] ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse
              key={type}
              in={allOpen || openCourt[type]}
              timeout="auto"
              unmountOnExit
            >
              <List component="div" disablePadding>
                {courtList.map((c, idx) => (
                  <ListItem
                    key={idx}
                    secondaryAction={
                      <IconButton onClick={() => selectCourt(c)}>
                        {c.hasData ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <HourglassBottomIcon color="warning" />
                        )}
                      </IconButton>
                    }
                  >
                    <ListItemButton
                      sx={{ pl: 4 }}
                      onClick={() => selectCourt(c)}
                    >
                      <ListItemText primary={c.name} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </>
        );
      })}
    </List>
  );
}
