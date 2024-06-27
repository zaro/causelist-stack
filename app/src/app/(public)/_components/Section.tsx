import React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import PolicyIcon from "@mui/icons-material/Policy";
import FindInPageIcon from "@mui/icons-material/FindInPage";
import MobileFriendlyIcon from "@mui/icons-material/MobileFriendly";
import DownloadIcon from "@mui/icons-material/Download";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import classes from "./common.module.css";

const Section = () => {
  const sectionItems = [
    {
      id: 1,
      icon: <ManageSearchIcon sx={{ fontSize: 100 }} color="primary" />,
      sentence:
        "Instantly search for parties, terms, and anything else in the court case documents",
    },
    {
      id: 2,
      icon: <AutoStoriesIcon sx={{ fontSize: 100 }} color="primary" />,
      sentence: "Read the case file right in your browser",
    },
    {
      id: 3,
      icon: <DownloadIcon sx={{ fontSize: 100 }} color="primary" />,
      sentence: "Download the PDF file of any case",
    },
    {
      id: 11,
      icon: <PolicyIcon sx={{ fontSize: 100 }} color="primary" />,
      sentence: "The court causelist at your fingertips",
    },
    {
      id: 12,
      icon: <FindInPageIcon sx={{ fontSize: 100 }} color="primary" />,
      sentence: "Search for cases, parties",
    },
    {
      id: 13,
      icon: <MobileFriendlyIcon sx={{ fontSize: 100 }} color="primary" />,
      sentence: "Anywhere, anytime from your phone",
    },
  ];
  return (
    <Box sx={{ flexGrow: 1, minHeight: "400px", marginTop: "3em" }}>
      <Grid container className={classes.sectionGridContainer}>
        {sectionItems.map((item) => (
          <Grid
            item
            xs={12}
            md={3.5}
            minHeight={300}
            key={item.id}
            className={classes.sectionGridItem}
          >
            {item.icon}
            <Typography sx={{ mt: "1em" }}>{item.sentence}</Typography>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Section;
