import React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Avatar from "@mui/material/Avatar";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";

import classes from "./common.module.css";

export default function Testimonial() {
  const reviews = [
    {
      id: 1,
      name: "Karl Brighton",
      statement:
        "The team perfectly fit the specialized skill set required. They focused on the most essential features helping us launch the platform eight months faster than planned.",
      image_url:
        "https://sweta-myteam-website-fm.netlify.app/static/media/avatar-kady.78fc482c.jpg",
      position: "Software Engineer at Kadex",
    },
    {
      id: 2,
      name: "Krishna Bells",
      statement:
        "We needed to automate our entire onboarding process. The team came in and built out the whole journey. Since going live, user retention has gone through the roof!",
      image_url:
        "https://sweta-myteam-website-fm.netlify.app/static/media/avatar-aiysha.e119a0c1.jpg",
      position: "Product Manager at Google",
    },
    {
      id: 3,
      name: "Ben Spiff",
      statement:
        "Amazing. Our team helped us build an app that delivered a new experience for hiring a physio. The launch was an instant success with 100k downloads in the first month.",
      image_url:
        "https://sweta-myteam-website-fm.netlify.app/static/media/avatar-arthur.098c2e26.jpg",
      position: "Founder of Crypto",
    },
  ];
  return (
    <Box
      sx={{
        flexGrow: 1,
        padding: "20px",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "300px",
      }}
    >
      <Grid container spacing={2}>
        {reviews.map((review) => (
          <Grid item sm={12} md={4} key={review.id}>
            <Card className={classes.testimonialCard}>
              <CardContent>
                <Typography className={classes.testimonialStatement}>
                  &quot;{review.statement}&quot;
                </Typography>
                <Box sx={{ display: "flex" }}>
                  {/* <Avatar
                    src={review.image_url}
                    size="large"
                    className={classes.avatar}
                  /> */}
                  <Box>
                    <Typography>{review.name}</Typography>
                    <Typography className={classes.testimonialPosition}>
                      {review.position}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
