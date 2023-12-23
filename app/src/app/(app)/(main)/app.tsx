"use client";
import { styled, useTheme } from "@mui/material/styles";
import Grid from "@mui/material/Grid";

import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import CssBaseline from "@mui/material/CssBaseline";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import SearchIcon from "@mui/icons-material/Search";
import InfoIcon from "@mui/icons-material/Info";
import CircularProgress from "@mui/material/CircularProgress";
import { useState, FC, MouseEventHandler } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import useSwr, { SWRConfig } from "swr";
import { userStore } from "../../_store/index.ts";
import useUser from "./use-user.hook.ts";

const drawerWidth = 240;

interface IDrawerMenuItem {
  name: string;
  path: string;
  icon: FC;
}

type DrawerMenuItemType = IDrawerMenuItem | "-";

const drawerMenu: DrawerMenuItemType[] = [
  {
    name: "Calendar",
    path: "/calendar",
    icon: CalendarMonthIcon,
  },
  {
    name: "Search",
    path: "/search",
    icon: SearchIcon,
  },
  "-",
  {
    name: "Account",
    path: "/account",
    icon: ManageAccountsIcon,
  },
  {
    name: "About",
    path: "/about",
    icon: InfoIcon,
  },
];

function DrawerMenuItem({
  item,
  currentPath,
  onClick,
}: {
  item: DrawerMenuItemType;
  currentPath: string;
  onClick: MouseEventHandler<HTMLAnchorElement> | undefined;
}) {
  if (item === "-") {
    return <Divider />;
  }
  const Icon = item.icon;

  return (
    <ListItem disablePadding>
      <ListItemButton
        component={Link}
        href={item.path}
        selected={item.path === currentPath}
        onClick={onClick}
      >
        <ListItemIcon>
          <Icon />
        </ListItemIcon>
        <ListItemText primary={item.name} />
      </ListItemButton>
    </ListItem>
  );
}

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: "space-between",
}));

function FullScreenSpinner() {
  return (
    <Grid container justifyContent={"center"}>
      <Grid item>
        <CircularProgress />
      </Grid>
    </Grid>
  );
}

export default function App({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const { user, loadingUser, loggedOut } = useUser();
  if (loggedOut) return <div>redirecting...</div>;
  if (loadingUser) return <FullScreenSpinner />;

  const currentMenuItem: IDrawerMenuItem = drawerMenu.find(
    (i) => typeof i !== "string" && i.path === pathname
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <AppBar position="fixed">
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={handleDrawerToggle}
              edge="start"
              sx={{ mr: 2, display: { sm: "none" } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              {currentMenuItem?.name ?? "???"}
            </Typography>
          </Toolbar>
        </AppBar>
        <Drawer
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          variant="temporary"
          anchor="left"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
        >
          <DrawerHeader>
            <strong>CauseList</strong>
            <IconButton onClick={handleDrawerToggle}>
              {theme.direction === "ltr" ? (
                <ChevronLeftIcon />
              ) : (
                <ChevronRightIcon />
              )}
            </IconButton>
          </DrawerHeader>
          <Divider />
          <List sx={{ marginBottom: "auto" }}>
            {drawerMenu.map((i, idx) => (
              <DrawerMenuItem
                key={idx}
                item={i}
                currentPath={pathname}
                onClick={handleDrawerToggle}
              />
            ))}
          </List>
          <List>
            <ListItem>
              <ListItemAvatar>
                <Avatar>
                  <AccountCircleIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={`${user.firstName} ${user.lastName}`} />
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={Link} href="/sign-out">
                <ListItemIcon>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary="Sign out" />
              </ListItemButton>
            </ListItem>
          </List>
        </Drawer>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - ${drawerWidth}px)` },
          }}
        >
          <DrawerHeader />
          {children}
        </Box>
      </Box>
    </LocalizationProvider>
  );
}
