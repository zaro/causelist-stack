import React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import classes from "./common.module.css";
import SampleCalendar from "./SampleCalendar.tsx";
import SampleCauseLists from "./SampleCauselist.tsx";
import { Paper } from "@mui/material";
import { RandomCourtData } from "@/api/ssr.ts";

async function getData(): Promise<RandomCourtData> {
  const res = await fetch("http://api/courts/random");
  // The return value is *not* serialized
  // You can return Date, Map, Set, etc.

  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error(`Failed to fetch data: ${res.status}`);
  }

  return res.json();
}

export default async function Hero() {
  let data: RandomCourtData;
  try {
    data = await getData();
    console.log(data);
  } catch (e) {
    console.error(e);
    return <div>Server Error</div>;
  }
  const daysWithPreview = Object.keys(data.causelist);
  const day = daysWithPreview[0];

  // const onDaySelected = (day) => {
  //   console.log("selected", day);
  // };
  return (
    <Stack>
      <Typography variant="h3" fontWeight={700} className={classes.title}>
        Causelists made easy
      </Typography>

      <Box className={classes.heroBox}>
        <Paper elevation={3}>
          <Grid container spacing={6} className={classes.heroContainer}>
            <Grid item xs={12} md={5}>
              <Box display="flex" justifyContent="center">
                <Button variant="outlined">{data?.court.name}</Button>
              </Box>
              <SampleCalendar
                day={day}
                days={data.daysWithData}
                daysWithPreview={daysWithPreview}
              />
            </Grid>
            <Grid item xs={12} md={7} className={classes.sampleCauselist}>
              <SampleCauseLists data={data.causelist[day]} />
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Stack>
  );
}
