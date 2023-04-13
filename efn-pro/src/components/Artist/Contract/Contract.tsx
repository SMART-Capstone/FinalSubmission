import { Component, ReactNode, useState } from "react";
import { FileObject, Milestone } from "./Milestone";
import { ContractType, IN_DISPUTE, IN_PROGRESS } from "./types/ContractTypes";
import { Buffer } from "buffer";
import {
  justifyCenterContainerDivCol,
  justifySbContainerDivRow,
  loadingStyle,
} from "../../../Styles";
import { ContractHistoryType } from "./types/ContractTypes";
import { Button } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { ColorButton } from "./Milestone";
import DeleteIcon from "@mui/icons-material/Delete";
import { io } from "socket.io-client";
import { FileUpload } from "./FileUpload";
import { yellow, red, blueGrey } from "@mui/material/colors";
import { ErrorMessage, PopupAlert, defaultPopupState } from "../../PopupAlert";

type Props = {
  contract: ContractType;
  setContractHistory: (nft: ContractHistoryType[]) => void;
};

type State = {
  contract: ContractType;
  loading: boolean;
  ProjectFiles: string[];
  error: ErrorMessage;
};

type ButtonProps = {
  contractId: string;
  setLoading: (loading: boolean) => void;
  setContractHistory: (nft: ContractHistoryType[]) => void;
};

type WrapperProps = {
  popupProps: ErrorMessage;
  setExternalPopup: (popup: ErrorMessage) => void;
};

function GetHistoryButton({
  contractId,
  setLoading,
  setContractHistory,
}: ButtonProps) {
  const navigate = useNavigate();
  const onGetContractHistory = async () => {
    setLoading(true);
    const res = await fetch(
      "http://localhost:3000/Contract/GetContractHistory",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          ContractId: contractId,
        }),
        credentials: "include",
      }
    );
    if (res.status === 200) {
      const body = await res.json();
      setContractHistory(JSON.parse(body.payloadString));
      navigate("/contractHistory");
    } else {
    }
    setLoading(false);
  };

  return (
    <Button
      style={{ padding: "10px", color: "white" }}
      variant="outlined"
      onClick={onGetContractHistory}
    >
      View History
    </Button>
  );
}

export function PopupWrapper({ popupProps, setExternalPopup }: WrapperProps) {
  const [popup, setPopup] = useState<ErrorMessage>(defaultPopupState);

  return (
    <PopupAlert
      popup={popupProps}
      setPopup={() => {
        setExternalPopup(popup);
        return setPopup;
      }}
    />
  );
}

export class Contract extends Component<Props> {
  state: State;
  mounted = false;
  socket: any;
  constructor(props: Props) {
    super(props);
    this.state = {
      contract: props.contract,
      loading: false,
      ProjectFiles: [],
      error: defaultPopupState,
    };
    this.mounted = true;
  }

