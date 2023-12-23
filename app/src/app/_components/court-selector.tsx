import * as React from "react";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import useSWR from "swr";
import { causeListStore } from "../_store";
import { fetcher } from "./fetcher.ts";

export default function CourtSelector() {
  const [open, setOpen] = React.useState(false);
  const { data, error, isLoading } = useSWR("/api/courts/all", fetcher);

  if (error) {
    console.error(error);
    return <div>failed</div>;
  }

  return (
    <Autocomplete
      sx={{ width: 300, margin: ".5em auto" }}
      open={open}
      onOpen={() => {
        setOpen(true);
      }}
      onClose={() => {
        setOpen(false);
      }}
      onChange={(e, v: string | null) => causeListStore.set.selectedCourt(v)}
      // isOptionEqualToValue={(option, value) => option.title === value.title}
      // getOptionLabel={(option) => option.title}
      options={data ?? []}
      loading={isLoading}
      renderInput={(params) => (
        <TextField
          {...params}
          label={`Select Court`}
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
