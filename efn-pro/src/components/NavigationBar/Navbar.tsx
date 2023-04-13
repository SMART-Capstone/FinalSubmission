import React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import { User } from "../../types/User";
import Logo from "../../images/Logo.png";
import { UserOptions } from "./UserOptions";
import { SessionTracker } from "../../pages/Auth/Common/session";

function ResponsiveAppBar(props: {
  user: User | undefined;
  session: Boolean;
  setSession: React.Dispatch<React.SetStateAction<Boolean>>;
  setUser: React.Dispatch<React.SetStateAction<User | undefined>>;
}) {
  const [navButtonText, setNavButtonText] = React.useState<String>("Login");
  const [buttonStyle, setButtonStyle] = React.useState<Object>({
    visibility: "visible",
  });

  React.useEffect(() => {
    props.user ? setNavButtonText("Logout") : setNavButtonText("Login");
    props.user
      ? setButtonStyle({
          visibility: "hidden",
        })
      : setButtonStyle({
          visibility: "visible",
        });
  }, [props.user]);

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Box
            component="img"
            sx={{
              height: 32,
              mx: 2,
            }}
            alt="Your logo."
            src={Logo}
          />
          <Typography
            variant="h6"
            noWrap
            component="a"
            href="/"
            sx={{
              mr: 2,
              display: { xs: "none", md: "flex" },
              fontFamily: "monospace",
              fontWeight: 700,
              color: "inherit",
              textDecoration: "none",
            }}
          >
            EFNpro
          </Typography>

          <Typography
            variant="h5"
            noWrap
            component="a"
            href=""
            sx={{
              mr: 2,
              display: { xs: "flex", md: "none" },
              flexGrow: 1,
              fontFamily: "monospace",
              fontWeight: 700,
              letterSpacing: ".3rem",
              color: "inherit",
              textDecoration: "none",
            }}
          >
            EFN
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}></Box>

          <Button
            href={"/" + navButtonText.toLowerCase()}
            style={buttonStyle}
            sx={{
              my: 2,
              color: "white",
              display: "block",
              textTransform: "none",
            }}
          >
            {navButtonText}
          </Button>

          <UserOptions
            user={props.user}
            setUser={props.setUser}
            session={props.session}
            setSession={props.setSession}
          ></UserOptions>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
export default ResponsiveAppBar;
