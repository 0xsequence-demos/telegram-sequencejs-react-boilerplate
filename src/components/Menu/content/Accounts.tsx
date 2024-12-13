import { Box, Text } from "@0xsequence/design-system";
import { Address } from "viem";
import { AccountName } from "../../../AccountName";
import { Account, IdentityType } from "@0xsequence/waas";
import Email from "../../Email";
import { Dispatch, SetStateAction } from "react";
import { sequence } from "../../../sequence";
import { getMessageFromUnknownError } from "../../../utils/getMessageFromUnknownError";
import {
  EmailOutlined,
  PersonOutline,
  ReportProblem,
  Wallet,
} from "@mui/icons-material";
import { randomName } from "../../../utils/randomName";

function MenuContentAccounts(props: {
  walletAddress: Address | null;
  setWalletAddress: Dispatch<SetStateAction<Address | null>>;
  accounts: Account[];
  setAccounts: Dispatch<SetStateAction<Account[]>>;
  currentAccount: Account | null;
  setCurrentAccount: Dispatch<SetStateAction<Account | null>>;
  accountError: string | null;
  accountChangesPending: boolean;
  setAccountChangesPending: Dispatch<SetStateAction<boolean>>;
  emailAuthInProgress: boolean;
  setEmailAuthInProgress: Dispatch<SetStateAction<boolean>>;
  removeAccount: (id: string) => Promise<void>;
  loggingOut: boolean;
  setLoggingOut: Dispatch<SetStateAction<boolean>>;
}) {
  const {
    walletAddress,
    currentAccount,
    accounts,
    setAccounts,
    accountError,
    removeAccount,
    accountChangesPending,
    emailAuthInProgress,
    setEmailAuthInProgress,
    loggingOut,
    setLoggingOut,
    setCurrentAccount,
    setWalletAddress,
    setAccountChangesPending,
  } = props;

  return (
    <div className="settingsMenuContent scroller">
      <h3>
        <Wallet />
        {walletAddress || "Log in for wallet address"}
      </h3>
      <br />
      {currentAccount && (
        <Box flexDirection="row" gap="2" style={{ width: "100%" }}>
          <div
            style={{
              flex: "0 0 30px",
              textAlign: "left",
            }}
          >
            {currentAccount.type === IdentityType.Guest ? (
              <>
                <PersonOutline style={{ transform: "translateY(6px)" }} />
              </>
            ) : (
              <>
                <EmailOutlined style={{ transform: "translateY(6px)" }} />
              </>
            )}{" "}
          </div>
          <div
            style={{
              flex: "1",
              textAlign: "left",
              lineHeight: "40px",
              fontWeight: "bold",
            }}
          >
            <AccountName acc={currentAccount} />
          </div>
          <button
            className={loggingOut ? "pending" : ""}
            style={{
              flex: "0 0 150px",
            }}
            onClick={() => {
              if (loggingOut) {
                return;
              }
              setLoggingOut(true);
              sequence
                .dropSession({ strict: false })
                .catch((e: unknown) => {
                  console.warn(
                    `Could not drop session: ${getMessageFromUnknownError(e)}`,
                  );
                  setLoggingOut(false);
                })
                .finally(() => {
                  setCurrentAccount(null);
                  setAccounts([]);
                  setWalletAddress(null);
                  setLoggingOut(false);
                });
            }}
          >
            {loggingOut ? "Logging Out..." : "Log Out"}
          </button>
        </Box>
      )}
      <Box marginBottom="5" gap="4" flexDirection="column">
        {accounts.length === 0 && (
          <button
            className={loggingOut ? "pending" : ""}
            onClick={() => {
              if (loggingOut || accountChangesPending) {
                return;
              }
              setAccountChangesPending(true);
              sequence
                .signIn({ guest: true }, randomName())
                .then((signInResponse) => {
                  setAccountChangesPending(false);
                  console.log(`Wallet address: ${signInResponse.wallet}`);
                  setWalletAddress(signInResponse.wallet as Address);
                });
            }}
          >
            {accountChangesPending ? "logging in" : "Log in as Guest"}
          </button>
        )}
        {accounts && (
          <>
            {accounts
              .filter((a) => a.id !== currentAccount?.id)
              .map((a) => (
                <Box key={a.id} flexDirection="row" alignItems="center" gap="2">
                  <div style={{ flex: "0 0 20px" }}>
                    <PersonOutline style={{ transform: "translateY(6px)" }} />
                  </div>
                  <div style={{ flex: "1", textAlign: "left" }}>
                    <AccountName acc={a} />
                  </div>
                  {a.id !== currentAccount?.id && (
                    <button
                      onClick={() => removeAccount(a.id)}
                      style={{ flex: "0 0 150px" }}
                    >
                      Unlink{" "}
                      {a.type === IdentityType.Guest ? (
                        <ReportProblem
                          style={{ transform: "translateY(4px)" }}
                        />
                      ) : null}
                    </button>
                  )}
                  {a.id === currentAccount?.id && (
                    <Box>
                      <Text variant="small" color="text100">
                        (Account you logged in with)
                      </Text>
                    </Box>
                  )}
                </Box>
              ))}
          </>
        )}
        {accountError && (
          <Text variant="normal" color="text100" fontWeight="bold">
            Error loading accounts: {accountError}
          </Text>
        )}
      </Box>
      <Email
        setEmailAuthInProgress={setEmailAuthInProgress}
        emailAuthInProgress={emailAuthInProgress}
        currentAccount={currentAccount}
      />
    </div>
  );
}

export default MenuContentAccounts;
