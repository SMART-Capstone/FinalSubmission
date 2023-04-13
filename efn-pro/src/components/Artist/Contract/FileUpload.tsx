import { Component, ReactNode } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import {
  justifyCenterContainerDivCol,
  justifyCenterContainerDivRow,
} from "../../../Styles";
import { red } from "@mui/material/colors";
import { FileObject } from "./Milestone";

type Props = {
  files: string[];
  ContractId: string;
  addFiles: (file: FileObject) => void;
  deleteFile: (file: string) => void;
  socket: any;
};

export interface FileLoading {
  name: string;
  progress: number;
}

type State = {
  loadingFiles: { [name: string]: number };
  deletingFiles: { [name: string]: boolean };
};

export class FileUpload extends Component<Props> {
  mounted = false;
  state: State;
  constructor(props: Props) {
    super(props);
    this.state = {
      loadingFiles: {},
      deletingFiles: {},
    };
    this.mounted = true;
  }

  componentDidMount(): void {
    console.log(this.props.socket, 872);
    this.props.socket.on("fileUploadProgress", (data: any) => {
      try {
        const { loadingFiles } = this.state;
        console.log(4365);
        console.log("here", loadingFiles[data.fileName], 5467);
        loadingFiles[data.fileName] = data.progress;
        this.mounted && this.setState({ loadingFiles: { ...loadingFiles } });
      } catch (e) {
        console.log(e);
      }
    });
  }

  handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const { loadingFiles } = this.state;
    if (!file) {
      return null;
    }
    const formData = new FormData();
    loadingFiles[file.name] = 0;
    this.mounted && this.setState({ loadingFiles });
    formData.append("file", file, file.name);
    formData.append("ContractId", new Blob(undefined), this.props.ContractId);
    fetch("http://localhost:3000/upload", {
      method: "POST",
      body: formData,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": "true",
      },
      credentials: "include",
    })
      .then(async (res) => {
        const { loadingFiles } = this.state;
        delete loadingFiles[file.name];
        this.mounted && this.setState({ loadingFiles });
        if (res.status === 200) {
          console.log("success", file.name);
          const body = await res.json();
          console.log(body, res.body);
          const keys = JSON.parse(body.message);
          console.log("here3", keys, 43);
          this.props.addFiles({
            fileName: keys[0].key,
            fileBase64Data: "",
            fileType: "",
          });
        }
      })
      .catch((e) => {
        const { loadingFiles } = this.state;
        delete loadingFiles[file.name];
        console.log(e);
        this.mounted && this.setState({ loadingFiles });
      });
  };

  handleFileDelete = async (name: string) => {
    const { deletingFiles } = this.state;
    deletingFiles[name] = true;
    this.mounted && this.setState({ deletingFiles });
    fetch("http://localhost:3000/delete", {
      method: "POST",
      body: JSON.stringify({
        FileKey: name,
        ContractId: this.props.ContractId,
      }),
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
        Accept: "application/json",
        "Access-Control-Allow-Credentials": "true",
      },
      credentials: "include",
    })
      .then((res) => {
        const { deletingFiles } = this.state;
        delete deletingFiles[name];
        this.mounted && this.setState({ deletingFiles });
        if (res.status === 200) {
          this.props.deleteFile(name);
        }
      })
      .catch((e) => {
        const { deletingFiles } = this.state;
        delete deletingFiles[name];
        this.mounted && this.setState({ deletingFiles });
      });
  };

  render(): ReactNode {
    const { files } = this.props;
    const { deletingFiles } = this.state;
    return (
      <div
        style={{
          ...justifyCenterContainerDivRow,
          flexGrow: "1",
          justifyContent: "space-evenly",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
          {files &&
            files.map((file, index) => {
              return (
                <div
                  style={{
                    ...justifyCenterContainerDivRow,
                    justifyContent: "start",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <p>File Name:</p>
                    <div style={justifyCenterContainerDivRow}>
                      <p
                        style={{
                          wordBreak: "break-all",
                          whiteSpace: "normal",
                          margin: 0,
                        }}
                      >
                        {file}
                      </p>
                      {!deletingFiles.hasOwnProperty(file) ? (
                        <DeleteIcon
                          style={{
                            color: red[500],
                            paddingRight: "10px",
                            cursor: "pointer",
                          }}
                          fontSize="large"
                          onClick={() => {
                            this.handleFileDelete(file);
                          }}
                        />
                      ) : (
                        <CircularProgress />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          {Object.keys(this.state.loadingFiles).map((fileName) => (
            <div style={justifyCenterContainerDivRow}>
              <p style={{ textAlign: "start", paddingRight: "10px" }}>
                {fileName}
              </p>
              {this.state.loadingFiles[fileName] !== 0 ? (
                <p> {Math.floor(this.state.loadingFiles[fileName] * 100)} %</p>
              ) : (
                <CircularProgress />
              )}
            </div>
          ))}
        </div>
        <Button
          variant="outlined"
          component="label"
          style={{
            marginRight: "10px",
            textAlign: "center",
            color: "white",
            alignSelf: "end",
          }}
        >
          Upload File
          <input type="file" hidden onChange={this.handleFileUpload} />
        </Button>
      </div>
    );
  }
}
