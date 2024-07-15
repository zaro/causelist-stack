import React from "react";
import Carousel from "react-material-ui-carousel";
import { Paper, Button, Box } from "@mui/material";
import Image1 from "../../carousell/book-1.jpg";
import Image2 from "../../carousell/book-2.jpg";
import Image3 from "../../carousell/book-3.jpg";
import Image4 from "../../carousell/book-4.jpg";
import Image5 from "../../carousell/book-5.jpg";
import Image6 from "../../carousell/book-6.jpg";
import Image7 from "../../carousell/book-7.jpg";
import Image8 from "../../carousell/book-8.jpg";

import Image, { StaticImageData } from "next/image";

interface CarouselItemProps {
  img: StaticImageData;
  description: string;
}

function CarouselItem(props: CarouselItemProps) {
  return (
    <Paper sx={{ width: "100%", height: "300px" }}>
      <Image
        objectFit="contain"
        fill={true}
        src={props.img}
        alt={props.description}
      ></Image>
    </Paper>
  );
}

const items = [
  {
    img: Image1,
    description: "Image description",
  },
  {
    img: Image2,
    description: "Image description",
  },
  {
    img: Image3,
    description: "Image description",
  },
  {
    img: Image4,
    description: "Image description",
  },
  {
    img: Image5,
    description: "Image description",
  },
  {
    img: Image6,
    description: "Image description",
  },
  {
    img: Image7,
    description: "Image description",
  },
  {
    img: Image8,
    description: "Image description",
  },
];

export function AdCarouselBooks() {
  // return <></>;
  return (
    <Box sx={{ width: "90%" }}>
      <Carousel indicatorContainerProps={{ style: { paddingTop: "10px" } }}>
        {items.map((item, i) => (
          <CarouselItem key={i} {...item} />
        ))}
      </Carousel>
    </Box>
  );
}
