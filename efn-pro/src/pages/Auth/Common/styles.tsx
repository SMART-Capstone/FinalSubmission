import { alpha } from "@mui/material/styles";
import { createTheme } from "@mui/material/styles";

export const GREY_DARK = "#3B3B3B";
export const GREY_MIDDLE = "#AEAEAE";
export const GREY_LIGHT = "#C5C5C5";

export const leftMenu = { backgroundColor: alpha(GREY_DARK, 0.75) };

export const rightMenu = { backgroundColor: "#FFFFFF" };

export const lightTheme = createTheme({
  palette: { mode: "light" },
});

export const textFieldStyle = {
  input: { color: GREY_MIDDLE },
  "& .MuiInput-underline:before": { borderBottomColor: GREY_LIGHT },
  "& .MuiInput-underline:after": { borderBottomColor: GREY_LIGHT },
  border: 1,
  borderBottomColor: GREY_LIGHT,
};

export const routeButtonStyle = {
  whiteSpace: "nowrap",
  px: 6,
  display: "block",
  borderBottom: 2,
  borderRadius: 0,
  color: "primary",
  borderColor: "primary",
};
