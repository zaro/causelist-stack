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
  // backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: "center",
  color: theme.palette.text.secondary,
  marginBottom: "0.5em",
  flexShrink: 0,
  width: "100%",
}));

const HeaderItem = styled(Item)(({ theme }) => ({
  backgroundColor: theme.palette.grey.A200,
  fontSize: "1.3em",
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

const CaseListItem = styled(ListItem)(({ theme }) => ({
  borderWidth: "1px",
  borderColor: theme.palette.grey.A400,
  borderStyle: "solid",
  borderRadius: "0.5em",
  marginBottom: "1em",
}));

export interface CauseListProps {
  data: CauseListDocumentParsed;
}

export default function CauseList({ data }: CauseListProps) {
  return (
    <Stack spacing={0} margin={"0 auto 1em"} width={"100%"}>
      <HeaderItem>{data.header.judge}</HeaderItem>
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
                      {c.partyA} <i>VS</i> {c.partyB}
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
