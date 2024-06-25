import React from "react";
import Carousel from "react-material-ui-carousel";
import { Paper, Button } from "@mui/material";
import Image1 from "../../carousell/carousell1.jpg";
import Image2 from "../../carousell/carousell2.jpg";
import Image3 from "../../carousell/carousell3.jpg";
import Image, { StaticImageData } from "next/image";

interface CarouselItemProps {
  img: StaticImageData;
  description: string;
}

function CarouselItem(props: CarouselItemProps) {
  return (
    <Paper>
      <Image
        // objectFit="contain"
        // fill={true}
        src={props.img}
        alt={props.description}
      ></Image>
    </Paper>
  );
}

export function AdCarousel() {
  var items = [
    {
      img: Image1,
      description: "Image 1 description",
    },
    {
      img: Image2,
      description: "Image 2 description",
    },
    {
      img: Image3,
      description: "Image 3 description",
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
