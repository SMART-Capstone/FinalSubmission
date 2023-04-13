import { Component, Fragment, ReactNode } from "react";
import { Buffer } from "buffer";
import { NftFileIncludeType, NftType } from "./types/Nft";
import {
  justifyCenterContainerDivCol,
  justifyCenterContainerDivRow,
  loadingStyle,
} from "../Styles";
import { ColorButton } from "../components/Artist/Contract/Milestone";
import { blueGrey } from "@mui/material/colors";

type Props = {
  nft: NftType;
};

type State = {
  nftWithFiles: NftFileIncludeType | null;
  loading: boolean;
  nftFileArray: string[];
};

export class NftView extends Component<Props> {
  state: State;
  mounted = false;
  constructor(props: Props) {
    super(props);
    this.state = {
      nftWithFiles: null,
      loading: false,
      nftFileArray: JSON.parse(props.nft.FileKeys),
    };
    console.log("herte2");
    this.mounted = true;
  }
  componentWillUnmount() {
    console.log("unmounting");
    this.mounted = false;
  }

  async downloadFile() {
    var req = new XMLHttpRequest();
    req.open("POST", "http://localhost:3000/NFT/DownloadZip", true);
    req.responseType = "blob";
    const { NftId } = this.props.nft;
    req.onload = function (event) {
      console.log("Loaded");
      var blob = req.response;
      var link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = NftId + ".zip";
      link.click();
    };
    req.onerror = function (event) {
      console.log("Error");
    };
    req.onprogress = function (event) {
      console.log("Progress");
    };
    req.setRequestHeader("Content-Type", "application/json");
    req.setRequestHeader("Accept", "application/zip");
    req.withCredentials = true;
    req.setRequestHeader("Access-Control-Allow-Origin", "*");
    req.send(
      JSON.stringify({
        nftId: NftId,
      })
    );
  }

  async componentDidMount() {
    this.mounted && this.setState({ loading: true });
    try {
      const res = await fetch(
        `http://localhost:3000/Nft/GetNFTFileDownloadUrls`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          credentials: "include",
          body: JSON.stringify({
            nftId: this.props.nft.NftId,
          }),
        }
      );
      const nftWithFiles = await res.json();
      console.log("here", this.mounted, JSON.parse(nftWithFiles.payloadString));
      this.mounted &&
        this.setState({
          nftWithFiles: JSON.parse(nftWithFiles.payloadString),
          loading: false,
        });
    } catch (e) {
      console.log(e);
      this.mounted && this.setState({ loading: false });
    }
  }

  render() {
    const { nftWithFiles, loading, nftFileArray } = this.state;
    const { nft } = this.props;
    console.log(nftWithFiles, loading);
    return (
      <div style={justifyCenterContainerDivCol}>
        {loading && <div style={loadingStyle}>Reading from blockchain...</div>}
        <h2>NFT Metadata</h2>
        <p
          style={{ wordWrap: "break-word", width: "80%", textAlign: "center" }}
        >
          NFT Id: {nft.NftId}
        </p>
        <p>Project Name: {nft.ProjectName}</p>
        <p>Mint Date: {new Date(nft.TimeStamp).toUTCString()}</p>
        <p>Files:</p>
        <div style={justifyCenterContainerDivCol}>
          {nftFileArray.map((fileKey, index) => {
            return (
              <Fragment key={index}>
                <a
                  style={{ textAlign: "center", color: blueGrey[400] }}
                  href={nftWithFiles?.FileUrls[index]}
                >
                  {fileKey}
                </a>
                <br />
              </Fragment>
            );
          })}
        </div>
        <ColorButton onClick={this.downloadFile.bind(this)}>
          Download Nft as Zip
        </ColorButton>
      </div>
    );
  }
}
