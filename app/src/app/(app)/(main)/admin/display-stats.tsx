import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import { userStore } from "../../_store/index.ts";
import { BarChart } from "@mui/x-charts/BarChart";
import useSWR from "swr";
import { fetcher } from "../../_components/fetcher.ts";
import { IUserStats } from "../../../../api/users.ts";

export default function DisplayStats() {
  const accessToken = userStore.use.accessToken();
  const { data, error } = useSWR<IUserStats>(`/api/users/stats`, fetcher, {
    suspense: true,
  });

  if (!data) {
    return <h1>Loading failed</h1>;
  }
  return (
    <Stack height={"100%"}>
      <Grid container>
        <Grid item xs={10}>
          <Alert severity="info">{data.totalCount} users total</Alert>
        </Grid>
        <Grid item xs={2}>
          <Button href={`/api/users/export?jwt=${accessToken}`} target="_blank">
            Download CSV
          </Button>
        </Grid>
      </Grid>
      <BarChart
        xAxis={[
          {
            id: "barCategories",
            data: Object.keys(data.countByDay),
            scaleType: "band",
            label: "Day",
          },
        ]}
        series={[
          {
            data: Object.values(data.countByDay).map((c) => c.totalCount),
            color: "#e08f4f",
            label: "Daily users total",
          },
          {
            data: Object.values(data.countByDay).map((c) => c.otpUsedCount),
            color: "#932c2b",
            label: "Daily users signed up and logged in",
          },
          {
            data: Object.values(data.countByDay).map((c) => c.otpUnusedCount),
            color: "red",
            label: "Daily users signed up and never logged in",
          },
        ]}
        width={600}
        height={500}
      />
    </Stack>
  );
}
