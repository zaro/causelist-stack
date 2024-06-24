import React from "react";
import Carousel from "react-material-ui-carousel";
import { Paper, Button } from "@mui/material";

interface CarouselItemProps {
  name: string;
  description: string;
}

function CarouselItem(props: CarouselItemProps) {
  return (
    <Paper>
      <h2>{props.name}</h2>
      <p>{props.description}</p>

      <Button className="CheckButton">Check it out!</Button>
    </Paper>
  );
}

export function AdCarousel() {
  var items = [
    {
      name: "Random Name #1",
      description: "Probably the most random thing you have ever seen!",
    },
    {
      name: "Random Name #2",
      description: "Hello World!",
    },
    {
      name: "Random Name #3",
      description: "Hey there!",
    },
  ];

  return (
    <Carousel
      sx={{ width: "90%" }}
      indicatorContainerProps={{ style: { paddingTop: "10px" } }}
    >
      {items.map((item, i) => (
        <CarouselItem key={i} {...item} />
      ))}
    </Carousel>
  );
}
