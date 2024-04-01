"use client";
import * as React from "react";
import { Suspense } from "react";
import Avatar from "@mui/material/Avatar";
import LoadingButton from "@mui/lab/LoadingButton";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import PaymentsIcon from "@mui/icons-material/Payments";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import AppFooter from "../../_components/app-footer.tsx";
import { AppButtonLink, AppLink } from "../../_components/app-link.tsx";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import useUser from "../../(main)/use-user.hook.ts";
import PhoneTextField from "../../_components/phone-text-field.tsx";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import ErrorBox from "../../_components/error-box.tsx";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "../../_components/fetcher.ts";
import { IOrderStatus, PaymentStatus } from "../../../../api/payments.ts";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";

export default function Page() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("oid");
  const stkPush = searchParams.get("stkPush");
  const [pending, setPending] = React.useState(true);

  const { data, error, isLoading, isValidating } = useSWR<IOrderStatus>(
    orderId ? `/api/payments/check-order-status/${orderId}` : null,
    fetcher,
    {
      refreshInterval: pending ? 2000 : undefined,
    }
  );

  let msg = "Validating Payment";
  switch (data?.status) {
    case PaymentStatus.CANCELED:
      msg = "Payment was cancelled";
      break;
    case PaymentStatus.FAILED:
      msg = "Payment failed";
      break;
    case PaymentStatus.INSUFFICIENT_AMOUNT:
      msg = "Less than required amount was paid";
      break;
    case PaymentStatus.PENDING:
      msg = "Payment is still pending";
      break;
    case PaymentStatus.PAID:
      msg = "Successful payment";
      break;
  }
  if (pending && data?.status && data?.status !== PaymentStatus.PENDING) {
    setPending(false);
  }

  if (!orderId) {
    return (
      <Alert sx={{ marginTop: 8 }} severity="error">
        {" "}
        Invalid Payment{" "}
      </Alert>
    );
  }
  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
          <PaymentsIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Payment Status
        </Typography>
        <Stack spacing="2em" padding="1em">
          <Box textAlign="center">{msg}</Box>
          {stkPush && pending && (
            <Box textAlign="center">
              <Typography variant="h6">
                Check your phone for payment prompt and confirm the payment!
              </Typography>
            </Box>
          )}
          {pending && (
            <Box textAlign="center">
              <CircularProgress color="inherit" />
            </Box>
          )}
          <Box textAlign="center">
            <AppButtonLink href="/home" variant="outlined">
              Go to Home Page
            </AppButtonLink>
          </Box>
        </Stack>
      </Box>
    </Container>
  );
}
