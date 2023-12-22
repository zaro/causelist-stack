"use client";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const defaultTheme = createTheme();

export default function ProvideTheme({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ThemeProvider theme={defaultTheme}>{children}</ThemeProvider>;
}
