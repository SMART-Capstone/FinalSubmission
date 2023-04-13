import { useState, useEffect } from "react";
import { ErrorMessage, PopupAlert, defaultPopupState } from "./PopupAlert";
import { useNavigate } from "react-router";

function ClientSetKeyPortal() {
  const [key, setKey] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [popup, setPopup] = useState<ErrorMessage>(defaultPopupState);
  const navigate = useNavigate();
  const onClickRequest = async () => {
    console.log(JSON.stringify({ Email: email, Key: key, Password: password }));
    const res = await fetch("http://localhost:3000/User/ClientResetKey", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": "true",
      },
      body: JSON.stringify({ Email: email, Code: key, Password: password }),
    });
    if (res.status === 200) {
      setPopup({
        ...popup,
        message: "Key reset successful.",
        error: false,
        success: true,
      });
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } else {
      setPopup({
        ...popup,
        message: "Key reset failed.",
        error: true,
        success: false,
      });
    }
  };
  return (
    <div>
      <h2>client key reset request form.</h2>
      <div className="portal df jcc aic fdc">
        <PopupAlert popup={popup} setPopup={setPopup} />
        <div className="cv-form">
          <div className="portal-entry jcsb df fdr">
            <label>Email</label>
            <input
              id="ck-email"
              type="email"
              onChange={(e: React.FormEvent<HTMLInputElement>) =>
                setEmail(e.currentTarget.value)
              }
            ></input>
          </div>
          <div className="portal-entry jcsb df fdr">
            <label>Current Password</label>
            <div className="tooltip">
              &emsp;&#x24D8;&emsp;
              <span className="tooltiptext">
                If you're changing your password for the first time, use the
                CODE in to your email.
              </span>
            </div>

            <input
              id="ck-passcode"
              type="password"
              onChange={(e: React.FormEvent<HTMLInputElement>) =>
                setKey(e.currentTarget.value)
              }
            ></input>
          </div>
          <div className="portal-entry jcsb df fdr">
            <label>New Password</label>
            <input
              id="ck-password"
              type="password"
              onChange={(e: React.FormEvent<HTMLInputElement>) =>
                setPassword(e.currentTarget.value)
              }
              pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*,.])[A-Za-z0-9@$!@#$%^&*,.]{8,}$"
            ></input>
          </div>
          <div className="jcc aic df">
            <button
              className="btn-w"
              type="submit"
              name="cv-submit"
              onClick={onClickRequest}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { ClientSetKeyPortal };
