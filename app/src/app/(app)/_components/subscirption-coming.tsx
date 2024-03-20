import Alert from "@mui/material/Alert";
import NotificationImportantIcon from "@mui/icons-material/NotificationImportant";
import { AppLink } from "./app-link.tsx";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import ClearIcon from "@mui/icons-material/Clear";

import useMediaQuery from "@mui/material/useMediaQuery";
import useTheme from "@mui/material/styles/useTheme";
import { useState } from "react";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { Typography } from "@mui/material";

function SubsctionComingReadMore() {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    console.log(">>>", open);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <a href="#" onClick={() => handleOpen()}>
        Read more...
      </a>
      <Dialog
        open={open}
        onClose={handleClose}
        scroll="paper"
        fullScreen={fullScreen}
        disableRestoreFocus={true}
      >
        <DialogTitle>Introducing Subscriptions</DialogTitle>
        <IconButton
          onClick={handleClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <ClearIcon />
        </IconButton>
        <DialogContent dividers={true} sx={{ minHeight: { md: "40em" } }}>
          <Typography m="1em" sx={{ textIndent: "1em" }} fontSize="large">
            Thank you for choosing to use our platform during its trial stages.
            In order for us to guarantee sustained production and improved
            experience we will be charging a small fee payable at flexible
            packages starting April 1, 2024.
          </Typography>
          <Typography m="1em" fontSize="large">
            The amount would enable us to cater for amenities such as web
            hosting, third party automation processes and Artificial
            Intelligence services and databases maintenance.
          </Typography>
          <Typography m="1em" fontSize="large">
            While we are proud of the efficacy of the platform as is currently
            experienced we are still fully committed to improving its
            capabilities by exploiting any relevant available and emergent
            technologies, all of which is possible with your support.
          </Typography>
          <Typography m="1em" fontSize="large">
            Starting with April, hit the SUBSCRIBE link and choose a payment
            model that best suits you.
          </Typography>
          <Typography m="1em" textAlign="center" fontSize="x-large">
            Thank you.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default function SubscriptionComing() {
  return (
    <Alert
      icon={<NotificationImportantIcon fontSize="inherit" />}
      severity="info"
    >
      WE&apos;LL BE CHARGING A FEE OF KSH 350/- STARTING APRIL 2024
      <br />
      <SubsctionComingReadMore />
    </Alert>
  );
}
