"use client";
import { ListItem, Stack, Paper, Typography } from "@mui/material";
import { format } from "date-fns-tz";
import { styled } from "@mui/material/styles";

import { UnassignedMattersParsed } from "@/api";
import { timeZone } from "./calendar.tsx";
import UnassignedMattersItem from "./unassigned-matters-item.tsx";
import { HeaderItem } from "./causelist.tsx";

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

export interface UnassignedMattersProps {
  data: UnassignedMattersParsed;
  highLight?: number[];
}

export default function UnassignedMatters({
  data,
  highLight,
}: UnassignedMattersProps) {
  return (
    <Stack spacing={0} margin={"0 auto 1em"} width={"100%"}>
      <HeaderItem>Unassigned Matters</HeaderItem>
      <Item>
        <Typography>
          {format(new Date(data.header.date), "PPPP", { timeZone })}
        </Typography>
      </Item>
      <Item>
        {data.cases.map((cls, idx) => (
          <UnassignedMattersItem
            key={`c-${idx}`}
            data={cls}
            highLight={idx === highLight?.[0]}
            autoFocus={idx === highLight?.[0]}
          />
        ))}
      </Item>
    </Stack>
  );
}
