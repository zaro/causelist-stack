import React from "react";
import Image from "next/image";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import bestTeams from "../_images/team-vector.png";
import classes from "./common.module.css";

export default function AboutUs() {
  return (
    <Box className={classes.aboutUsContainer}>
      <Grid container spacing={6} className={classes.gridContainer}>
        <Grid item xs={12} md={4}>
          <Image src={bestTeams} width={430} alt="My Team" objectFit="" />
        </Grid>

        <Grid item xs={12} md={8}>
          <Typography variant="h4" fontWeight={700} className={classes.title}>
            CODESMART TECHNOLOGIES
          </Typography>
          <Typography variant="h5" fontWeight={700} className={classes.title}>
            We build, We create
          </Typography>
          <Typography className={classes.title}>
            IT Systems / Mobile App & Software Development
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
}
