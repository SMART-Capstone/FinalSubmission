import { Component, ReactNode, Fragment } from "react";
import { IN_DISPUTE, MilestoneType } from "./types/ContractTypes";
import TextField, { TextFieldProps } from "@mui/material/TextField";
import DeleteIcon from "@mui/icons-material/Delete";
import Button, { ButtonProps } from "@mui/material/Button";
import styled from "@mui/material/styles/styled";
import { yellow, red, blueGrey } from "@mui/material/colors";
import {
  justifyCenterContainerDivCol,
  justifyCenterContainerDivRow,
} from "../../../Styles";
import { FileUpload } from "./FileUpload";

type Props = {
  milestone: MilestoneType;
  index: number;
  onAdvanceMilestone: (fileObjects: FileObject[]) => Promise<void>;
  onCreateDispute: () => Promise<void>;
  onResolveDispute: () => Promise<void>;
  addFileToMilestone: (fileObjects: string, milestoneNumber: number) => void;
  deleteFileFromMilestone: (
    fileObjects: string,
    milestoneNumber: number
  ) => void;
  socket: any;
};

export const ColorButton = styled(Button)<ButtonProps>(({ theme }) => ({
  color: theme.palette.getContrastText(yellow[800]),
  backgroundColor: yellow[800],
  "&:hover": {
    backgroundColor: yellow[900],
  },
}));
const DisputeButton = styled(Button)<ButtonProps>(({ theme }) => ({
  color: theme.palette.getContrastText(red[500]),
  backgroundColor: red[500],
  "&:hover": {
    backgroundColor: red[600],
  },
}));

export const AmountTextfield = styled(TextField)<TextFieldProps>(
  ({ theme }) => ({
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
  })
);

export interface FileObject {
  fileBase64Data: string;
  fileName: string;
  fileType: string;
}

type State = {
  files: FileObject[];
};

export class Milestone extends Component<Props, State> {
  mounted = false;
  state: State;
  constructor(props: Props) {
    super(props);
    this.state = {
      files: [],
    };
    this.mounted = true;
  }

  onFileAdded = (fileObject: FileObject): void => {
    const { files } = this.state;
    this.props.addFileToMilestone(fileObject.fileName, this.props.index);
    files.push(fileObject);
    console.log(files, 546);
    this.mounted && this.setState({ files: [...files] });
  };

  onFileDeleted = (fileName: string): void => {
    const { files } = this.state;
    this.props.deleteFileFromMilestone(fileName, this.props.index);
    const index = files.findIndex((file) => file.fileName === fileName);
    files.splice(index, 1);
    this.mounted && this.setState({ files: [...files] });
  };

  componentDidMount(): void {
    this.mounted &&
      this.setState({
        files: JSON.parse(this.props.milestone.FileKeys).map(
          (fileKey: string): FileObject => {
            return {
              fileName: fileKey,
              fileType: "image/png",
              fileBase64Data: "",
            };
          }
        ),
      });
  }

  componentWillUnmount(): void {
    this.mounted = false;
  }

  render(): ReactNode {
    console.log(this.props.socket, 4356);
    const { milestone } = this.props;
    const files =
      milestone.Status === "INPROGRESS"
        ? this.state.files
        : JSON.parse(milestone.FileKeys).map((fileKey: string): FileObject => {
            return {
              fileName: fileKey,
              fileType: "image/png",
              fileBase64Data: "",
            };
          });
    console.log(this.state.files);
    return (
      <div
        style={{
          marginBottom: "10px",
          padding: "10px",
          maxWidth: "1000px",
          display: "flex",
          flexDirection: "column",
          flexBasis: 0,
          flexGrow: 1,
          width: "100%",
        }}
      >
        <h3>Milestone {this.props.index}</h3>
        <div className="milestone-details">
          <p>Status: {milestone.Status}</p>
          <Fragment>
            {milestone.StartDate && (
              <p>Start date: {new Date(milestone.StartDate).toUTCString()}</p>
            )}
          </Fragment>
          <Fragment>
            {milestone.EndDate && (
              <p>End date: {new Date(milestone.EndDate).toUTCString()}</p>
            )}
          </Fragment>
          <AmountTextfield
            label={milestone.ActionType}
            variant="outlined"
            disabled
            InputProps={{
              inputProps: {
                style: {
                  color: "#fff",
                  WebkitTextFillColor: "white",
                  borderColor: "white",
                },
              },
            }}
            InputLabelProps={{
              style: {
                color: "white",
              },
            }}
            value={`${milestone.Amount}`}
            sx={{
              "& .MuiInputBase-root.Mui-disabled": {
                "& > fieldset": {
                  borderColor: "white",
                },
              },
            }}
          ></AmountTextfield>
          <div
            style={{
              flexDirection: "row",
              display: "flex",
              flex: "9 1",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "5px",
            }}
          >
            {milestone.Status !== "INPROGRESS" ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                }}
              >
                <p>Files:</p>
                {files.map((file: FileObject, index: number) => (
                  <div style={justifyCenterContainerDivRow}>
                    <p style={{ textAlign: "end" }}>{file.fileName}</p>
                  </div>
                ))}
              </div>
            ) : (
              this.props.socket && (
                <FileUpload
                  files={this.state.files.map((el) => el.fileName)}
                  ContractId={this.props.milestone.ContractId}
                  socket={this.props.socket}
                  addFiles={this.onFileAdded}
                  deleteFile={this.onFileDeleted}
                />
              )
            )}
          </div>
          <Fragment>
            {milestone.Status === "INPROGRESS" ? (
              <div
                style={{
                  alignItems: "center",
                  justifyContent: "space-evenly",
                  display: "flex",
                  paddingTop: "30px",
                  paddingBottom: "10px",
                }}
              >
                <ColorButton
                  variant="contained"
                  onClick={() => {
                    this.props.onAdvanceMilestone(this.state.files);
                  }}
                >
                  Advance Milestone
                </ColorButton>
                <DisputeButton
                  onClick={() => {
                    this.props.onCreateDispute();
                  }}
                  variant="contained"
                >
                  Dispute Milestone
                </DisputeButton>
              </div>
            ) : (
              milestone.Status === IN_DISPUTE && (
                <div
                  style={{
                    alignItems: "center",
                    justifyContent: "space-evenly",
                    display: "flex",
                    paddingTop: "30px",
                    paddingBottom: "10px",
                  }}
                >
                  <ColorButton
                    variant="contained"
                    onClick={() => {
                      this.props.onResolveDispute();
                    }}
                  >
                    Resolve dispute
                  </ColorButton>
                </div>
              )
            )}
          </Fragment>
        </div>
      </div>
    );
  }
}