  componentWillUnmount() {
    this.mounted = false;
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  mintNft = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("minting");
    this.mounted && this.setState({ loading: true });
    const file = event.target.files?.[0];
    if (!file) {
      return null;
    }
    const reader = new FileReader();

    reader.readAsDataURL(file);
    reader.onload = async () => {
      console.log(reader.result, 54);

      const newFile = {
        fileBase64Data: reader.result as string,
        fileName: file.name,
        fileType: file.type,
      };
      const res = await fetch("http://localhost:3000/NFT/MintNFT", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          ContractId: this.props.contract.ContractId,
          DisplayAsset: newFile,
        }),
        credentials: "include",
      });
      const { error } = this.state;

      if (res.status === 200) {
        const { contract } = this.state;
        contract.Status = "MINTED";
        this.mounted && this.setState({ contract });
        this.mounted &&
          this.setState({
            error: {
              ...error,
              success: true,
              error: false,
              message: "Nft minted",
            },
          });
      } else {
        this.mounted &&
          this.setState({
            error: {
              ...error,
              success: false,
              error: true,
              message: "Nft failed to mint",
            },
          });
      }
      this.mounted && this.setState({ loading: false });
    };
  };
  componentDidMount() {
    const { ProjectFiles } = this.props.contract;
    this.mounted && this.setState({ ProjectFiles: ProjectFiles || [] });
    if (!this.socket) {
      const socket = io("ws://localhost:3000", {
        reconnectionDelayMax: 10000,
        withCredentials: true,
      });
      this.socket = socket;
    }
    console.log(this.socket, 3289);
  }

  addFileToMilestone = (file: string, milestoneNumber: number) => {
    const { contract } = this.state;
    const oldFileKeys: string[] = JSON.parse(
      contract.Milestones[milestoneNumber].FileKeys
    );
    oldFileKeys.push(file);
    contract.Milestones[milestoneNumber].FileKeys = JSON.stringify(oldFileKeys);
    this.mounted && this.setState({ contract: { ...contract } });
  };

  deleteFileFromMilestone = (file: string, milestoneNumber: number) => {
    const { contract } = this.state;
    const oldFileKeys: string[] = JSON.parse(
      contract.Milestones[milestoneNumber].FileKeys
    );
    const index = oldFileKeys.indexOf(file);
    if (index > -1) {
      oldFileKeys.splice(index, 1);
    }
    contract.Milestones[milestoneNumber].FileKeys = JSON.stringify(oldFileKeys);
    this.mounted && this.setState({ contract: { ...contract } });
  };

  addFileToProjectFiles = (file: FileObject) => {
    const { ProjectFiles } = this.state;
    console.log("pushing", file.fileName);
    ProjectFiles.push(file.fileName);
    this.mounted && this.setState({ ProjectFiles: [...ProjectFiles] });
  };

  removeFileFromProjectFiles = (file: string) => {
    const { ProjectFiles } = this.state;
    const index = ProjectFiles.indexOf(file);
    if (index > -1) {
      ProjectFiles.splice(index, 1);
    }
    this.mounted && this.setState({ ProjectFiles: [...ProjectFiles] });
  };

  onAdvanceMilestone = async (fileObjects: FileObject[]) => {
    this.mounted && this.setState({ loading: true });
    const res = await fetch(
      "http://localhost:3000/Milestone/AdvanceMilestone",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          ContractId: this.props.contract.ContractId,
          FileObjects: fileObjects,
        }),
        credentials: "include",
      }
    );
    const { contract, error } = this.state;

    if (res.status === 200) {
      this.mounted &&
        this.setState({
          error: {
            ...error,
            success: true,
            error: false,
            message: "Milestone advanced",
          },
        });
      contract.Milestones[contract.CurrentMilestone].Status = "COMPLETED";
      contract.CurrentMilestone++;
      if (contract.Milestones[contract.CurrentMilestone]) {
        contract.Milestones[contract.CurrentMilestone].Status = "INPROGRESS";
      } else {
        contract.Status = "COMPLETED";
      }
      this.mounted && this.setState({ contract: { ...contract } });
    } else {
      this.mounted &&
        this.setState({
          error: {
            ...error,
            success: false,
            error: true,
            message: "Milestone failed to advance",
          },
        });
      console.log(res);
    }
    this.mounted && this.setState({ loading: false });
  };

  onCreateDispute = async () => {
    this.mounted && this.setState({ loading: true });
    const res = await fetch("http://localhost:3000/Dispute/CreateDispute", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        ContractId: this.props.contract.ContractId,
      }),
      credentials: "include",
    });
    if (res.status === 200) {
      const { contract, error } = this.state;
      this.mounted &&
        this.setState({
          error: {
            ...error,
            success: true,
            error: false,
            message: "Dispute created",
          },
        });
      contract.Milestones[contract.CurrentMilestone].Status = IN_DISPUTE;
      contract.Milestones[contract.CurrentMilestone].Status = IN_DISPUTE;
      const arrayBuffer = await res.arrayBuffer();
      const bufferData = Buffer.from(arrayBuffer);
      const dispute = JSON.parse(bufferData.toString());
      console.log(dispute);
    } else {
      const { error } = this.state;
      this.mounted &&
        this.setState({
          error: {
            ...error,
            success: true,
            error: false,
            message: "Error creating dispute",
          },
        });
      console.log(res);
    }
    this.mounted && this.setState({ loading: false });
  };

  onResolveDispute = async () => {
    this.mounted && this.setState({ loading: true });
    const res = await fetch("http://localhost:3000/Dispute/ResolveDispute", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        ContractId: this.props.contract.ContractId,
      }),
      credentials: "include",
    });
    const { error } = this.state;

    if (res.status === 200) {
      const { contract } = this.state;
      this.mounted &&
        this.setState({
          error: {
            ...error,
            error: false,
            success: true,
            message: "Dispute resolved",
          },
        });
      contract.Milestones[contract.CurrentMilestone].Status = IN_PROGRESS;
      contract.Status = IN_PROGRESS;
    } else {
      this.mounted &&
        this.setState({
          error: {
            ...error,
            error: true,
            message: "Unable to resolve dispute",
          },
        });
      console.log(res);
    }
    this.mounted && this.setState({ loading: false });
  };

  render(): ReactNode {
    const { contract, loading, error, ProjectFiles } = this.state;
    console.log(ProjectFiles, 3435);
    return (
      <div style={{ ...justifyCenterContainerDivCol, alignItems: "center" }}>
        {loading && (
          <div style={loadingStyle}>
            <h1>Updating blockchain...</h1>
          </div>
        )}
        <PopupWrapper
          setExternalPopup={(popup) =>
            this.mounted && this.setState({ error: popup })
          }
          popupProps={error}
        />
        <h2>{contract.ProjectName}</h2>
        <p>Contract Id: {contract.ContractId}</p>
        <p>Client: {contract.ClientId}</p>
        <div style={justifySbContainerDivRow}>
          <p style={{ padding: "10px" }}>Status: {contract.Status}</p>
          <GetHistoryButton
            contractId={contract.ContractId}
            setLoading={(loading) => {
              this.mounted && this.setState({ loading });
            }}
            setContractHistory={this.props.setContractHistory}
          />
        </div>
        {this.state.contract.Milestones.map((milestone, index) => (
          <Milestone
            socket={this.socket}
            index={index}
            key={milestone.MilestoneId}
            milestone={milestone}
            onAdvanceMilestone={this.onAdvanceMilestone}
            onCreateDispute={this.onCreateDispute}
            onResolveDispute={this.onResolveDispute}
            addFileToMilestone={this.addFileToMilestone}
            deleteFileFromMilestone={this.deleteFileFromMilestone}
          ></Milestone>
        ))}
        {contract.Status === "COMPLETED" && (
          <div
            style={{
              ...justifySbContainerDivRow,
              flexGrow: "1",
              flexBasis: "0",
              width: "100%",
              maxWidth: "1000px",
              padding: "10px",
              paddingBottom: "20px",
              flexDirection: "column",
            }}
          >
            {this.socket && (
              <FileUpload
                ContractId={contract.ContractId}
                addFiles={this.addFileToProjectFiles}
                deleteFile={this.removeFileFromProjectFiles}
                socket={this.socket}
                files={ProjectFiles}
              />
            )}
            <Button
              style={{
                color: "black",
                backgroundColor: yellow[800],
                marginTop: "30px",
                width: "40%",
                maxWidth: "200px",
                height: "55px",
              }}
              variant="contained"
              color="primary"
              component="label"
            >
              <input
                title="Select an image to use as the nft display."
                accept="image/png, image/gif, image/jpeg"
                aria-label="Select an image to use as the nft display."
                type="file"
                hidden
                onChange={this.mintNft}
              />
              Mint Nft
            </Button>
          </div>
        )}
      </div>
    );
  }
}
