import { useEffect } from "react";
import React from "react";
import { useNavigate } from "react-router-dom";

import { PublicHome } from "../../PublicHome";
import {
  PopupAlert,
  ErrorMessage,
  defaultPopupState,
} from "../../../components/PopupAlert";
import { SessionTracker } from "../Common/session";
import { User } from "../../../types/User";

export function Logout(props: {
  session: SessionTracker;
  setUser: React.Dispatch<React.SetStateAction<User | undefined>>;
  user: User | undefined;
}) {
  const navigate = useNavigate();

  const [popup, setPopup] = React.useState<ErrorMessage>(defaultPopupState);

  useEffect(() => {
    requestLogout()
      .then(async () => {
        props.setUser(undefined);
        props.session.setSession(false);
        navigate(0);
        navigate("/login");
        navigate(0);
      })
      .catch(() =>
        setPopup({ ...popup, error: true, message: "Unable to log out" })
      );
  }, [popup, props]);

  const requestLogout = async () => {
    await fetch("http://localhost:3000/logout", {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      credentials: "include",
    });
  };

  return (
    <div>
      <PublicHome />
      <PopupAlert popup={popup} setPopup={setPopup}></PopupAlert>
    </div>
  );
}
