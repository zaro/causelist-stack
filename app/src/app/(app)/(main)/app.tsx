"use client";
import { styled, useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import CssBaseline from "@mui/material/CssBaseline";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
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
import { useState, FC } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { userStore } from "../../_store/index.ts";

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
}: {
  item: DrawerMenuItemType;
  currentPath: string;
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
      >
        <ListItemIcon>
          <Icon />
        </ListItemIcon>
        <ListItemText primary={item.name} />
      </ListItemButton>
    </ListItem>
  );
}

const Main = styled("main", { shouldForwardProp: (prop) => prop !== "open" })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create("margin", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth}px`,
  ...(open && {
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
}));

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})<AppBarProps>(({ theme, open }) => ({
  transition: theme.transitions.create(["margin", "width"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(["margin", "width"], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: "flex-end",
}));

export default function App({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const user = userStore.use.user();
  const accessToken = userStore.use.accessToken();
  const [open, setOpen] = useState(false);

  if (!user || !accessToken) {
    console.log("no user or accessToken, redirect to /login");
    console.log("User:", user);
    console.log("accessToken:", accessToken);
    router.push("/sign-in");
    return;
  }

  const currentMenuItem: IDrawerMenuItem = drawerMenu.find(
    (i) => typeof i !== "string" && i.path === pathname
  );

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <AppBar position="fixed" open={open}>
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={handleDrawerOpen}
              edge="start"
              sx={{ mr: 2, ...(open && { display: "none" }) }}
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
            width: drawerWidth,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
            },
          }}
          variant="persistent"
          anchor="left"
          open={open}
        >
          <DrawerHeader>
            <IconButton onClick={handleDrawerClose}>
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
              <DrawerMenuItem key={idx} item={i} currentPath={pathname} />
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
        <Main open={open}>
          <DrawerHeader />
          {children}
        </Main>
      </Box>
    </LocalizationProvider>
  );
}
