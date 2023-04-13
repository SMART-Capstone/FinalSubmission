import Grid from "@mui/material/Grid";
import { background } from "../components/Styles";

export function PublicHome() {
  return (
    <Grid style={background} container direction="column" alignItems="center">
      <Grid item className="flyer">
        The Best Contract Management & Fulfillment Platform for Artists
      </Grid>
    </Grid>
  );
}
