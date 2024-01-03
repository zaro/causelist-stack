import Typography from "@mui/material/Typography";
import ListItemButton, {
  ListItemButtonProps,
} from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { styled, useTheme } from "@mui/material/styles";
import { CauselistLineParsed } from "../../../api/index.ts";
import React, { ReactNode } from "react";

const CaseListItem = styled(ListItemButton)(({ theme }) => ({
  borderWidth: "1px",
  borderColor: theme.palette.grey.A400,
  borderStyle: "solid",
  borderRadius: "0.5em",
  marginBottom: "1em",
}));

export interface CauseListProps {
  data: CauselistLineParsed;
  highLight?: boolean;
}

export default function CauseListItem(
  props: CauseListProps & ListItemButtonProps
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
        {data.additionalNumber}
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
