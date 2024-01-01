import React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Avatar from "@mui/material/Avatar";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";

import styles from "./page.module.css";

const reviews = [
  {
    id: 1,
    q: "Why can’t I see my case?",
    a: "Internet Connectivity-you will not be able to view case listings if there is poor or lack of internet connection. Make sure that you are connected to the internet.",
  },
  {
    id: 2,
    q: "Typing errors",
    a: [
      "you could have misspelt your search queries in the function.",
      "the judiciary staff in charge of preparing the cause list could have misspelt the case entries (e.g. case party name) and our system’s functions do not include correcting spelling mistakes.",
      "Wrong use of search functions-make sure that your search queries are from the correct court, and the judge’s (or presiding officer’s) name and date are correct",
    ],
  },
  {
    id: 3,
    q: "Listing issues",
    a: [
      "the case may not have been listed and/or published onto the judiciary cause list. In this case you are advised to follow up with the court registry.",
      "the case may have been withdrawn or rescheduled. The system functions do not including interpreting judiciary notices on cause lists that may have been withdrawn due to lack of prosecution, absenteeism of presiding officer, change of court calendar or any other reason.",
      "Encoding issues-cause lists are published in diverse applications such as rich text format (RTF), PDF and Spreadsheets from various developers and of various editions. These pose encoding challenges in system encoding and interpretation of text. If the cause list items are rendered are incompressible text (piggish language or lorem ipsum), you can check later to see if the issue has been resolved",
    ],
  },
];

export default function FAQ() {
  return (
    <div className={styles.faqContainer}>
      <h3>Frequently Asked Question</h3>
      {reviews.map((review) => (
        <>
          <p className={styles.q}>{review.q}</p>
          {Array.isArray(review.a) ? (
            <ul className={styles.a}>
              {review.a.map((e, idx) => (
                <li key={idx}>{e}</li>
              ))}
            </ul>
          ) : (
            <p className={styles.a}>{review.a}</p>
          )}
        </>
      ))}
    </div>
  );
}
