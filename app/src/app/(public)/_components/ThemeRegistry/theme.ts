import { createTheme } from "@mui/material/styles";

import { Poppins } from "next/font/google";
import themeOptions from "../../../_common/theme-options.ts";

const poppins = Poppins({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  display: "swap",
});

const theme = createTheme({
  ...themeOptions,
  typography: {
    fontFamily: ["Poppins", poppins.style.fontFamily, "sans-serif"].join(","),
  },
  components: {
    MuiAlert: {
      styleOverrides: {
        root: ({ ownerState }) => ({
          ...(ownerState.severity === "info" && {
            backgroundColor: "#60a5fa",
          }),
        }),
      },
    },
  },
});

export default theme;
