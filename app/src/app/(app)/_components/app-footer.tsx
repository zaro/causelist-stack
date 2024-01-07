import { styled } from "@mui/material/styles";
import Box, { BoxProps } from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import ContactEmailLink from "../../_common/contact-email.tsx";

const BottomBox = styled(Box)(({ theme }) => ({
  paddingTop: ".3em",
  paddingBottom: ".3em",
  paddingLeft: "1em",
  paddingRight: "1em",
  backgroundColor: theme.palette.grey.A200,
  borderRadius: "5px",
}));

export default function AppFooter(props: BoxProps) {
  return (
    <BottomBox {...props}>
      <Typography align="center" fontSize="smaller">
        Problems? Something is not working? <ContactEmailLink />
      </Typography>
      <Typography variant="body2" color="text.secondary" align="center">
        {"Copyright © "}
        <Link color="inherit" href="https://causelist.co.ke" target="_blank">
          CauseList
        </Link>{" "}
        {new Date().getFullYear()}
      </Typography>
    </BottomBox>
  );
}
