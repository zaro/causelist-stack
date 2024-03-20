"use client";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import CardActionArea from "@mui/material/CardActionArea";
import CalendarMonthTwoToneIcon from "@mui/icons-material/CalendarMonthTwoTone";
import SearchTwoToneIcon from "@mui/icons-material/SearchTwoTone";
import NextLink from "next/link";
import SubscriptionComing from "../../_components/subscirption-coming.tsx";

export default function Page() {
  return (
    <Stack spacing={"2em"} alignItems="center">
      <Typography component="h5" variant="h5" textAlign="center">
        What would you like to do?
      </Typography>

      <Card sx={{ width: { xs: "80%", md: "50%", lg: "30%" } }}>
        <CardActionArea href="/search" LinkComponent={NextLink}>
          <CardMedia sx={{ marginTop: "1em" }}>
            <SearchTwoToneIcon
              fontSize="large"
              sx={{ display: "block", margin: "auto" }}
            />
          </CardMedia>
          <CardContent>
            <Typography gutterBottom variant="h5" component="div">
              Search
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Search cases by party or case number
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>

      <Card sx={{ width: { xs: "80%", md: "50%", lg: "30%" } }}>
        <CardActionArea href="/calendar" LinkComponent={NextLink}>
          <CardMedia sx={{ marginTop: "1em" }}>
            <CalendarMonthTwoToneIcon
              fontSize="large"
              sx={{ display: "block", margin: "auto" }}
            />
          </CardMedia>
          <CardContent>
            <Typography gutterBottom variant="h5" component="div">
              Check Calendar
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Browse courts causelist by court and date
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>

      <SubscriptionComing />
    </Stack>
  );
}
