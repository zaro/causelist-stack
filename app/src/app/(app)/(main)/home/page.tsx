"use client";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import CardActionArea from "@mui/material/CardActionArea";
import CalendarMonthTwoToneIcon from "@mui/icons-material/CalendarMonthTwoTone";
import PlagiarismIcon from "@mui/icons-material/Plagiarism";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import QueuePlayNextIcon from "@mui/icons-material/QueuePlayNext";
import NextLink from "next/link";
import InAppNotice from "../../_components/in-app-notice.tsx";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { appStore } from "../../_store/index.ts";
import ManageSearch from "@mui/icons-material/ManageSearch";
import { AdCarousel } from "../../_components/ad-carousell.tsx";

export default function Page() {
  const searchParams = useSearchParams();
  useEffect(() => {
    appStore.set.isPwa(searchParams.get("pwa") == "1");
  }, [searchParams]);

  return (
    <Stack spacing={"2em"} alignItems="center">
      <Typography component="h5" variant="h5" textAlign="center">
        What would you like to do?
      </Typography>

      <Card sx={{ width: { xs: "80%", md: "50%", lg: "30%" } }}>
        <CardActionArea href="/case-search" LinkComponent={NextLink}>
          <CardMedia sx={{ marginTop: "1em" }}>
            <PlagiarismIcon
              fontSize="large"
              sx={{ display: "block", margin: "auto" }}
            />
          </CardMedia>
          <CardContent>
            <Typography gutterBottom variant="h5" component="div">
              Law Reports and Case Law
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Search Cases, Authorities and Precedents by subject matter or
              Party name(s)
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

      <Card sx={{ width: { xs: "80%", md: "50%", lg: "30%" } }}>
        <CardActionArea href="/search" LinkComponent={NextLink}>
          <CardMedia sx={{ marginTop: "1em" }}>
            <ManageSearchIcon
              fontSize="large"
              sx={{ display: "block", margin: "auto" }}
            />
          </CardMedia>
          <CardContent>
            <Typography gutterBottom variant="h5" component="div">
              Causelist Search
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Search causelist by party or case number
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>

      <Card sx={{ width: { xs: "80%", md: "50%", lg: "30%" } }}>
        <CardActionArea href="/forms/advertise" LinkComponent={NextLink}>
          <CardMedia sx={{ marginTop: "1em" }}>
            <QueuePlayNextIcon
              fontSize="large"
              sx={{ display: "block", margin: "auto" }}
            />
          </CardMedia>
          <CardContent>
            <Typography gutterBottom variant="h5" component="div">
              Advertise
            </Typography>
            <Typography variant="body2" color="text.secondary">
              I want to advertise my professional practice on this platform
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>

      <Card sx={{ width: { xs: "80%", md: "50%", lg: "30%" } }}>
        <CardActionArea href="/forms/get-listed" LinkComponent={NextLink}>
          <CardMedia sx={{ marginTop: "1em" }}>
            <PlaylistAddIcon
              fontSize="large"
              sx={{ display: "block", margin: "auto" }}
            />
          </CardMedia>
          <CardContent>
            <Typography gutterBottom variant="h5" component="div">
              Get Listed on the Directory
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Get listed so that you/your law firm is recommended to the members
              of public who are using this platform
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>

      <InAppNotice />
      <AdCarousel />
    </Stack>
  );
}
