"use client";
import { createTheme, ThemeProvider } from "@mui/material/styles";

import { ThemeOptions } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

export const themeOptions: ThemeOptions = {
  palette: {
    mode: "light",
    primary: {
      main: "#932c2b",
    },
    secondary: {
      main: "#faa21c",
    },
    error: {
      main: "#ff3636",
    },
    warning: {
      main: "#e08f4f",
    },
  },
};

const defaultTheme = createTheme(themeOptions);

export default function ProvideTheme({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider theme={defaultTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
