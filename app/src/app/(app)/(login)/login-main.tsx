"use client";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import MuiAppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import LoginIcon from "@mui/icons-material/Login";
import { usePathname, useRouter } from "next/navigation";

const Main = styled("main")(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
}));

export default function LoginMain({ children }: { children: React.ReactNode }) {
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
            <LoginIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div">
            Login/Sign-up
          </Typography>
        </Toolbar>
      </MuiAppBar>
      <Main>{children}</Main>
    </Box>
  );
}
