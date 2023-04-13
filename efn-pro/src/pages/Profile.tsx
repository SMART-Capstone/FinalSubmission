import { Button } from "@mui/material";
import { useState, useEffect, Component, ReactNode } from "react";
import {
  justifyCenterContainerDivCol,
  justifySpaceBetweenContainerDiv,
} from "../Styles";
import { User } from "../types/User";

type Props = {
  user: User;
};
export class Profile extends Component<Props> {
  downloadObjectAsJson(exportObj: Object, exportName: string) {
    var dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(exportObj));
    var downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }
  render(): ReactNode {
    const { user } = this.props;
    return (
      <div style={justifyCenterContainerDivCol}>
        <h1>Profile</h1>
        <div style={justifyCenterContainerDivCol}>
          <h2>Username</h2>
          <p>{user.username}</p>
        </div>
        <hr style={{ width: "60%", margin: "40px" }} />
        <Button
          variant="contained"
          onClick={() => {
            const { credentials } = user;
            credentials.privateKey = credentials.privateKey.replace(
              /(\r\n|\n|\r)/gm,
              ""
            );
            credentials.certificate = credentials.certificate.replace(
              /(\r\n|\n|\r)/gm,
              ""
            );
            this.downloadObjectAsJson(credentials, "credentials");
          }}
        >
          Download Credentials
        </Button>
      </div>
    );
  }
}
