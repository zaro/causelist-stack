import React from "react";
import Image from "next/image";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import bestTeams from "../_images/team-vector.png";
import classes from "./common.module.css";
import { AppLink } from "../../(app)/_components/app-link.tsx";

export default function AboutUs() {
  return (
    <Box className={classes.aboutUsContainer}>
      <Grid container spacing={6} className={classes.gridContainer}>
        <Grid item xs={12} md={3}>
          <Image
            src={bestTeams}
            sizes="(max-width: 900px) 215px, (max-width: 1200px) 430px, 860px"
            alt="Team"
            width={215}
          />
        </Grid>

        <Grid item xs={12} md={9}>
          <Typography variant="h4" fontWeight={700} className={classes.title}>
            <AppLink
              target="_blank"
              href="https://codesmart.space/"
              sx={{ textDecoration: "none" }}
            >
              CODESMART TECHNOLOGIES
            </AppLink>
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
