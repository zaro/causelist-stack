import * as React from "react";
import Chip from "@mui/material/Chip";
import Autocomplete from "@mui/material/Autocomplete";
import { causeListStore } from "../_store";
import useSWR from "swr";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import { fetcher } from "./fetcher.ts";
import { ICourt } from "@/api/courts";

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
  court: ICourt | null;
}

// fix from : https://stackoverflow.com/questions/75818761/material-ui-autocomplete-warning-a-props-object-containing-a-key-prop-is-be
export default function JudgeSelector({ court }: JudgeSelectorProps) {
  const [open, setOpen] = React.useState(false);

  const apiUrl = court ? `/api/courts/${court.path}/judges` : null;
  const { data, error, isLoading } = useSWR(apiUrl, fetcher);
  const selectedJudges = causeListStore.use.selectedJudges() ?? [];

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
      onChange={(e, v: string[]) => causeListStore.set.selectedJudges(v)}
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
      renderOption={(props, option) => {
        return (
          <li {...props} key={option}>
            {option}
          </li>
        );
      }}
      renderTags={(tagValue, getTagProps) => {
        return tagValue.map((option, index) => (
          <Chip {...getTagProps({ index })} key={option} label={option} />
        ));
      }}
    />
  );
}
