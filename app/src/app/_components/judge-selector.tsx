import * as React from "react";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import ListItemText from "@mui/material/ListItemText";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import Autocomplete from "@mui/material/Autocomplete";
import { causeListStore } from "../_store";
import useSWR from "swr";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import { fetcher } from "./fetcher.ts";

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

export interface JudgeSelectorProps {
  court: string | null;
}

export default function JudgeSelector({ court }: JudgeSelectorProps) {
  const [open, setOpen] = React.useState(false);

  const apiUrl = court ? `/api/courts/${court}/judges` : null;
  const { data, error, isLoading } = useSWR(apiUrl, fetcher);
  const selectedJudges = causeListStore.use.judgesForCurrentCourt() ?? [];

  return (
    <Autocomplete
      multiple
      sx={{ width: 300, margin: ".5em auto" }}
      open={open}
      onOpen={() => {
        setOpen(true);
      }}
      onClose={() => {
        setOpen(false);
      }}
      onChange={(e, v: string[]) =>
        causeListStore.set.setJudgesForCurrentCourt(v)
      }
      options={data ?? []}
      value={selectedJudges}
      loading={isLoading}
      renderInput={(params) => (
        <TextField
          {...params}
          label={`Select Judge`}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <React.Fragment>
                {isLoading ? (
                  <CircularProgress color="inherit" size={20} />
                ) : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
        />
      )}
    />
  );
}
