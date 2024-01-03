import InputAdornment from "@mui/material/InputAdornment";
import TextField, { BaseTextFieldProps } from "@mui/material/TextField";
import Flag from "./flag.tsx";
import parsePhoneNumber from "libphonenumber-js";

export default function PhoneTextField(props: BaseTextFieldProps) {
  let { value, defaultValue, ...otherProps } = props;
  if (value) {
    const phoneNumber = parsePhoneNumber(value as string, "KE");
    value = phoneNumber?.formatNational();
  }
  if (defaultValue) {
    const phoneNumber = parsePhoneNumber(value as string, "KE");
    defaultValue = phoneNumber?.formatNational();
  }

  return (
    <TextField
      {...otherProps}
      value={value}
      defaultValue={defaultValue}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Flag />
            &nbsp;+254
          </InputAdornment>
        ),
      }}
    />
  );
}
