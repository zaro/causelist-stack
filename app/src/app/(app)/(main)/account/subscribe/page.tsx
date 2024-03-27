"use client";
import * as React from "react";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";

import { Suspense } from "react";
import Container from "@mui/material/Container";
import LoadingButton from "@mui/lab/LoadingButton";
import { addAuthHeader } from "../../../_components/fetcher.ts";
import ErrorBox from "../../../_components/error-box.tsx";
import Alert from "@mui/material/Alert";
import { PACKAGES } from "../../../../../api/packages.ts";
import Stack from "@mui/material/Stack";
import { userStore } from "../../../_store/index.ts";
import { useRouter } from "next/navigation";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import Tab from "@mui/material/Tab";

import LipaNaMpesa from "./lipa-na-mpesa.png";
import StkPushImg from "./stk-push.png";
import Image from "next/image";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";

interface PaymentButtonProps {
  disabled?: boolean;
  selectedPackage: (typeof PACKAGES)[0];
  accessToken: string | null;
  onClick: () => void;
}

function IPayForm({ selectedPackage, accessToken }: PaymentButtonProps) {
  return (
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
  );
}

function KopoKopoStkPush({
  selectedPackage,
  onClick,
  disabled,
}: PaymentButtonProps) {
  const router = useRouter();
  const [error, setError] = React.useState<string[]>([]);
  const [sent, setSent] = React.useState(false);
  const handleClick = () => {
    setSent(true);
    setError([]);
    onClick();
    fetch(
      `/api/payments/stk-push-payment/${selectedPackage?.id}`,
      addAuthHeader({
        method: "POST",
      })
    )
      .then(async (r) => {
        if (!r.ok) {
          setError([await r.text()]);
          return;
        }
        const response = await r.json();
        console.log(response);
        const { orderId, success, text } = response;
        if (success) {
          router.push(`/payment-status?oid=${orderId}&stkPush=true`);
        } else {
          setError([text, "Please Try again later"]);
          setSent(false);
        }
      })
      .catch((e) => {
        setError([e.toString()]);
        setSent(false);
      });
  };
  return (
    <Stack sx={{ marginBottom: "1em", minWidth: "200px", marginX: "auto" }}>
      <LoadingButton
        type="submit"
        disabled={!selectedPackage || sent || disabled}
        size="large"
        variant="contained"
        loading={sent}
        onClick={handleClick}
      >
        Pay
      </LoadingButton>
      {sent && (
        <Typography mt="2em">
          Check your phone for payment prompt and confirm the payment!
        </Typography>
      )}
      <ErrorBox error={error} />
    </Stack>
  );
}

function PaymentMethod({
  selectedPackage,
  accessToken,
  onClick,
}: PaymentButtonProps) {
  const [value, setValue] = React.useState("1");
  const [phoneUnlocked, setPhoneUnlocked] = React.useState(false);
  React.useEffect(() => {
    setPhoneUnlocked(false);
  }, [value]);
  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };
  return (
    <TabContext value={value}>
      <Box sx={{ borderBottom: 1, borderColor: "divider", width: "100%" }}>
        <TabList onChange={handleChange} variant="fullWidth">
          <Tab label="Payment Prompt" value="1" />
          <Tab label="Lipa na MPESA" value="2" />
        </TabList>
      </Box>
      <TabPanel value="1">
        <Grid container>
          <Grid item xs={12} md={6}>
            <Stack>
              <Typography variant="h5" textAlign="center" marginBottom="2em">
                Buy <b>{selectedPackage.title}</b> subscription for{" "}
                <b>{selectedPackage.price} Ksh</b>
              </Typography>

              <Typography marginBottom="5em">
                Clicking Pay button will send a payment prompt to your phone.
                Please make sure your phone is unlocked before clicking Pay.
              </Typography>

              <FormControlLabel
                control={<Checkbox onChange={(e, v) => setPhoneUnlocked(v)} />}
                label="My phone is unlocked"
                sx={{ marginX: "auto", marginBottom: "1em" }}
              />

              <KopoKopoStkPush
                disabled={!phoneUnlocked}
                selectedPackage={selectedPackage}
                accessToken={accessToken}
                onClick={onClick}
              />
            </Stack>
          </Grid>
          <Grid item xs={12} md={6} textAlign="center">
            <Image src={StkPushImg} alt="Stk push prompt" height={450} />
          </Grid>
        </Grid>
      </TabPanel>
      <TabPanel value="2">
        <Grid container justifyContent="center" spacing={1} fontSize="large">
          <Grid item xs={12} textAlign="center">
            <Image src={LipaNaMpesa} alt="Lipa na MPESA" />
          </Grid>
          <Grid item xs={6} textAlign="end">
            Till Number:
          </Grid>
          <Grid item xs={6}>
            <b>4247308</b>
          </Grid>
          <Grid item xs={6} textAlign="end">
            Business Name:
          </Grid>
          <Grid item xs={6}>
            <b>CODESMART TECHNOLOGIES</b>
          </Grid>
          <Grid item xs={6} textAlign="end">
            Amount:
          </Grid>
          <Grid item xs={6}>
            <b>{selectedPackage.price}</b> Ksh
          </Grid>
        </Grid>
      </TabPanel>
    </TabContext>
  );
}

export default function Page() {
  const accessToken = userStore.use.accessToken();
  const [selectedPackage, setSelectedPackage] =
    React.useState<(typeof PACKAGES)[0]>();
  const [selectionEnabled, setSelectionEnabled] = React.useState(true);

  return (
    <Suspense fallback={<h3>Loading data</h3>}>
      <Stack>
        <Grid container width="100%">
          {PACKAGES.map((p) => (
            <Grid key={p.id} item xs={12} sm={6} md={4} xl={3}>
              <Card
                variant="elevation"
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
                      disabled={!selectionEnabled}
                    >
                      Select
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
        {selectedPackage ? (
          <PaymentMethod
            selectedPackage={selectedPackage}
            accessToken={accessToken}
            onClick={() => {
              setSelectionEnabled(false);
            }}
          />
        ) : (
          <Typography variant="h5" textAlign="center">
            Select a package to see payment details
          </Typography>
        )}
      </Stack>
    </Suspense>
  );
}
