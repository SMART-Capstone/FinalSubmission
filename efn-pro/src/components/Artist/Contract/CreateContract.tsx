import { Component, ReactNode, useState } from "react";
import {
  justifyCenterContainerDivRow,
  justifyCenterContainerDivCol,
  loadingStyle,
} from "../../../Styles";
import { AmountTextfield } from "./Milestone";
import {
  Button,
  Select,
  MenuItem,
  SelectProps,
  InputLabel,
  InputLabelProps,
  FormControl,
} from "@mui/material";
import styled from "@mui/material/styles/styled";
import { blueGrey } from "@mui/material/colors";
import { Label } from "@mui/icons-material";
import { PopupWrapper } from "./Contract";
import { ErrorMessage, defaultPopupState } from "../../PopupAlert";
import { CircularProgress } from "@mui/material";

interface State {
  selectedNumber: number;
  isChecked: boolean;
  ContractInfo: {
    MiletonesCount: number;
    ActionTypes: string[];
    Amounts: string[];
    Currency: string;
    ClientId: string;
    ProjectName: string;
    WalletId: string;
  };
  error: ErrorMessage;
  loading: boolean;
}

const StyledSelect = styled(Select)<SelectProps>(({ theme }) => ({
  color: "white",
  styles: { color: "white" },
  "&:hover": {
    backgroundColor: blueGrey[900],
  },
  borderColor: theme.palette.getContrastText(blueGrey[50]),
  input: {
    color: "white",
    "-webkit-text-fill-color": "white",
  },
}));

export class CreateContract extends Component {
  state: State;
  constructor(props: any) {
    super(props);
    this.state = {
      selectedNumber: 0,
      isChecked: false,
      ContractInfo: {
        MiletonesCount: 0,
        ActionTypes: [],
        Amounts: [],
        Currency: "ETH",
        ClientId: "",
        WalletId: "",
        ProjectName: "",
      },
      loading: false,
      error: defaultPopupState,
    };
    this.handleNumberChange = this.handleNumberChange.bind(this);
  }

  handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ isChecked: event.target.checked });
  };

  handleNumberChange(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({ selectedNumber: parseInt(event.target.value) });
    const { ContractInfo } = this.state;
    ContractInfo.MiletonesCount = parseInt(event.target.value);
    this.setState({ ContractInfo });
  }

  handleProjectNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    console.log(event.target.value);
    const { ContractInfo } = this.state;
    ContractInfo.ProjectName = event.target.value;
    this.setState({ ContractInfo });
  }

  handleClientIdChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { ContractInfo } = this.state;
    ContractInfo.ClientId = event.target.value;
    this.setState({ ContractInfo });
  }

  handleWalletIdChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { ContractInfo } = this.state;
    ContractInfo.WalletId = event.target.value;
    this.setState({ ContractInfo });
  }

  handleCurrencyChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { ContractInfo } = this.state;
    ContractInfo.Currency = event.target.value;
    this.setState({ ContractInfo });
  }

  onCreateButtonClick = async () => {
    const amounts: string[] = [];
    const actionTypes: string[] = [];

    const { selectedNumber } = this.state;

    for (let i = 0; i < selectedNumber; i++) {
      const id = "M" + i + "Amount";
      const d = document.getElementById(id) as HTMLSelectElement;
      if (d) {
        amounts.push(d.value);
      }
    }

    for (let i = 0; i < selectedNumber; i++) {
      const id = "M" + i + "Action";
      const d = document.getElementById(id);
      if (d) {
        actionTypes.push(d.innerHTML.toUpperCase());
      }
    }

    const { ContractInfo } = this.state;
    ContractInfo.Amounts = amounts;
    ContractInfo.ActionTypes = actionTypes;
    this.setState({ ContractInfo });

    console.log(this.state.ContractInfo);

    if (this.state.isChecked) {
      this.onCreateContractforNewClient();
    } else {
      this.onCreateContractforExistingClient();
    }
  };

  onCreateContractforNewClient = async () => {
    try {
      this.setState({ loading: true });
      const clientRes = await fetch("http://localhost:3000/User/CreateClient", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        credentials: "include",
        body: JSON.stringify({
          WalletAddress: this.state.ContractInfo.WalletId,
          Email: this.state.ContractInfo.ClientId,
        }),
      });
      if (clientRes.status === 200) {
        await this.onCreateContractforExistingClient();
      }
    } catch (err) {
      console.log(err);
      this.setState({ error: { open: true, message: err } });
    }
    this.setState({ loading: false });
  };

  onCreateContractforExistingClient = async () => {
    this.setState({ loading: true });
    console.log(
      JSON.stringify({
        MiletonesCount: this.state.ContractInfo.MiletonesCount.toString(),
        ActionTypes: this.state.ContractInfo.ActionTypes,
        Amounts: this.state.ContractInfo.Amounts,
        Currency: this.state.ContractInfo.Currency,
        ClientId: this.state.ContractInfo.ClientId,
        ProjectName: this.state.ContractInfo.ProjectName,
      })
    );
    try {
      const res = await fetch("http://localhost:3000/Contract/CreateContract", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        credentials: "include",
        body: JSON.stringify({
          MiletonesCount: this.state.ContractInfo.MiletonesCount,
          ActionTypes: this.state.ContractInfo.ActionTypes,
          Amounts: this.state.ContractInfo.Amounts,
          Currency: this.state.ContractInfo.Currency,
          ClientId: this.state.ContractInfo.ClientId,
          ProjectName: this.state.ContractInfo.ProjectName,
        }),
      });
      if (res.status === 200) {
        console.log("Contract Created.");
        window.location.href = "/";
      } else {
        this.setState({
          error: {
            ...this.state.error,
            success: false,
            error: true,
            message: "Error Creating Contract",
          },
        });
      }
    } catch (err) {
      console.log(err);
    }
    this.setState({ loading: false });
  };

  render(): ReactNode {
    const { selectedNumber, loading } = this.state;
    const divs = [];
    for (let i = 0; i < selectedNumber; i++) {
      divs.push(
        <div key={i} style={justifyCenterContainerDivRow}>
          <div style={justifyCenterContainerDivCol}>
            <h2>Milestone {i}</h2>
            <AmountTextfield
              id={"M" + i + "Amount"}
              type="number"
              inputProps={{ min: 0 }}
              label={"M" + i + " Amount"}
            ></AmountTextfield>
          </div>
          <hr style={{ margin: "6vw", visibility: "hidden" }} />
          <div style={justifyCenterContainerDivCol}>
            <h2>Action Type {i}</h2>
            <FormControl variant="filled" style={{ width: "200px" }}>
              <InputLabel id={"action-label-" + i}>Action Type</InputLabel>
              <StyledSelect
                labelId={"action-label-" + i}
                defaultValue="DEPOSIT"
                id={"M" + i + "Action"}
              >
                <MenuItem value="DEPOSIT">Deposit</MenuItem>
                <MenuItem value="ROLYALTY">Royalty</MenuItem>
              </StyledSelect>
            </FormControl>
          </div>
        </div>
      );
    }
    const { error } = this.state;
    return (
      <div style={justifyCenterContainerDivCol}>
        <PopupWrapper
          setExternalPopup={(popup) => this.setState({ error: popup })}
          popupProps={error}
        />
        <h1>Create your contract</h1>
        <div style={justifyCenterContainerDivCol}>
          <h2>What would you like to call your contract?</h2>
          <AmountTextfield
            label="Contract Name"
            value={this.state.ContractInfo.ProjectName}
            onChange={this.handleProjectNameChange.bind(this)}
          ></AmountTextfield>
        </div>
        <div style={justifyCenterContainerDivCol}>
          <h2>What type of contract it is?</h2>
          <FormControl variant="filled" style={{ width: "200px" }}>
            <InputLabel id="c-type-label">Contract Type</InputLabel>
            <StyledSelect labelId="c-type-label" defaultValue="Photography">
              <MenuItem value="Photography">Photography</MenuItem>
              <MenuItem value="Illustration">Illustration</MenuItem>
              <MenuItem value="Urban Planning">Urban Planning</MenuItem>
            </StyledSelect>
          </FormControl>
        </div>
        <div style={justifyCenterContainerDivCol}>
          <h2>Write an overview of the Project</h2>
          <AmountTextfield label="Overview"></AmountTextfield>
        </div>
        <hr style={{ width: "60%", margin: "40px" }} />
        <div style={justifyCenterContainerDivRow}>
          <h2>Going to Create a New Client?</h2>
          <label>
            <input
              type="checkbox"
              checked={this.state.isChecked}
              onChange={this.handleCheckboxChange.bind(this)}
            />
            Check Here
          </label>
        </div>
        {this.state.isChecked ? (
          <div style={justifyCenterContainerDivCol}>
            <div style={justifyCenterContainerDivCol}>
              <h2>Create New Client</h2>
              <AmountTextfield
                label="New Client Email"
                onChange={this.handleClientIdChange.bind(this)}
              ></AmountTextfield>
            </div>
            <div style={justifyCenterContainerDivCol}>
              <h2>Create New Client</h2>
              <AmountTextfield
                label="New Client Wallet Address"
                onChange={this.handleWalletIdChange.bind(this)}
              ></AmountTextfield>
            </div>
          </div>
        ) : (
          <div style={justifyCenterContainerDivCol}>
            <h2>Enter Existing Client Information</h2>
            <AmountTextfield
              label="Client Email"
              type="email"
              onChange={this.handleClientIdChange.bind(this)}
            ></AmountTextfield>
          </div>
        )}
        <hr style={{ width: "60%", margin: "40px" }} />

        <div style={justifyCenterContainerDivCol}>
          <h2>How many milestones are there?</h2>
          <AmountTextfield
            label="Number of Milestones"
            type="number"
            style={{ width: "200px" }}
            inputProps={{ min: 0, max: 6 }}
            onChange={this.handleNumberChange.bind(this)}
          ></AmountTextfield>
        </div>
        <div style={justifyCenterContainerDivCol}>
          <h2>Currency</h2>
          <FormControl
            onChange={this.handleCurrencyChange.bind(this)}
            variant="filled"
            style={{ width: "200px" }}
          >
            <InputLabel id="currency-label">Currency</InputLabel>
            <StyledSelect labelId="currency-label" defaultValue="ETH">
              <MenuItem value={"ETH"}>ETH</MenuItem>
              <MenuItem value={"CAD"}>CAD</MenuItem>
              <MenuItem value={"USD"}>USD</MenuItem>
            </StyledSelect>
          </FormControl>
        </div>
        {divs}
        <hr style={{ width: "60%", margin: "40px" }} />
        <div style={{ margin: "40px 0 120px 0" }}>
          {loading ? (
            <CircularProgress />
          ) : (
            <Button
              variant="contained"
              onClick={this.onCreateButtonClick.bind(this)}
            >
              Create
            </Button>
          )}
        </div>
      </div>
    );
  }
}
