"use client";
import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Backdrop from "@mui/material/Backdrop";
import Modal from "@mui/material/Modal";
import Fade from "@mui/material/Fade";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import Typography from "@mui/material/Typography";
import ClearIcon from "@mui/icons-material/Clear";
import CheckIcon from "@mui/icons-material/Check";
import IconButton from "@mui/material/IconButton";

import classes from "./common.module.css";
import SampleCalendar from "./SampleCalendar.tsx";
import SampleCauseLists from "./SampleCauselist.tsx";
import { Paper } from "@mui/material";
import { RandomCourtData } from "@/api/ssr.ts";
import useSWR from "swr";
import { APP_PREVIEW_PATH, getAppPreviewData } from "./app-preview-data.ts";
import { AppButtonLink } from "../../(app)/_components/app-link.tsx";

function getDefaultDay(data: undefined | RandomCourtData) {
  if (!data?.causelist) {
    return undefined;
  }
  const keys = Object.keys(data.causelist);
  if (keys.length) {
    keys.sort();
    return keys[keys.length - 1];
  }
}

const style = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  // border: "2px solid #000",
  boxShadow: 24,
  p: 4,
  width: {
    xs: "100%",
    sm: "80%",
    md: "50%",
    lg: "30%",
  },
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
          <Grid container spacing={6}>
            <Grid item xs={12} md={5}>
              <Box
                display="flex"
                justifyContent="center"
                sx={{ paddingX: "0.2em" }}
              >
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
            <Typography variant="h4" component="h4">
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
            <List sx={{ marginY: "1em" }}>
              <ListItem>
                <ListItemIcon>
                  <CheckIcon color="success" />
                </ListItemIcon>
                <ListItemText primary="Browse caueslists by court and date" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckIcon color="success" />
                </ListItemIcon>
                <ListItemText primary="Search parties and case numbers" />
              </ListItem>
            </List>
            <Typography textAlign="center">
              <AppButtonLink size="large" variant="contained" href="/sign-up">
                Sign up
              </AppButtonLink>
            </Typography>
          </Box>
        </Fade>
      </Modal>
    </>
  );
}
