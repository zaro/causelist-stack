"use client";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import MuiAppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import StoreIcon from "@mui/icons-material/Store";
import AppFooter from "../_components/app-footer.tsx";

const Main = styled("main")(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
}));

export default function PaymentMain({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <MuiAppBar position="fixed">
        <Toolbar>
          <StoreIcon />

          <Typography variant="h6" noWrap component="div">
            Payment Status
          </Typography>
        </Toolbar>
      </MuiAppBar>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Main>{children}</Main>
        <AppFooter
          sx={{ marginTop: "3em", bottom: 0, position: "fixed", width: "100%" }}
        />
      </Box>
    </Box>
  );
}
