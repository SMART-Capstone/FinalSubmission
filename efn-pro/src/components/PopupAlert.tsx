import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";

export interface ErrorMessage {
  error: Boolean;
  success: Boolean;
  message: String;
}

interface PopupProps {
  popup: ErrorMessage;
  setPopup: React.Dispatch<React.SetStateAction<ErrorMessage>>;
}

export const defaultPopupState: ErrorMessage = {
  error: false,
  success: false,
  message: "",
};

export function PopupAlert(props: PopupProps) {
  return (
    <div>
      {props.popup.error && (
        <Alert
          style={{
            borderColor: "white",
            borderWidth: "2px",
            borderStyle: "solid",
          }}
          onClose={() => {
            props.setPopup({ ...props.popup, error: false });
          }}
          severity="error"
        >
          <AlertTitle>Failure</AlertTitle>
          {props.popup.message}
        </Alert>
      )}
      {props.popup.success && (
        <Alert
          style={{
            borderColor: "white",
            borderWidth: "2px",
            borderStyle: "solid",
          }}
          onClose={() => {
            props.setPopup({ ...props.popup, success: false });
          }}
          severity="success"
        >
          <AlertTitle>Info</AlertTitle>
          {props.popup.message}
        </Alert>
      )}
    </div>
  );
}
