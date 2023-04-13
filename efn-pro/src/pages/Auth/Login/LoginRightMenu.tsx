import React from "react";

import { Button, Grid } from "@mui/material";
import { LoginForm } from "./index";
import {
  ErrorMessage,
  PopupAlert,
  defaultPopupState,
} from "../../../components/PopupAlert";
import { useNavigate } from "react-router-dom";
import { RouteButtons } from "../Common/RouteButtons";
import { SessionTracker } from "../Common/session";
import { CircularProgress } from "@mui/material";

export default function RightMenu(props: SessionTracker) {
  const [pw, setPw] = React.useState<String>("");
  const [email, setEmail] = React.useState<String>("");
  const [popup, setPopup] = React.useState<ErrorMessage>(defaultPopupState);
  const [loading, setLoading] = React.useState<Boolean>(false);

  const navigate = useNavigate();

  const requestLogin = async () => {
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Access-Control-Allow-Origin": "*",
          Accept: "application/json",
        },
        credentials: "include",
        body: new URLSearchParams({
          identifier: `${email}`,
          password: `${pw}`,
        }),
      });

      if (res.status !== 200) {
        console.log("could not log in");
        setPopup({ ...popup, error: true, message: "Failed Login" });
      } else if (res.status === 200) {
        console.log("successful login");
        props.setSession(true);
        navigate("/");
      }
    } catch (e) {
      console.log("could not log in");
      setPopup({ ...popup, error: true, message: "Failed Login" });
    }
    setLoading(false);
  };
  return (
    <Grid container direction={"column"} alignContent={"center"}>
      <Grid item margin={4} paddingTop={4}>
        <RouteButtons />
      </Grid>

      <Grid item marginLeft={3} marginRight={3}>
        <LoginForm setPw={setPw} setEmail={setEmail} />
      </Grid>

      <Grid
        item
        paddingBottom={4}
        paddingRight={3}
        paddingLeft={3}
        width={"inherit"}
      >
        {loading && <CircularProgress />}
        <Button
          sx={{ borderRadius: "20px", color: "white", textTransform: "none" }}
          color="warning"
          fullWidth={true}
          variant="contained"
          onClick={requestLogin}
        >
          Login with email
        </Button>
      </Grid>

      <PopupAlert popup={popup} setPopup={setPopup}></PopupAlert>
    </Grid>
  );
}
