"use client";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Centered from "../../../_components/centered.tsx";
import Typography from "@mui/material/Typography";

export default function Page() {
  return (
    <Stack height={"100%"} alignContent="center">
      <Box sx={{ marginBottom: "10em" }}>
        <Typography textAlign="center" variant="h5">
          Advertise
        </Typography>
      </Box>
      <Box>
        <Typography textAlign="center">
          Write to{" "}
          <a href="mailto:info@causelist.co.ke" target="_blank">
            info@causelist.co.ke
          </a>
        </Typography>
      </Box>
      <Box>
        <Typography textAlign="center">
          Or call{" "}
          <a href="tel:+254799880299" target="_blank">
            +254799880299
          </a>
        </Typography>
      </Box>
    </Stack>
  );
}
