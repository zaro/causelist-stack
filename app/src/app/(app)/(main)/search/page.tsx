"use client";
import CourtSelector from "../../_components/court-selector.tsx";
import { causeListStore } from "../../_store/index.ts";
import { Suspense, useState } from "react";
import DailyCauseLists from "../../_components/daily-causelist.tsx";
import Calendar, { timeZone } from "../../_components/calendar.tsx";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Divider from "@mui/material/Divider";
import Input from "@mui/material/Input";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import SearchIcon from "@mui/icons-material/Search";
import BackspaceIcon from "@mui/icons-material/Backspace";
import ReadMoreIcon from "@mui/icons-material/ReadMore";
import InputAdornment from "@mui/material/InputAdornment";
import { fetcher } from "../../_components/fetcher.ts";
import { ISearchResult } from "@/api/courts";
import useSWR from "swr";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemButton from "@mui/material/ListItemButton";
import { styled } from "@mui/material/styles";
import format from "date-fns-tz/format";
import IconButton from "@mui/material/IconButton";
import { AppButtonLink } from "../../_components/app-link.tsx";
import Centered from "../../_components/centered.tsx";
import SubscriptionRequired from "../../_components/subscription-required.tsx";

const CaseListItem = styled(ListItem)(({ theme }) => ({
  borderWidth: "1px",
  borderColor: theme.palette.grey.A400,
  borderStyle: "solid",
  borderRadius: "0.5em",
  marginBottom: "1em",
}));

export default function Page() {
  const [searchText, setSearchText] = useState("");
  const [searchFor, setSearchFor] = useState("");

  const apiURL = searchFor ? `/api/courts/search/${searchFor}` : null;
  const { data, isLoading, error } = useSWR<ISearchResult[]>(apiURL, fetcher);
  const hasResults = !error && data && !isLoading;
  const subscriptionRequired = error && error.status === 402;

  return (
    <Stack alignContent={"center"}>
      <Box display="flex" alignItems={"center"} justifyContent={"center"}>
        <Input
          placeholder="Search for parties and case numbers"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ width: { md: "23em" } }}
          endAdornment={
            <InputAdornment position="end">
              <Button
                onClick={() => {
                  setSearchText("");
                  setSearchFor("");
                }}
              >
                <BackspaceIcon />
              </Button>
            </InputAdornment>
          }
          onKeyDown={(ev) => {
            if (ev.key === "Enter") {
              ev.preventDefault();
              setSearchFor(searchText);
            }
          }}
        />
        <Button onClick={() => setSearchFor(searchText)}>
          <SearchIcon />
        </Button>
      </Box>

      {hasResults && !subscriptionRequired && (
        <Box
          display="flex"
          alignItems={"center"}
          justifyContent={"center"}
          sx={{ marginY: "0.5em" }}
        >
          {data ? data.length : 0} result(s)
        </Box>
      )}

      {!searchText && (
        <Centered sx={{ marginBottom: "10em" }}>
          Use the search field to search for parties and case numbers
        </Centered>
      )}
      {searchText && (!data || data?.length == 0) && (
        <Centered sx={{ marginBottom: "10em" }}>No results found</Centered>
      )}

      {data && data?.length > 0 && (
        <>
          <List>
            {data.map((c, i) => (
              <CaseListItem
                key={i}
                alignItems="flex-start"
                secondaryAction={
                  <AppButtonLink
                    variant="contained"
                    href={`/search/result/${c._id}/${c.casePosition.join(",")}`}
                  >
                    <ReadMoreIcon />
                  </AppButtonLink>
                }
              >
                <ListItemText
                  primary={
                    <>
                      {c.case.caseNumber} {c.case.additionalNumber}
                      {c.case.partyA ? (
                        <Typography>
                          {c.case.partyA} <i>VS</i> {c.case.partyB}
                        </Typography>
                      ) : (
                        <Typography> {c.case.description}</Typography>
                      )}
                    </>
                  }
                  secondaryTypographyProps={{
                    marginTop: "0.3em",
                  }}
                  secondary={
                    <>
                      <i>
                        {format(new Date(c.date), "PPPP", {
                          timeZone,
                        })}
                      </i>
                      <br />
                      <span>{c.judge}</span>
                    </>
                  }
                />
              </CaseListItem>
            ))}
          </List>
        </>
      )}

      {subscriptionRequired && <SubscriptionRequired />}
    </Stack>
  );
}
