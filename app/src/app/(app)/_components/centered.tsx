import { Grid } from "@mui/material";

export default function Centered({ children }: { children: React.ReactNode }) {
  return (
    <Grid
      container
      direction="row"
      justifyContent="center"
      alignItems="center"
      paddingTop="5em"
    >
      {children}
    </Grid>
  );
}
