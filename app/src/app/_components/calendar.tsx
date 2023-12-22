"use client";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { causeListStore } from "../_store";
import { useEffect, useState } from "react";
import { PickersDay, PickersDayProps } from "@mui/x-date-pickers/PickersDay";
import Badge from "@mui/material/Badge";
import useSWR from "swr";
import { fetcher } from "./fetcher.ts";
import utcToZonedTime from "date-fns-tz/utcToZonedTime";
import { zonedTimeToUtc } from "date-fns-tz";

const minDate = new Date("2023-01-01");
const maxDate = new Date(`${new Date().getFullYear() + 1}-12-31`);
export const timeZone = "Africa/Nairobi";

function CauseListDay(
  props: PickersDayProps<Date> & { highlightedDays?: number[] }
) {
  const { highlightedDays = [], day, outsideCurrentMonth, ...other } = props;

  const isSelected =
    !props.outsideCurrentMonth &&
    highlightedDays.indexOf(props.day.getDate()) >= 0;

  return (
    <Badge
      key={props.day.toString()}
      overlap="circular"
      badgeContent={isSelected ? "🔵" : undefined}
    >
      <PickersDay
        {...other}
        outsideCurrentMonth={outsideCurrentMonth}
        day={day}
      />
    </Badge>
  );
}

export default function Calendar() {
  const selectedCourt = causeListStore.use.selectedCourt();
  const refDate = new Date();
  const [month, setMonth] = useState<Date>(refDate);
  const [year, setYear] = useState<Date>(refDate);

  const apiURL =
    month && year && selectedCourt
      ? `/api/courts/${year.getFullYear()}/${
          month.getMonth() + 1
        }/${selectedCourt}/days`
      : null;

  const {
    data: daysWithCauseList,
    isLoading,
    error,
  } = useSWR<string[]>(apiURL, fetcher);
  if (error) {
    console.error(error);
    return <div>failed</div>;
  }
  const highlightedDays = daysWithCauseList?.map((d) => new Date(d).getDate());
  return (
    <DateCalendar
      disabled={!selectedCourt}
      loading={isLoading}
      minDate={minDate}
      maxDate={maxDate}
      onChange={(v, state) => {
        causeListStore.set.selectedDate(v);
      }}
      onMonthChange={(v) => setMonth(v)}
      onYearChange={(v) => setYear(v)}
      slots={{
        day: CauseListDay,
      }}
      slotProps={{
        day: {
          highlightedDays,
        } as any,
      }}
    />
  );
}
