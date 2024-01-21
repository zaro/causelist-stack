import Typography from "@mui/material/Typography";
import ListItemButton, {
  ListItemButtonProps,
} from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { styled, useTheme } from "@mui/material/styles";
import {
  CauselistLineParsed,
  UnassignedMattersLineParsed,
} from "../../../api/index.ts";
import React, { ReactNode } from "react";
import { CaseListItem } from "./causelist-item.tsx";

export interface UnassignedMattersProps {
  data: UnassignedMattersLineParsed;
  highLight?: boolean;
}

export default function UnassignedMattersItem(
  props: UnassignedMattersProps & ListItemButtonProps
) {
  const { data, highLight, ...rest } = props;
  const theme = useTheme();
  const sx = highLight
    ? {
        background: theme.palette.secondary.light,
      }
    : {};
  return (
    <CaseListItem alignItems="flex-start" sx={sx} {...rest}>
      <ListItemText>
        <i>{data.num ? data.num + "." : null}</i> {data.caseNumber}{" "}
        <b>{data.typeOfCause}</b>
        {data.partyA ? (
          <Typography>
            {data.partyA} <i>VS</i> {data.partyB}
          </Typography>
        ) : (
          <Typography> {data.description}</Typography>
        )}
      </ListItemText>
    </CaseListItem>
  );
}
