"use client";
import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Backdrop from "@mui/material/Backdrop";
import Modal from "@mui/material/Modal";
import Fade from "@mui/material/Fade";
import Typography from "@mui/material/Typography";
import ClearIcon from "@mui/icons-material/Clear";
import IconButton from "@mui/material/IconButton";

import classes from "./common.module.css";
import SampleCalendar from "./SampleCalendar.tsx";
import SampleCauseLists from "./SampleCauselist.tsx";
import { Paper } from "@mui/material";
import { RandomCourtData } from "@/api/ssr.ts";
import useSWR from "swr";
import { APP_PREVIEW_PATH, getAppPreviewData } from "./app-preview-data.ts";
import { AppLink } from "../../(app)/_components/app-link.tsx";

function getDefaultDay(data: undefined | RandomCourtData) {
  if (!data?.causelist) {
    return undefined;
  }
  const keys = Object.keys(data.causelist);
  if (keys.length) {
    keys.sort();
    return keys[0];
  }
}

const style = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  // border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

export default function AppPreview() {
  const { data, isLoading, error } = useSWR<RandomCourtData>(
    APP_PREVIEW_PATH,
    getAppPreviewData,
    { suspense: true }
  );
  const [day, setDay] = useState<string | undefined>(getDefaultDay(data));
  const [open, setOpen] = useState(false);

  if (!data) {
    return <div>Server Error</div>;
  }
  if (!day) {
    return <div>Loading data</div>;
  }
  const daysWithPreview = Object.keys(data.causelist);

  const onDaySelected = (day: Date | null) => {
    if (!day) {
      return;
    }
    const dayStr = day.toISOString().split("T")[0];
    if (daysWithPreview.includes(dayStr)) {
      setDay(dayStr);
    } else {
      handleOpen();
    }
  };
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  return (
    <>
      <Box className={classes.heroBox}>
        <Paper elevation={3}>
          <Grid container spacing={6} className={classes.heroContainer}>
            <Grid item xs={12} md={5}>
              <Box display="flex" justifyContent="center">
                <Button variant="outlined" onClick={handleOpen}>
                  {data?.court.name}
                </Button>
              </Box>
              <SampleCalendar
                day={day}
                days={data.daysWithData}
                daysWithPreview={daysWithPreview}
                onDaySelected={onDaySelected}
              />
            </Grid>
            <Grid item xs={12} md={7} className={classes.sampleCauselist}>
              <SampleCauseLists data={data.causelist[day]} />
            </Grid>
          </Grid>
        </Paper>
      </Box>
      <Modal
        open={open}
        onClose={handleClose}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
          },
        }}
      >
        <Fade in={open}>
          <Box sx={style}>
            <Typography variant="h3" component="h3">
              Sign up now
              <IconButton
                onClick={handleClose}
                sx={{
                  position: "absolute",
                  right: 8,
                  top: 8,
                  color: (theme) => theme.palette.grey[500],
                }}
              >
                <ClearIcon />
              </IconButton>
            </Typography>
            <Typography id="transition-modal-description" sx={{ mt: 2 }}>
              <ul>
                <li>Browse caueslists by court and date</li>
                <li>Search parties and case numbers</li>
              </ul>
            </Typography>
            <AppLink href="/sign-up">Sign up</AppLink>
          </Box>
        </Fade>
      </Modal>
    </>
  );
}
