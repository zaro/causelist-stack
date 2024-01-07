import Grid, { GridProps } from "@mui/material/Grid";

export default function Centered(props: GridProps) {
  return (
    <Grid
      container
      direction="row"
      justifyContent="center"
      alignItems="center"
      paddingTop="5em"
      {...props}
    >
      {props.children}
    </Grid>
  );
}
