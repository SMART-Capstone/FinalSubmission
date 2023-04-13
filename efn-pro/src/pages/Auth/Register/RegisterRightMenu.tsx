import React from "react";

import { Button, Grid } from "@mui/material";
import { RegisterForm } from "./index";
import { useNavigate } from "react-router-dom";
import { RouteButtons } from "../Common/RouteButtons";

import { SessionTracker } from "../Common/session";
import {
  ErrorMessage,
  PopupAlert,
  defaultPopupState,
} from "../../../components/PopupAlert";
import { CircularProgress } from "@mui/material";

export default function RightMenu(props: SessionTracker) {
  const [pw, setPw] = React.useState<String>("");
  const [email, setEmail] = React.useState<String>("");
  const [popup, setPopup] = React.useState<ErrorMessage>(defaultPopupState);
  const [loading, setLoading] = React.useState<Boolean>(false);
  const navigate = useNavigate();
  const WALLET_ADDRESS = "0x101120";

  const requestRegister = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/User/CreateUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          WalletAddress: WALLET_ADDRESS,
          Username: email,
          Password: pw,
          UserType: "ARTIST",
          Email: email,
        }),
      });

      if (res.status !== 200) {
        console.log("could not register");
        setPopup({ ...popup, error: true, message: "Failed Registration" });
      } else if (res.status === 200) {
        console.log("successful register");
        props.setSession(true);
        navigate("/");
      }
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  };

  return (
    <Grid container direction={"column"} alignContent={"center"}>
      <Grid item margin={4} paddingTop={4}>
        <RouteButtons />
      </Grid>

      <Grid item marginLeft={3} marginRight={3} marginBottom={3}>
        <RegisterForm setPw={setPw} setEmail={setEmail} />
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
          onClick={requestRegister}
        >
          Sign Up with email
        </Button>
      </Grid>
      <PopupAlert popup={popup} setPopup={setPopup}></PopupAlert>
    </Grid>
  );
}
