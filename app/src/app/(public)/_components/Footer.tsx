import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";

import classes from "./common.module.css";

const Footer = () => {
  const date = new Date().getFullYear();

  return (
    <Box sx={{ flexGrow: 1 }} className={classes.footerContainer}>
      <Typography className={classes.footerText}>
        Created by CodeSmart Technologies
      </Typography>
      <Typography className={classes.footerDate}>
        Open-Source Sample - Buit with MUI
      </Typography>
    </Box>
  );
};

export default Footer;
