import React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";

import classes from "./common.module.css";
import { AppLink } from "../../(app)/_components/app-link.tsx";

const Footer = () => {
  const date = new Date().getFullYear();

  return (
    <Box sx={{ flexGrow: 1 }} className={classes.footerContainer}>
      <Grid container className={classes.footerLinks}>
        <Grid item xs={12} md={6} paddingBottom="1em">
          <Typography fontWeight="bold" textAlign="center">
            Links
          </Typography>
          <Stack alignItems="center">
            <AppLink href="/terms-and-conditions">Terms And Conditions</AppLink>
            <AppLink href="/faq">Frequently Asked Questions</AppLink>
          </Stack>
        </Grid>

        <Grid item xs={12} md={6} paddingBottom="1em">
          <Typography fontWeight="bold" textAlign="center">
            Application
          </Typography>
          <Stack alignItems="center">
            <AppLink href="/sign-up">Sign up</AppLink>
            <AppLink href="/sign-in">Sign in</AppLink>
          </Stack>
        </Grid>
      </Grid>
      <Typography className={classes.footerText}>
        Created by CodeSmart Technologies
      </Typography>
      <Typography className={classes.footerDate}>
        © Copyright {date}. All rights reserved.
      </Typography>
    </Box>
  );
};

export default Footer;
