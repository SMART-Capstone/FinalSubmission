import { Button, Grid } from "@mui/material";
import { useNavigate } from "react-router-dom";

export function ContractHeader() {
  const navigate = useNavigate();
  const navToCreateContract = async () => navigate("/createContract");
  return (
    <Grid container alignItems={"center"} justifyContent={"space-between"} padding={2}>
      <Grid item>
        <h2>Contracts</h2>
      </Grid>

      <Grid item>
        <Button
          variant="outlined"
          color="warning"
          onClick={navToCreateContract}
          style={{ marginRight: "12px", color: "white" }}
        >
          Create Contract
        </Button>
      </Grid>
    </Grid>
  );
}
