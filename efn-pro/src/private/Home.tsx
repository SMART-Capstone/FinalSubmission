import { useNavigate } from "react-router-dom";
import { Buffer } from "buffer";
import { ListObjects } from "../components/ObjectList";
import { useContext, useEffect, useState } from "react";
import { ContractType } from "../components/Artist/Contract/types/ContractTypes";
import { ContractContext } from "../App";
import { CircularProgress, Grid } from "@mui/material";
import { ContractHeader } from "./ContractHeader";

interface Props {
  updateSelectedContract: (contract: ContractType) => void;
}

export function Home({ updateSelectedContract }: Props) {
  const [loading, setLoading] = useState<boolean>(false);
  const { contracts, setContracts } = useContext(ContractContext);

  const navigate = useNavigate();

  const onContractPress = (contract: any) => {
    console.log(contract, 432);
    updateSelectedContract(contract);
    navigate("/contractView");
  };

  useEffect(() => {
    const getContracts = async () => {
      if (contracts.length > 0) return;
      setLoading(true);
      const res = await fetch("http://localhost:3000/Contract/GetContracts", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        credentials: "include",
      });
      if (res.status === 200) {
        const arrayBuffer = await res.arrayBuffer();
        const bufferData = Buffer.from(arrayBuffer);
        const contracts = JSON.parse(bufferData.toString());
        console.log(contracts.payloadString);
        setContracts(contracts.payloadString);
      } else {
        console.log(res);
      }
      setLoading(false);
    };
    getContracts().catch((e) => {
      console.log(e);
      setLoading(false);
    });
  }, [contracts, setContracts]);

  return (
    <Grid
      container
      direction={"column"}
      alignContent="center"
      justifySelf={"center"}
    >
      <Grid item>
        <ContractHeader></ContractHeader>
      </Grid>

      <Grid item>
        <Grid container>
          <Grid item>
            {loading ? (
              <CircularProgress />
            ) : (
              <ListObjects
                onItemPress={onContractPress}
                Title={"In Progress"}
                Objects={contracts
                  .filter(
                    (obj) =>
                      obj.Status !== "MINTED" && obj.Status !== "COMPLETED"
                  )
                  .map((el, index) => {
                    return {
                      ...el,
                      creationDate: el.Milestones[0].StartDate || 0,
                      itemId: el.ProjectName,
                      owenerId: el.ArtistId,
                      fileUrl: null,
                    };
                  })}
              />
            )}
          </Grid>

          <Grid item>
            {loading ? (
              <CircularProgress />
            ) : (
              <ListObjects
                onItemPress={onContractPress}
                Title={"To be Minted"}
                Objects={contracts
                  .filter((obj) => obj.Status === "COMPLETED")
                  .map((el, index) => {
                    return {
                      ...el,
                      creationDate: el.Milestones[0].StartDate || 0,
                      itemId: el.ProjectName,
                      owenerId: el.ArtistId,
                      fileUrl: null,
                    };
                  })}
              />
            )}
          </Grid>

          <Grid item>
            {loading ? (
              <CircularProgress />
            ) : (
              <ListObjects
                onItemPress={onContractPress}
                Title={"Completed"}
                Objects={contracts
                  .filter((obj) => obj.Status === "MINTED")
                  .map((el, index) => {
                    return {
                      ...el,
                      creationDate: el.Milestones[0].StartDate || 0,
                      itemId: el.ProjectName,
                      owenerId: el.ArtistId,
                      fileUrl: null,
                    };
                  })}
              />
            )}
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}
