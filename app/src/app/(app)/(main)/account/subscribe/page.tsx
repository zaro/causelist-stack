"use client";
import * as React from "react";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";

import { Suspense } from "react";
import Container from "@mui/material/Container";
import LoadingButton from "@mui/lab/LoadingButton";
import { addAuthHeader } from "../../../_components/fetcher.ts";
import ErrorBox from "../../../_components/error-box.tsx";
import Alert from "@mui/material/Alert";
import { PACKAGES } from "../../../../../api/packages.ts";
import Stack from "@mui/material/Stack";
import { userStore } from "../../../_store/index.ts";

export default function Page() {
  const accessToken = userStore.use.accessToken();
  const [selectedPackage, setSelectedPackage] =
    React.useState<(typeof PACKAGES)[0]>();

  return (
    <Suspense fallback={<h3>Loading data</h3>}>
      <Stack maxWidth="md">
        <Box
          sx={{
            marginTop: 8,
            display: "flex",
            flexDirection: {
              xs: "column",
              md: "row",
            },
            alignItems: "center",
            justifyContent: "space-evenly",
          }}
        >
          {PACKAGES.map((p) => (
            <Card
              variant="elevation"
              key={p.id}
              sx={{ minWidth: "12em", margin: "1em" }}
            >
              <CardContent>
                <Typography variant="h5" component="div">
                  {p.title}
                </Typography>
                <Typography variant="h4" component="div">
                  {p.price} Ksh
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: "center" }}>
                {selectedPackage?.id === p.id ? (
                  <Button variant="contained">Selected</Button>
                ) : (
                  <Button
                    variant="outlined"
                    onClick={() => setSelectedPackage(p)}
                  >
                    Select
                  </Button>
                )}
              </CardActions>
            </Card>
          ))}
        </Box>
        <Box
          sx={{
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Box sx={{ marginBottom: "1em" }}>
            {selectedPackage ? (
              <Typography variant="h5" textAlign="center">
                Buy {selectedPackage.title} subscription for{" "}
                {selectedPackage.price} Ksh
              </Typography>
            ) : (
              <Typography variant="h5" textAlign="center">
                Select a package
              </Typography>
            )}
          </Box>
          <form
            action={`/api/payments/ipay-africa-pay-for/${selectedPackage?.id}`}
            target="_blank"
          >
            <input type="hidden" name="jwt" value={accessToken ?? ""} />
            <LoadingButton
              type="submit"
              disabled={!selectedPackage}
              size="large"
              variant="contained"
            >
              Pay with iPay
            </LoadingButton>
          </form>
        </Box>
      </Stack>
    </Suspense>
  );
}
