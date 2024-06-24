"use client";
import { timeZone } from "../../../_components/calendar.tsx";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ReadMoreIcon from "@mui/icons-material/ReadMore";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { fetcher } from "../../../_components/fetcher.ts";
import { Hit, SearchResponse } from "meilisearch";
import useSWRInfinite, { SWRInfiniteKeyLoader } from "swr/infinite";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import { styled } from "@mui/material/styles";
import format from "date-fns-tz/format";
import { AppButtonLink, AppLink } from "../../../_components/app-link.tsx";
import Centered from "../../../_components/centered.tsx";
import InAppNotice from "../../../_components/in-app-notice.tsx";
import SubscriptionRequired from "../../../_components/subscription-required.tsx";
import { CaseIndex } from "../../../../../api/search-index.ts";
import CaseSearchBox from "../case-search-box.tsx";
import { Arguments } from "swr";
import { useState } from "react";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";

const CaseListItem = styled(ListItem)(({ theme }) => ({
  borderWidth: "1px",
  borderColor: theme.palette.grey.A400,
  borderStyle: "solid",
  borderRadius: "0.5em",
  marginBottom: "1em",
}));

function ResultItem({
  record,
  searchFor,
}: {
  record: Hit<CaseIndex>;
  searchFor: string;
}) {
  return (
    <CaseListItem
      key={record.case_id}
      alignItems="flex-start"
      secondaryAction={
        <AppLink href={`/case-search/result/${record.case_id}/${searchFor}`}>
          <ArrowForwardIosIcon fontSize="large" />
        </AppLink>
      }
      sx={{
        background:
          "linear-gradient(90deg, rgba(223,223,223,0) 0%, rgba(223,223,223,0) 90%, rgba(192,192,192,1) 100%)",
      }}
    >
      <ListItemText
        primary={
          <>
            <p
              className="dont-break-out"
              dangerouslySetInnerHTML={{
                __html: record._formatted?.txt ?? "???",
              }}
            ></p>
          </>
        }
        secondaryTypographyProps={{
          marginTop: "0.3em",
        }}
        secondary={
          <>
            <i>
              {format(new Date(record.date_delivered), "PPPP", {
                timeZone,
              })}
            </i>
            <br />
            <span>{record.judge}</span>
            <br />
            <span>{record.parties}</span>
          </>
        }
      />
    </CaseListItem>
  );
}

export default function Page({ params }: { params: { query: string[] } }) {
  const searchFor = params.query.map((e) => decodeURIComponent(e)).join("/");
  const [sortBy, setSortBy] = useState<string>("");

  const apiURL = searchFor
    ? `/api/cases/fts/${encodeURIComponent(searchFor)}?sort=${
        sortBy ? "time" : ""
      }`
    : null;

  const getKey: SWRInfiniteKeyLoader<any, Arguments> = (
    pageIndex,
    previousPageData: SearchResponse<CaseIndex>
  ) => {
    if (!apiURL) return null;
    // reached the end
    if (previousPageData && !previousPageData.hits.length) return null;

    // first page, we don't have `previousPageData`
    if (pageIndex === 0) return `${apiURL}`;

    // add the cursor to the API endpoint
    return `${apiURL}&offset=${
      (previousPageData.offset ?? 0) + (previousPageData.limit ?? 20)
    }`;
  };

  const { data, isLoading, error, size, setSize } = useSWRInfinite<
    SearchResponse<CaseIndex>
  >(getKey, fetcher);
  const results = data;
  const hasResults = !error && results?.length && !isLoading;
  const subscriptionRequired = error && error.status === 402;
  const isLastPage = !results?.at(-1)?.hits?.length;
  const estimatedResultCount = results?.[0].estimatedTotalHits;

  return (
    <Stack alignContent={"center"}>
      <CaseSearchBox initialSearchText={searchFor} />
      <FormControl>
        <FormLabel id="demo-row-radio-buttons-group-label">Sort by</FormLabel>
        <RadioGroup
          row
          aria-labelledby="demo-row-radio-buttons-group-label"
          name="row-radio-buttons-group"
          defaultValue={sortBy}
          onChange={(event) =>
            setSortBy((event.target as HTMLInputElement).value)
          }
        >
          <FormControlLabel value="" control={<Radio />} label="Relevance" />
          <FormControlLabel value="time" control={<Radio />} label="Time" />
        </RadioGroup>
      </FormControl>

      {hasResults && !subscriptionRequired && estimatedResultCount && (
        <Box
          display="flex"
          alignItems={"center"}
          justifyContent={"center"}
          sx={{ marginY: "0.5em" }}
        >
          {estimatedResultCount >= 1000 ? "1000+" : estimatedResultCount}{" "}
          result(s)
        </Box>
      )}

      {!hasResults && (
        <Centered sx={{ marginBottom: "10em" }}>No results found</Centered>
      )}

      {isLoading && (
        <Centered sx={{ marginBottom: "10em" }}>Loading data</Centered>
      )}

      {results && results.length > 0 && (
        <>
          <List>
            {results.map((page) =>
              page.hits.map((c) => (
                <ResultItem
                  record={c}
                  key={c.case_id}
                  searchFor={searchFor}
                ></ResultItem>
              ))
            )}
          </List>
        </>
      )}
      {!isLastPage && (
        <Button onClick={() => setSize(size + 1)}>Load More</Button>
      )}
      {subscriptionRequired && <SubscriptionRequired />}
    </Stack>
  );
}
