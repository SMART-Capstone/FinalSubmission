import { Grid, Link, TextField, Tooltip, Typography } from "@mui/material";
import { GREY_DARK, GREY_LIGHT, textFieldStyle } from "../Common/styles";
interface RegisterFormProps {
  setEmail: React.Dispatch<React.SetStateAction<String>>;
  setPw: React.Dispatch<React.SetStateAction<String>>;
}

export default function RegisterForm(props: RegisterFormProps) {
  return (
    <Grid
      container
      direction={"column"}
      alignContent="center"
      justifySelf={"center"}
    >
      <Grid item xs={4} padding={1} width={"inherit"}>
        <TextField
          sx={textFieldStyle}
          InputLabelProps={{ style: { color: GREY_LIGHT } }}
          label="Email address"
          type="email"
          fullWidth={true}
          variant="standard"
          onChange={(e) => props.setEmail(e.target.value)}
        />
      </Grid>

      <Grid item xs={4} padding={1} width={"inherit"}>
        <TextField
          sx={textFieldStyle}
          InputLabelProps={{ style: { color: GREY_LIGHT } }}
          label="Full name"
          type={"text"}
          fullWidth={true}
          variant="standard"
        />
      </Grid>

      <Grid item xs={4} padding={1} width={"inherit"}>
        <Tooltip
          title={
            "Password Requirements: One uppercase, one lowercase, one special character, 8+ length"
          }
        >
          <TextField
            sx={textFieldStyle}
            InputLabelProps={{ style: { color: GREY_LIGHT } }}
            label="Password"
            type="password"
            fullWidth={true}
            variant="standard"
            onChange={(e) => props.setPw(e.target.value)}
          />
        </Tooltip>
      </Grid>

      <Grid item xs={4} padding={1}>
        <Grid container justifyContent={"center"}>
          <Typography color={GREY_DARK} fontSize={"12px"}>
            I agree to the
            <Link href="#" underline="none">
              {" privacy policy "}
            </Link>
            and
            <Link href="#" underline="none">
              {" terms of service"}
            </Link>
            .
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  );
}
