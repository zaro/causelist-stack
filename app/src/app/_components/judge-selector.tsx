import * as React from "react";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import ListItemText from "@mui/material/ListItemText";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import Checkbox from "@mui/material/Checkbox";
import { Box } from "@mui/material";
import { causeListStore } from "../_store";

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
  judges: string[];
}

export default function JudgeSelector({ judges }: JudgeSelectorProps) {
  const selectedJudges = causeListStore.use.judgesForCurrentCourt() ?? [];

  const handleChange = (event: SelectChangeEvent<typeof selectedJudges>) => {
    let {
      target: { value },
    } = event;
    if (!value) {
      value = "";
    }
    causeListStore.set.setJudgesForCurrentCourt(
      typeof value === "string" ? value.split(",") : value
    );
  };

  return (
    <Box margin={"0 auto"}>
      <FormControl sx={{ m: 1, width: 300 }}>
        <InputLabel id="judge-multiple-checkbox-label">Judge</InputLabel>
        <Select
          labelId="judge-multiple-checkbox-label"
          id="judge-multiple-checkbox"
          multiple
          value={selectedJudges}
          onChange={handleChange}
          input={<OutlinedInput label="Judge" />}
          renderValue={(selected) => selected.join(", ")}
          MenuProps={MenuProps}
        >
          {judges.map((name) => (
            <MenuItem key={name} value={name}>
              <Checkbox checked={selectedJudges.indexOf(name) > -1} />
              <ListItemText primary={name} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
