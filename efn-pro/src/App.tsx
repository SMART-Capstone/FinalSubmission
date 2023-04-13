import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/NavigationBar/Navbar";
import "./App.css";
import {
  ContractHistoryType,
  ContractType,
} from "./components/Artist/Contract/types/ContractTypes";
import { Contract } from "./components/Artist/Contract/Contract";
import { ClientHome } from "./Client/Home";
import { NftType } from "./Client/types/Nft";
import { NftView } from "./Client/NftView";
import { Logout } from "./pages/Auth/Login/Logout";
import { ContractHistory } from "./components/Artist/Contract/ContractHistory";
import { ClientSetKeyPortal } from "./components/ClientSetKeyPortal";
import { Login } from "./pages/Auth/Login/index";
import { Home } from "./private/Home";
import { PublicHome } from "./pages/PublicHome";
import { createContext, useEffect, useState } from "react";
import { User } from "./types/User";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { CreateContract } from "./components/Artist/Contract/CreateContract";
import Register from "./pages/Auth/Register/Register";
import { Profile } from "./pages/Profile";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

type ContractContextType = {
  contracts: ContractType[];
  setContracts: (contracts: ContractType[]) => void;
};

type NftContextType = {
  nfts: NftType[];
  setNfts: (contracts: NftType[]) => void;
};

export const ContractContext = createContext<ContractContextType>({
  contracts: [],
  setContracts: () => {},
});

export const NftContext = createContext<NftContextType>({
  nfts: [],
  setNfts: () => {},
});

function App() {
  const [user, setUser] = useState<User | undefined>(undefined);

  const [session, setSession] = useState<Boolean>(false);

  const [selectedContract, setSelectedContract] = useState<ContractType | null>(
    null
  );
  const [selectedNft, setSelectedNft] = useState<NftType | null>(null);
  const [contractHistory, setContractHistory] = useState<
    ContractHistoryType[] | null
  >(null);
  const [contracts, setContracts] = useState<ContractType[]>([]);
  const [nfts, setNfts] = useState<NftType[]>([]);
  const value = {
    contracts,
    setContracts: (contracts: ContractType[]) => setContracts(contracts),
  };
  const nftValue = {
    nfts,
    setNfts: (contracts: NftType[]) => setNfts(contracts),
  };

  // fix me move to artist dashboard
  useEffect(() => {
    const getUser = async () => {
      const response = await fetch("http://localhost:3000/login/user", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        credentials: "include",
      });

      if (response.status === 200) {
        const loggedInUser = await response.json();
        setUser(loggedInUser);
      } else {
        setUser(undefined);
      }
    };
    getUser().catch((e) => {
      console.log(e);
      setUser(undefined);
    });
  }, [session]);

  const setContract = (contract: ContractType) => {
    setSelectedContract(contract);
  };

  const setContractHistoryHelper = (contractHistory: ContractHistoryType[]) => {
    setContractHistory(contractHistory);
  };

  const homeRoute = user
    ? user.kind === "ClientCredentials"
      ? "/client"
      : "/"
    : "/";

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <BrowserRouter>
        <div style={{ width: "100vw", height: "100vh" }}>
          <Navbar
            user={user}
            setUser={setUser}
            session={session}
            setSession={setSession}
          />
          <Routes>
            <Route
              path="/logout"
              element={
                user ? (
                  <Navigate to={homeRoute} />
                ) : (
                  <Logout
                    user={user}
                    setUser={setUser}
                    session={{ setSession }}
                  />
                )
              }
            />

            <Route
              path="/signup"
              element={
                user ? (
                  <Navigate to={homeRoute} />
                ) : (
                  <Register setSession={setSession} />
                )
              }
            />
            <Route
              path="/login"
              element={
                user ? (
                  <Navigate to={homeRoute} />
                ) : (
                  <Login setSession={setSession} />
                )
              }
            />

            <Route
              path="/nftView"
              element={
                selectedNft ? (
                  <NftView nft={selectedNft} />
                ) : (
                  <Navigate to={homeRoute} />
                )
              }
            />

            <Route
              path="/client"
              element={
                <NftContext.Provider value={nftValue}>
                  <ClientHome updateSelectedNft={setSelectedNft} />
                </NftContext.Provider>
              }
            />

            <Route path="/resetkey" element={<ClientSetKeyPortal />} />

            <Route
              path="/contractHistory"
              element={
                contractHistory ? (
                  <ContractHistory contractHistory={contractHistory} />
                ) : (
                  <Navigate to={homeRoute} />
                )
              }
            />

            <Route
              path="/contractView"
              element={
                selectedContract ? (
                  <Contract
                    contract={selectedContract}
                    setContractHistory={setContractHistoryHelper}
                  />
                ) : (
                  <Navigate to={homeRoute} />
                )
              }
            />
            <Route
              path="/createContract"
              element={user ? <CreateContract /> : <Navigate to={homeRoute} />}
            />
            <Route
              path="/profile"
              element={
                user ? <Profile user={user} /> : <Navigate to={homeRoute} />
              }
            />
            <Route
              path="/"
              element={
                user?.kind === "ClientCredentials" ? (
                  <Navigate to="/client" />
                ) : user ? (
                  <ContractContext.Provider value={value}>
                    <Home updateSelectedContract={setContract} />
                  </ContractContext.Provider>
                ) : (
                  <PublicHome />
                )
              }
            />
          </Routes>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
