"use client";
import React, { useEffect, useMemo } from "react";
import Stack from "@mui/material/Stack";
import Autocomplete from "@mui/material/Autocomplete";

import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Avatar from "@mui/material/Avatar";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import useSWR from "swr";
import { fetcher } from "../../(app)/_components/fetcher.ts";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";

export default function Page() {
  const [countyOpen, setCountyOpen] = React.useState(false);
  const [cityOpen, setCityOpen] = React.useState(false);
  const [county, setCounty] = React.useState<string | null>(null);
  const [city, setCity] = React.useState<string | null>(null);

  const { data: citiesData, isLoading: citiesLoading } = useSWR(
    `/api/directory/cities`,
    fetcher
  );
  const cityByCounty = useMemo(() => {
    if (!citiesData) return {};
    return citiesData.reduce(
      (a: any, e: any) => ({
        ...a,
        [e.county]: [...(a[e.county] ?? []), e.city],
      }),
      {}
    );
  }, [citiesData]);
  useEffect(() => {
    if (county) {
      if (cityByCounty[county]?.length == 1) {
        setCity(cityByCounty[county][0]);
      }
    }
  }, [county, cityByCounty]);
  const recommendAPIUrl = city ? `/api/directory/for-city/${city}` : null;
  const { data, isLoading } = useSWR(recommendAPIUrl, fetcher);

  return (
    <Stack>
      <Typography variant="h4" textAlign="center">
        Find a lawyer near you
      </Typography>
      <Autocomplete
        sx={{ width: 300, margin: "1em auto" }}
        open={countyOpen}
        onOpen={() => {
          setCountyOpen(true);
        }}
        onClose={() => {
          setCountyOpen(false);
        }}
        onChange={(e, v: string | null) => setCounty(v)}
        options={Object.keys(cityByCounty)}
        value={county}
        loading={citiesLoading}
        renderInput={(params) => (
          <TextField
            {...params}
            label={`Select County`}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <React.Fragment>
                  {citiesLoading ? (
                    <CircularProgress color="inherit" size={20} />
                  ) : null}
                  {params.InputProps.endAdornment}
                </React.Fragment>
              ),
            }}
          />
        )}
        renderOption={(props, option) => {
          return (
            <li {...props} key={option}>
              {option}
            </li>
          );
        }}
        renderTags={(tagValue, getTagProps) => {
          return tagValue.map((option, index) => (
            <Chip {...getTagProps({ index })} key={option} label={option} />
          ));
        }}
      />

      <Autocomplete
        sx={{ width: 300, margin: "1em auto" }}
        disabled={!county}
        open={cityOpen}
        onOpen={() => {
          setCityOpen(true);
        }}
        onClose={() => {
          setCityOpen(false);
        }}
        onChange={(e, v: string | null) => setCity(v)}
        options={county ? cityByCounty[county] : []}
        value={city}
        loading={citiesLoading}
        renderInput={(params) => (
          <TextField
            {...params}
            label={`Select City`}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <React.Fragment>
                  {citiesLoading ? (
                    <CircularProgress color="inherit" size={20} />
                  ) : null}
                  {params.InputProps.endAdornment}
                </React.Fragment>
              ),
            }}
          />
        )}
        renderOption={(props, option) => {
          return (
            <li {...props} key={option}>
              {option}
            </li>
          );
        }}
        renderTags={(tagValue, getTagProps) => {
          return tagValue.map((option, index) => (
            <Chip {...getTagProps({ index })} key={option} label={option} />
          ));
        }}
      />
      {data && (
        <>
          <Typography variant="h6" textAlign="center">
            Here are some lawyers in the selected area
          </Typography>

          <List sx={{ bgcolor: "background.paper", marginX: "auto" }}>
            {data.map((e: any) => (
              <ListItem key={e.name}>
                <ListItemText primary={e.name} />
              </ListItem>
            ))}
          </List>
        </>
      )}
    </Stack>
  );
}
