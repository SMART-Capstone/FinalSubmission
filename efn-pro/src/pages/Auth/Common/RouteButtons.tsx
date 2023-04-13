import React from "react";
import { Button, Grid, Typography } from "@mui/material";
import { routeButtonStyle, GREY_MIDDLE } from "./styles";
import { useLocation } from "react-router-dom";

export function RouteButtons() {
  const location = useLocation();

  const [loginBtnStyle, setLoginBtnStyle] =
    React.useState<Object>(routeButtonStyle);
  const [registerBtnStyle, setRegisterBtnStyle] =
    React.useState<Object>(routeButtonStyle);

  function isLogin() {
    return location.pathname === "/login";
  }

  React.useEffect(() => {
    if (location.pathname !== "/login") {
      setRegisterBtnStyle({ ...routeButtonStyle, borderColor: "primary" });
      setLoginBtnStyle({ ...routeButtonStyle, borderColor: GREY_MIDDLE });
    } else if (location.pathname === "/login") {
      setRegisterBtnStyle({ ...routeButtonStyle, borderColor: GREY_MIDDLE });
      setLoginBtnStyle({ ...routeButtonStyle, borderColor: "primary" });
    }
  }, [location.pathname]);

  return (
    <Grid container alignItems={"flex-end"}>
      <Grid item xs={6}>
        <Button href="/login" variant="text" sx={loginBtnStyle}>
          <Typography color={isLogin() ? "primary" : "black"}>
            Already a member
          </Typography>
        </Button>
      </Grid>

      <Grid item xs={6}>
        <Button href="/signup" variant="text" sx={registerBtnStyle}>
          <Typography color={isLogin() ? "black" : "primary"}>
            I am new here
          </Typography>
        </Button>
      </Grid>
    </Grid>
  );
}
