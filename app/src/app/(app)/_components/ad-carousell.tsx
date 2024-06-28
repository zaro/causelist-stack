import React from "react";
import Carousel from "react-material-ui-carousel";
import { Paper, Button, Box } from "@mui/material";
import Image1 from "../../carousell/carousell1.jpg";
import Image2 from "../../carousell/carousell2.jpg";
import Image3 from "../../carousell/carousell3.jpg";
import Image4 from "../../carousell/carousell4.jpg";
import Image5 from "../../carousell/carousell5.jpg";
import Image6 from "../../carousell/carousell6.jpg";
import Image7 from "../../carousell/carousell7.jpg";
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
  {
    img: Image4,
    description: "Image 3 description",
  },
  {
    img: Image5,
    description: "Image 3 description",
  },
  {
    img: Image6,
    description: "Image 3 description",
  },
  {
    img: Image7,
    description: "Image 3 description",
  },
];

export function AdCarousel() {
  return <></>;
  // return (
  //   <Box sx={{ width: "90%" }}>
  //     <Carousel indicatorContainerProps={{ style: { paddingTop: "10px" } }}>
  //       {items.map((item, i) => (
  //         <CarouselItem key={i} {...item} />
  //       ))}
  //     </Carousel>
  //   </Box>
  // );
}
