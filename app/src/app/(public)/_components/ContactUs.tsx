import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import TextareaAutosize from "@mui/material/TextareaAutosize";
import Button from "@mui/material/Button";

import classes from "./common.module.css";

const ContactUs = () => {
  // const [email, setEmail] = useState('');
  // const [firstName, setFirstName] = useState('');
  // const [subject, setSubject] = useState('');
  // const [message, setMessage] = useState('');
  // const classes = useStyles();
  const [email, setEmail] = ["", ""];
  const [firstName, setFirstName] = ["", ""];
  const [subject, setSubject] = ["", ""];
  const [message, setMessage] = ["", ""];

  const submitForm: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    console.log({ email, firstName, subject, message });
  };

  return (
    <Box className={classes.formContainer}>
      <Typography variant="h4" className={classes.formHeading}>
        Contact Us
      </Typography>
      <Box
        className={classes.form}
        component="form"
        noValidate
        autoComplete="off"
      >
        <TextField
          label="Full Name"
          variant="outlined"
          fullWidth
          className={classes.inputField}
          value={firstName}
          // onChange={(e) => setFirstName(e.target.value)}
        />

        <TextField
          label="Email"
          variant="outlined"
          fullWidth
          className={classes.inputField}
          value={email}
          // onChange={(e) => setEmail(e.target.value)}
        />

        <TextField
          label="Subject"
          variant="outlined"
          fullWidth
          className={classes.inputField}
          value={subject}
          // onChange={(e) => setSubject(e.target.value)}
        />

        <TextareaAutosize
          aria-label="minimum height"
          minRows={6}
          placeholder="Enter a message"
          className={classes.textArea}
          spellCheck
          value={message}
          // onChange={(e) => setMessage(e.target.value)}
        />

        <Button
          variant="contained"
          type="submit"
          color="primary"
          sx={{ width: "200px", fontSize: "16px" }}
          // onClick={submitForm}
        >
          Submit
        </Button>
      </Box>
    </Box>
  );
};

export default ContactUs;
