"use client";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import MuiAppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import { usePathname, useRouter } from "next/navigation";
import AppFooter from "../_components/app-footer.tsx";

const Main = styled("main")(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
}));

export default function OfflineMain({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const handleLoginMenu = () => {
    if (pathname === "/sign-in") {
      router.push("/sign-up");
    } else if (pathname === "/sign-up") {
      router.push("/sign-in");
    }
  };
  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <MuiAppBar position="fixed">
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="login"
            onClick={handleLoginMenu}
            edge="start"
            sx={{ mr: 2 }}
          >
            <WifiOffIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div">
            No Connection
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
        <AppFooter sx={{ marginTop: "3em" }} />
      </Box>
    </Box>
  );
}
