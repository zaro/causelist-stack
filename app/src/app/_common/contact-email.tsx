"use client";
import Link from "@mui/material/Link";
import { useEffect, useState } from "react";

const contactEmail = "c:o:n:t:a:c:t:@:c:a:u:s:e:l:i:s:t:.:c:o:.:k:e";
const supportEmail = "h:e:l:p:@:c:a:u:s:e:l:i:s:t:.:c:o:.:k:e";

export default function ContactEmailLink({ contact }: { contact?: boolean }) {
  const [email, setEmail] = useState("???");
  useEffect(() => {
    setEmail((contact ? contactEmail : supportEmail).replaceAll(":", ""));
  }, []);
  return (
    <Link color="inherit" href={`mailto:${email}`}>
      {email}
    </Link>
  );
}
