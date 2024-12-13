import "./Home.css";
import MainConnected from "./components/MainConnected";
import Menu from "./components/Menu";
import { createTheme, ThemeProvider } from "@mui/material";
import { useEffect, useState } from "react";
import { getGameEngine } from "./game/gameEngine";
import { Account, Network } from "@0xsequence/waas";
import { sequence } from "./sequence";
import { Address } from "viem";
import { getMessageFromUnknownError } from "./utils/getMessageFromUnknownError";
import { ToastProvider } from "@0xsequence/design-system";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});
const Home = () => {
  const [network, setNetwork] = useState<Network | null>(null);
  const [walletAddress, setWalletAddress] = useState<Address | null>(null);
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [emailAuthInProgress, setEmailAuthInProgress] = useState(false);
  const [accountChangesPending, setAccountChangesPending] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const removeAccount = async (id: string) => {
    setAccountChangesPending(true);
    try {
      await sequence.removeAccount(id);
      const response = await sequence.listAccounts();
      setAccounts(response.accounts);
    } catch (e: unknown) {
      setAccountError(getMessageFromUnknownError(e));
      const response = await sequence.listAccounts();
      setAccounts(response.accounts);
    }

    setAccountChangesPending(false);
  };

  useEffect(() => {
    setAccountChangesPending(true);
    sequence
      .getAddress()
      .then((address: string) => {
        setAccountChangesPending(false);
        setWalletAddress(address as Address);
        console.log(address);
      })
      .catch((e: unknown) => {
        console.warn(getMessageFromUnknownError(e));
        setAccountChangesPending(false);
        // sequence
        //   .signIn({ guest: true }, randomName())
        //   .then((signInResponse) => {
        //     setAccountChangesPending(false);
        //     console.log(`Wallet address: ${signInResponse.wallet}`);
        //     setWalletAddress(signInResponse.wallet as Address);
        //   });
        // setFetchWalletAddressError(getMessageFromUnknownError(e))
      });
  }, []);

  useEffect(() => {
    if (!walletAddress) {
      return;
    }
    setAccountChangesPending(true);
    sequence.listAccounts().then((response) => {
      setAccountChangesPending(false);
      setAccounts(response.accounts);
      if (response.currentAccountId) {
        setCurrentAccount(
          response.accounts.find(
            (account) => account.id === response.currentAccountId,
          ) || null,
        );
      }
    });
  }, [walletAddress, emailAuthInProgress]);

  function refreshAccounts() {
    console.log("refresh!!");
  }

  useEffect(() => {
    getGameEngine().game.party = !!walletAddress;
  }, [walletAddress]);

  useEffect(() => {
    console.log("currentAccount", currentAccount);
  }, [currentAccount]);

  return (
    <ThemeProvider theme={darkTheme}>
      <ToastProvider>
        <div className="ui-wrapper">
          <div className="topish">
            {walletAddress && <MainConnected walletAddress={walletAddress} />}
          </div>
        </div>
        <Menu
          network={network}
          setNetwork={setNetwork}
          walletAddress={walletAddress}
          accounts={accounts}
          setAccounts={setAccounts}
          currentAccount={currentAccount}
          accountChangesPending={accountChangesPending}
          setAccountChangesPending={setAccountChangesPending}
          accountError={accountError}
          removeAccount={removeAccount}
          emailAuthInProgress={emailAuthInProgress}
          setEmailAuthInProgress={setEmailAuthInProgress}
          setCurrentAccount={setCurrentAccount}
          setWalletAddress={setWalletAddress}
          loggingOut={loggingOut}
          setLoggingOut={setLoggingOut}
          refreshAccounts={refreshAccounts}
        />
      </ToastProvider>
    </ThemeProvider>
  );
};

export default Home;
