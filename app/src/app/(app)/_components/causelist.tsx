"use client";
import { Fragment } from "react";
import { ListItem, Stack, Paper, Typography } from "@mui/material";
import MuiLink from "@mui/material/Link";
import { format, utcToZonedTime } from "date-fns-tz";
import { styled } from "@mui/material/styles";

import { CauseListDocumentParsed } from "@/api";
import { timeZone } from "./calendar.tsx";
import CaseListItem from "./causelist-item.tsx";
import CauseListItem from "./causelist-item.tsx";

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

export interface CauseListProps {
  data: CauseListDocumentParsed;
  highLight?: number[];
}

export default function CauseList({ data, highLight }: CauseListProps) {
  return (
    <Stack spacing={0} margin={"0 auto 1em"} width={"100%"}>
      <HeaderItem>
        {data.header.judge} {data.header.courtRoom}
      </HeaderItem>
      <Item>
        <Typography>
          {format(new Date(data.header.date), "PPPP", { timeZone })}
        </Typography>
      </Item>
      {data.header.phone && (
        <Item>
          <MuiLink
            target="_blank"
            rel="noopener"
            href={`tel:${data.header.phone}`}
          >
            {data.header.phone}
          </MuiLink>
        </Item>
      )}
      {data.header.email && (
        <Item>
          <MuiLink
            target="_blank"
            rel="noopener"
            href={`mail:${data.header.email}`}
          >
            {data.header.email}
          </MuiLink>
        </Item>
      )}
      {data.header.url && (
        <Item>
          <MuiLink target="_blank" rel="noopener" href={data.header.url}>
            {data.header.url}
          </MuiLink>
        </Item>
      )}
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
            {cls.cases.map((c, i) => {
              const highLightItem =
                idx === highLight?.[0] && i === highLight?.[1];
              return (
                <CauseListItem
                  key={`c-${idx}-${i}`}
                  data={c}
                  highLight={highLightItem}
                  autoFocus={highLightItem}
                />
              );
            })}
          </Fragment>
        ))}
      </Item>
    </Stack>
  );
}
