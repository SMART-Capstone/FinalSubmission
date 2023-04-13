import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Grid } from "@mui/material";

interface Props {
  Title: string;
  Objects: DisplayObject[];
  onItemPress: (contract: any) => void;
}

interface DisplayObject {
  itemId: string;
  ProjectName: string;
  owenerId: string;
  creationDate: number;
  fileUrl: string | null | undefined;
}

function ListObjects({ Title, Objects, onItemPress }: Props) {
  // Reverse Chron. Order:
  Objects.sort((a, b) => b.creationDate - a.creationDate);

  var settings = {
    dots: true,
    arrows: true,
    infinite: Objects.length > 3,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 3,
    initialSlide: 0,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 3,
          infinite: Objects.length > 3,
        },
      },
      {
        breakpoint: 800,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 2,
          infinite: Objects.length > 2,
        },
      },
      {
        breakpoint: 400,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          infinite: Objects.length > 1,
        },
      },
    ],
  };

  return (
    <div className="nfts">
      <Grid item mx={10} paddingBottom={4}>
        <h2>{Title}</h2>
        <Slider {...settings}>
          {Objects.map((item, index) => (
            <div
              className="nft"
              key={index}
              onDoubleClick={(el) => onItemPress(Objects[index])}
            >
              <img
                className="project-img"
                src={
                  item.fileUrl
                    ? item.fileUrl
                    : "https://source.unsplash.com/random/?illustration&" +
                      Math.random()
                }
                style={{
                  display: "block",
                  marginLeft: "-2px",
                  marginRight: "auto",
                  width: "105%",
                }}
                alt="background"
              />
              <h3 className="project-name">{item.ProjectName}</h3>
              <h4>
                Creation Date:{" "}
                <i>
                  {new Date(item.creationDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </i>
              </h4>
            </div>
          ))}
        </Slider>
      </Grid>
    </div>
  );
}

export { ListObjects };
