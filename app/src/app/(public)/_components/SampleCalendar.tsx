"use client";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { useState } from "react";
import { PickersDay, PickersDayProps } from "@mui/x-date-pickers/PickersDay";
import Badge from "@mui/material/Badge";
import CircleIcon from "@mui/icons-material/Circle";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import Typography from "@mui/material/Typography";

const minDate = new Date("2023-12-01");
const maxDate = new Date(`${new Date().getFullYear() + 1}-12-31`);
export const timeZone = "Africa/Nairobi";

function CauseListDay(
  props: PickersDayProps<Date> & {
    highlightedDays?: number[];
    daysWithPreview?: number[];
  }
) {
  const {
    highlightedDays = [],
    daysWithPreview = [],
    day,
    outsideCurrentMonth,
    ...other
  } = props;

  const isSelected =
    !props.outsideCurrentMonth &&
    highlightedDays.indexOf(props.day.getDate()) >= 0;

  const hasPreview =
    !props.outsideCurrentMonth &&
    daysWithPreview.indexOf(props.day.getDate()) >= 0;

  const color = hasPreview ? "primary" : "secondary";
  return (
    <Badge
      key={props.day.toString()}
      overlap="circular"
      badgeContent={
        isSelected || hasPreview ? (
          <CircleIcon color={color} sx={{ fontSize: "10px" }} />
        ) : undefined
      }
    >
      <PickersDay
        {...other}
        outsideCurrentMonth={outsideCurrentMonth}
        day={day}
      />
    </Badge>
  );
}

export interface SampleCalendarProps {
  day: string;
  days: string[];
  daysWithPreview: string[];
  onDaySelected: (day: Date | null) => void;
}

export default function SampleCalendar({
  day,
  days,
  daysWithPreview,
  onDaySelected,
}: SampleCalendarProps) {
  const refDate = new Date(day);

  const highlightedDays = days.map((d) => new Date(d).getDate());
  const daysWithPreviewAsDays = daysWithPreview.map((d) =>
    new Date(d).getDate()
  );
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <DateCalendar
        value={refDate}
        minDate={minDate}
        maxDate={maxDate}
        onChange={(v, state) => {
          if (onDaySelected) onDaySelected(v);
        }}
        slots={{
          day: CauseListDay,
        }}
        slotProps={{
          day: {
            highlightedDays,
            daysWithPreview: daysWithPreviewAsDays,
          } as any,
        }}
      />
    </LocalizationProvider>
  );
}
