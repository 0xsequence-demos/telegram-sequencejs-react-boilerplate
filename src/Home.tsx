import "./Home.css";
import MainConnected from "./components/MainConnected";
import Menu from "./components/Menu";
import { createTheme, ThemeProvider } from "@mui/material";
import { useEffect, useState } from "react";
import { getGameEngine } from "./game/gameEngine";
import { Account, Network } from "@0xsequence/waas";
import { sequence } from "./sequence";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { getMessageFromUnknownError } from "./utils/getMessageFromUnknownError";
import { ToastProvider } from "@0xsequence/design-system";
import { SequenceIndexer, TokenBalance } from "@0xsequence/indexer";
import ErrorToast from "./components/ErrorToast";
import { sharedGameState } from "./game/sharedGameState";

const indexerClient = new SequenceIndexer(
  `https://${import.meta.env.VITE_CHAIN_HANDLE}-indexer.sequence.app`,
  import.meta.env.VITE_SEQUENCE_PROJECT_ACCESS_KEY,
);

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
  const [accountChangesPending, setAccountChangesPending] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  async function refreshAccounts() {
    setAccountChangesPending(true);
    const response = await sequence.listAccounts();
    setAccountChangesPending(false);
    setAccounts(response.accounts);
    if (response.currentAccountId) {
      setCurrentAccount(
        response.accounts.find(
          (account) => account.id === response.currentAccountId,
        ) || null,
      );
    }
  }

  const removeAccount = async (id: string) => {
    setAccountChangesPending(true);
    try {
      await sequence.removeAccount(id);
    } catch (e: unknown) {
      setAccountError(getMessageFromUnknownError(e));
    }
    refreshAccounts();
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
    refreshAccounts();
  }, [walletAddress]);

  useEffect(() => {
    // getGameEngine().game.party = true;
    getGameEngine().game.party = !!walletAddress;
    const i = setTimeout(() => {
      // getGameEngine().game.paused = !walletAddress;
      setMenuOpen(!walletAddress);
    }, 1000);
    return () => {
      clearTimeout(i);
    };
  }, [walletAddress]);

  const [unsafeCoinBalance, setUnsafeCoinBalance] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const i = setTimeout(
      () => {
        getGameEngine().game.paused = menuOpen;
      },
      menuOpen ? 500 : 0,
    );
    return () => clearTimeout(i);
  }, [menuOpen]);

  useEffect(() => {
    sharedGameState.coinsInPocket.listen(setUnsafeCoinBalance);
    sharedGameState.coinsInSafe.expected.listen(setExpectedCoinCount);
  }, []);

  useEffect(() => {
    // getGameEngine().game.party = true;
    sharedGameState.walletAddress = walletAddress;
    sharedGameState.coinsInSafe.errorMessage.listen(setMinterErrorMessage);
  }, [walletAddress]);

  const [confirmedCoinCount, setConfirmedCoinCount] = useState(0);
  const [expectedCoinCount, setExpectedCoinCount] = useState(0);

  const [minterErrorMessage, setMinterErrorMessage] = useState<string>("");
  const [indexerErrorMessage, setIndexerErrorMessage] = useState<string>("");

  const [inventoryStatus, setInventoryStatus] = useState<
    "unknown" | "empty" | "populated"
  >("unknown");

  //start polling indexer
  useQuery({
    queryKey: ["tokens", walletAddress],
    queryFn: async () => {
      if (!walletAddress) {
        return [];
      }
      try {
        const r = await indexerClient.getTokenBalances({
          accountAddress: walletAddress,
          contractAddress: import.meta.env.VITE_COIN_CONTRACT_ADDRESS,
          includeMetadata: false,
        });
        const balances: TokenBalance[] = r.balances || [];
        setInventoryStatus(balances.length === 0 ? "empty" : "populated");
        const coinCount = parseInt(
          balances.find((token: TokenBalance) => token.tokenID === "0")
            ?.balance || "0",
        );
        if (coinCount !== confirmedCoinCount) {
          setConfirmedCoinCount(coinCount);
          sharedGameState.coinsInSafe.expected.value = coinCount;
        }
        return balances;
      } catch (e) {
        setIndexerErrorMessage(getMessageFromUnknownError(e));
        setTimeout(() => setIndexerErrorMessage(""), 5000);
        return [];
      }
    },
    refetchInterval: 5000,
    initialData: [],
    enabled: !!walletAddress,
  });

  const maybeFadedCoinCount =
    expectedCoinCount !== confirmedCoinCount ? "animated-fade" : "";

  return (
    <ThemeProvider theme={darkTheme}>
      <ToastProvider>
        <div className="ui-wrapper">
          <div className="topish">
            {walletAddress && <MainConnected walletAddress={walletAddress} />}
          </div>
        </div>
        <div className="coin-balance">
          <span className={maybeFadedCoinCount}>
            {inventoryStatus === "unknown" ? "..." : expectedCoinCount}
          </span>
          {unsafeCoinBalance ? `+${unsafeCoinBalance}` : ""}
        </div>
        {minterErrorMessage && (
          <ErrorToast
            description={minterErrorMessage}
            onClose={() => {
              setMinterErrorMessage("");
            }}
          />
        )}
        {indexerErrorMessage && (
          <ErrorToast
            description={indexerErrorMessage}
            onClose={() => {
              setIndexerErrorMessage("");
            }}
          />
        )}
        <Menu
          network={network}
          setNetwork={setNetwork}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          walletAddress={walletAddress}
          accounts={accounts}
          setAccounts={setAccounts}
          currentAccount={currentAccount}
          accountChangesPending={accountChangesPending}
          setAccountChangesPending={setAccountChangesPending}
          accountError={accountError}
          removeAccount={removeAccount}
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
