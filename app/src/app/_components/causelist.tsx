"use client";
import { Fragment } from "react";
import {
  ListItem,
  ListItemText,
  Stack,
  Paper,
  Typography,
} from "@mui/material";
import { format, utcToZonedTime } from "date-fns-tz";
import { styled } from "@mui/material/styles";

import { CauseListDocumentParsed } from "@/api";
import { timeZone } from "./calendar.tsx";

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: "center",
  color: theme.palette.text.secondary,
  marginBottom: "0.5em",
}));

const TimeListItem = styled(ListItem)(() => ({
  marginBottom: "1em",
  fontWeight: "bold",
  justifyContent: "center",
}));

const TypeOfCauseListItem = styled(ListItem)(() => ({
  marginBottom: "1em",
  fontWeight: "bold",
}));

const CaseListItem = styled(ListItem)(() => ({
  border: "1px solid grey",
  borderRadius: "0.5em",
  marginBottom: "1em",
}));

export interface CauseListProps {
  data: CauseListDocumentParsed;
}

export default function CauseList({ data }: CauseListProps) {
  return (
    <Stack spacing={0} margin={"0 auto 1em"} maxWidth={"xl"}>
      <Item>
        <Typography>{data.header.judge}</Typography>
      </Item>
      <Item>
        <Typography>
          {format(new Date(data.header.date), "PPPP", { timeZone })}
        </Typography>
      </Item>
      <Item>
        {data.causeLists.map((cls, idx) => (
          <Fragment key={idx}>
            {cls.dateTime && (
              <TimeListItem key={`tm-${idx}`}>
                {format(utcToZonedTime(cls.dateTime, timeZone), "p", {
                  timeZone,
                })}
              </TimeListItem>
            )}
            <TypeOfCauseListItem key={`toc-${idx}`}>
              {cls.typeOfCause}
            </TypeOfCauseListItem>
            {cls.cases.map((c, i) => (
              <CaseListItem key={`c-${idx}-${i}`} alignItems="flex-start">
                <ListItemText>
                  <i>{c.num ? c.num + "." : null}</i> {c.caseNumber}
                  {c.description ? (
                    <Typography> {c.description}</Typography>
                  ) : (
                    <Typography>
                      {c.partyA} VS {c.partyB}
                    </Typography>
                  )}
                </ListItemText>
              </CaseListItem>
            ))}
          </Fragment>
        ))}
      </Item>
    </Stack>
  );
}
