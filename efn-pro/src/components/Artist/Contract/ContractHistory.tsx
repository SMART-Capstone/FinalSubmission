import { Component, ReactNode } from "react";
import { ContractHistoryType } from "./types/ContractTypes";
import { justifyCenterContainerDivCol } from "../../../Styles";
import { yellow } from "@mui/material/colors";

type Props = {
  contractHistory: ContractHistoryType[];
};

type State = {
  loading: boolean;
};

export class ContractHistory extends Component<Props> {
  render(): ReactNode {
    const { contractHistory } = this.props;
    const changeStyle = {
      color: yellow[700],
    };
    console.log(contractHistory);
    return (
      <div>
        {contractHistory.map((contractHistoryInst, index) => {
          return (
            <div style={justifyCenterContainerDivCol}>
              <h2>Transaction #{contractHistory.length - 1 - index}</h2>
              <p>Transaction Id: {contractHistoryInst.txId}</p>
              <p>
                Timestamp:{" "}
                {new Date(contractHistoryInst.timestamp * 1000).toISOString()}
              </p>
              <p
                style={
                  index < contractHistory.length - 1 &&
                  contractHistoryInst.value.CurrentMilestone !==
                    contractHistory[index + 1].value.CurrentMilestone
                    ? changeStyle
                    : { color: "white" }
                }
              >
                Current Milestone: {contractHistoryInst.value.CurrentMilestone}
              </p>
              <p
                style={
                  index < contractHistory.length - 1 &&
                  contractHistoryInst.value.Status !==
                    contractHistory[index + 1].value.Status
                    ? changeStyle
                    : { color: "white" }
                }
              >
                Status: {contractHistoryInst.value.Status}
              </p>
              <p
                style={
                  index < contractHistory.length - 1 &&
                  contractHistoryInst.value.DisputeIds !==
                    contractHistory[index + 1].value.DisputeIds
                    ? changeStyle
                    : { color: "white" }
                }
              >
                DisputeIds: {contractHistoryInst.value.DisputeIds}
              </p>
              <p
                style={
                  index < contractHistory.length - 1 &&
                  contractHistoryInst.value.ArtistId !==
                    contractHistory[index + 1].value.ArtistId
                    ? changeStyle
                    : { color: "white" }
                }
              >
                ArtistId: {contractHistoryInst.value.ArtistId}
              </p>
              <p
                style={
                  index < contractHistory.length - 1 &&
                  contractHistoryInst.value.ClientId !==
                    contractHistory[index + 1].value.ClientId
                    ? changeStyle
                    : { color: "white" }
                }
              >
                ClientId: {contractHistoryInst.value.ClientId}
              </p>
              <p
                style={
                  index < contractHistory.length - 1 &&
                  contractHistoryInst.value.ContractId !==
                    contractHistory[index + 1].value.ContractId
                    ? changeStyle
                    : { color: "white" }
                }
              >
                ContractId: {contractHistoryInst.value.ContractId}
              </p>
              <p
                style={
                  index < contractHistory.length - 1 &&
                  contractHistoryInst.value.NftId !==
                    contractHistory[index + 1].value.NftId
                    ? changeStyle
                    : { color: "white" }
                }
              >
                NftId: {contractHistoryInst.value.NftId}
              </p>
              <hr style={{ width: "60%" }} />
            </div>
          );
        })}
      </div>
    );
  }
}
