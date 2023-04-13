import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Buffer } from "buffer";
import { ListObjects } from "../components/ObjectList";
import { useEffect, useState } from "react";
import { NftType } from "./types/Nft";
import { NftContext } from "../App";
import CircularProgress from "@mui/material/CircularProgress";

interface Props {
  updateSelectedNft: (nft: NftType) => void;
}
export function ClientHome({ updateSelectedNft }: Props) {
  const [loading, setLoading] = useState<boolean>(false);
  const { nfts, setNfts } = useContext(NftContext);
  const navigate = useNavigate();

  const onNftPress = (contract: any) => {
    console.log(contract, 432);
    updateSelectedNft(contract);
    navigate("/NftView");
  };

  useEffect(() => {
    const getNfts = async () => {
      if (nfts.length > 0) return;
      setLoading(true);
      const res = await fetch("http://localhost:3000/NFT/GetNFTs", {
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
        setNfts(JSON.parse(contracts.payloadString));
      } else {
        console.log(res);
      }
      setLoading(false);
    };
    getNfts().catch((e) => {
      console.log(e);
      setLoading(false);
    });
  }, [nfts, setNfts]);

  return (
    <div>
      {loading ? (
        <CircularProgress />
      ) : (
        <ListObjects
          onItemPress={onNftPress}
          Title={"NFTs"}
          Objects={nfts.map((el) => {
            return {
              ...el,
              creationDate: el.TimeStamp,
              itemId: el.NftId,
              owenerId: el.OwnerId,
              ProjectName: el.ProjectName || el.OriginalProjectId,
              fileUrl: el.DisplayAssetUrl,
            };
          })}
        />
      )}
    </div>
  );
}
