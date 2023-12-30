"use client";
import { createTheme, ThemeProvider } from "@mui/material/styles";

import themeOptions from "../_common/theme-options.ts";
import CssBaseline from "@mui/material/CssBaseline";

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
