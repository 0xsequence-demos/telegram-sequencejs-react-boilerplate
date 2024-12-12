import "./Home.css";
import Connector from "./components/Connector";
import MainConnected from "./components/MainConnected";
import Menu from "./components/Menu";
import { createTheme, ThemeProvider } from "@mui/material";
import { useEffect, useState } from "react";
import { getGameEngine } from "./game/gameEngine";
import { Account, IdentityType, Network } from "@0xsequence/waas";
import { sequence } from "./sequence";
import { Address } from "viem";
import { Box, Text } from "@0xsequence/design-system";
import { AccountName } from "./AccountName";
import { getMessageFromUnknownError } from "./utils/getMessageFromUnknownError";
import { randomName } from "./utils/randomName";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});
const Home = () => {
  const [network, setNetwork] = useState<undefined | Network>();
  const [walletAddress, setWalletAddress] = useState<Address>();
  const [currentAccount, setCurrentAccount] = useState<Account>();
  const [firstAttemptMade, setFirstAttemptMade] = useState(false);

  useEffect(() => {
    sequence
      .getAddress()
      .then((address: string) => {
        setWalletAddress(address as Address);
        setFirstAttemptMade(true);
        console.log(address);
      })
      .catch((e: unknown) => {
        console.warn(getMessageFromUnknownError(e));
        sequence
          .signIn({ guest: true }, randomName())
          .then((signInResponse) => {
            console.log(`Wallet address: ${signInResponse.wallet}`);
            setWalletAddress(signInResponse.wallet as Address);
          });
        // setFetchWalletAddressError(getMessageFromUnknownError(e))
      });
  }, []);

  useEffect(() => {
    if (!walletAddress) {
      return;
    }
    sequence.listAccounts().then((response) => {
      if (response.currentAccountId) {
        setCurrentAccount(
          response.accounts.find(
            (account) => account.id === response.currentAccountId,
          ),
        );
      }
    });
  }, [walletAddress]);

  useEffect(() => {
    getGameEngine().game.party = !!walletAddress;
  }, [walletAddress]);

  useEffect(() => {
    console.log(currentAccount);
  }, [currentAccount]);

  return (
    <ThemeProvider theme={darkTheme}>
      <div className="ui-wrapper">
        <div className="topish">
          {currentAccount && (
            <Box flexDirection="column" gap="2">
              <Text marginTop="1" variant="normal" color="text100">
                {currentAccount.type === IdentityType.Guest
                  ? "Guest account"
                  : `Logged in with account type ${currentAccount.type}`}{" "}
              </Text>
              {currentAccount.type !== IdentityType.Guest && (
                <AccountName acc={currentAccount} />
              )}
            </Box>
          )}
          {walletAddress ? (
            <MainConnected
              setCurrentAccount={setCurrentAccount}
              walletAddress={walletAddress}
              setWalletAddress={setWalletAddress}
            />
          ) : (
            firstAttemptMade && (
              <Connector setWalletAddress={setWalletAddress} />
            )
          )}
        </div>
      </div>
      <Menu
        network={network}
        setNetwork={setNetwork}
        walletAddress={walletAddress}
      />
    </ThemeProvider>
  );
};

export default Home;
