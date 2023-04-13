import React from "react";
import AccountCircle from "@mui/icons-material/AccountCircle";
import { Button, IconButton, Menu, MenuItem } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { User } from "./../../types/User";
import { Profile } from "../../pages/Profile";
import { SessionTracker } from "../../pages/Auth/Common/session";
import { Logout } from "../../pages/Auth/Login/Logout";

function AvatarMenu(props: {
  handleMenu: (event: React.MouseEvent<HTMLElement>) => void;
}) {
  return (
    <IconButton onClick={props.handleMenu}>
      <AccountCircle fontSize="large" />
    </IconButton>
  );
}

export function UserOptions(props: {
  user: User | undefined;
  session: Boolean;
  setSession: React.Dispatch<React.SetStateAction<Boolean>>;
  setUser: React.Dispatch<React.SetStateAction<User | undefined>>;
}) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = React.useState<null | HTMLElement>(null);

  const handleClose = () => {
    setShowMenu(null);
  };
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setShowMenu(event.currentTarget);
  };

  const requestUserDelete = (user: User) => {
    let kind: string = "ARTIST";
    if (user.kind === "ClientCredentials") {
      kind = "CLIENT";
    }
    fetch("http://localhost:3000/User/DeleteAccount", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        Type: kind,
        Reason: "TEST",
      }),
      credentials: "include",
    })
      .then((res) => {
        if (res.status === 200) {
          // props.setUser(undefined);
          // props.setSession(false);
          window.location.href = "/logout";
          // navigate("/");
          // navigate(0);
        }
      })
      .catch((e) => {
        console.log(e);
        alert("Could not delete");
      });
  };

  const handleLogout = () => {
    window.location.href = "/logout";
  };

  const handleProfile = () => {
    navigate("/profile");
  };

  console.log(props.user, "HHHH");

  return (
    <div>
      {(props.user && <AvatarMenu handleMenu={handleMenu}></AvatarMenu>) || (
        <AvatarMenu handleMenu={handleClose}></AvatarMenu>
      )}

      <Menu
        id="menu-appbar"
        anchorEl={showMenu}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        keepMounted
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        open={Boolean(showMenu)}
        onClose={handleClose}
      >
        <MenuItem onClick={handleProfile}>Profile</MenuItem>
        <MenuItem onClick={handleLogout}>Log Out</MenuItem>
        <MenuItem onClick={() => requestUserDelete(props.user!)}>
          Delete Account
        </MenuItem>
      </Menu>
    </div>
  );
}
