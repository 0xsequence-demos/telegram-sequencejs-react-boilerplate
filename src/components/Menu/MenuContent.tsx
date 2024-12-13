import { TabbedNav } from "@0xsequence/design-system";
import MenuContentSettings from "./content/Settings";
import MenuContentInfo from "./content/Info";
import { Dispatch, SetStateAction } from "react";
import { AccountBox, Info, Settings } from "@mui/icons-material";
import { Account, Network } from "@0xsequence/waas";
import { Address } from "viem";
import MenuContentAccounts from "./content/Accounts";

function MenuContent(props: {
  network: Network | null;
  walletAddress: Address | null;
  setWalletAddress: Dispatch<SetStateAction<Address | null>>;
  setNetwork: Dispatch<SetStateAction<Network | null>>;
  accounts: Account[];
  setAccounts: Dispatch<SetStateAction<Account[]>>;
  currentAccount: Account | null;
  setCurrentAccount: Dispatch<SetStateAction<Account | null>>;
  accountError: string | null;
  accountChangesPending: boolean;
  setAccountChangesPending: Dispatch<SetStateAction<boolean>>;
  removeAccount: (id: string) => Promise<void>;
  emailAuthInProgress: boolean;
  setEmailAuthInProgress: Dispatch<SetStateAction<boolean>>;
  tab: string;
  setTab: Dispatch<SetStateAction<string>>;
  loggingOut: boolean;
  setLoggingOut: Dispatch<SetStateAction<boolean>>;
}) {
  const {
    network,
    setNetwork,
    walletAddress,
    tab,
    setTab,
    accountChangesPending,
    setAccountChangesPending,
    accountError,
    accounts,
    setAccounts,
    currentAccount,
    removeAccount,
    emailAuthInProgress,
    setEmailAuthInProgress,
    loggingOut,
    setCurrentAccount,
    setLoggingOut,
    setWalletAddress,
  } = props;
  return (
    <div>
      <TabbedNav
        className="menuTabs"
        defaultValue={tab}
        tabs={[
          {
            value: "accounts",
            label: walletAddress ? walletAddress.slice(0, 8) : "Account",
            leftIcon: AccountBox,
          },
          {
            value: "info",
            label: "Info",
            leftIcon: Info,
          },
          {
            value: "settings",
            label: "Settings",
            leftIcon: Settings,
          },
        ]}
        onTabChange={(v: string) => setTab(v)}
      ></TabbedNav>
      {tab === "info" && (
        <MenuContentInfo
          network={network}
          setNetwork={setNetwork}
          walletAddress={walletAddress}
        />
      )}
      {tab === "settings" && <MenuContentSettings />}
      {tab === "accounts" && (
        <MenuContentAccounts
          walletAddress={walletAddress}
          accounts={accounts}
          setAccounts={setAccounts}
          currentAccount={currentAccount}
          accountError={accountError}
          accountChangesPending={accountChangesPending}
          setAccountChangesPending={setAccountChangesPending}
          removeAccount={removeAccount}
          emailAuthInProgress={emailAuthInProgress}
          setEmailAuthInProgress={setEmailAuthInProgress}
          setWalletAddress={setWalletAddress}
          setCurrentAccount={setCurrentAccount}
          loggingOut={loggingOut}
          setLoggingOut={setLoggingOut}
        />
      )}
    </div>
  );
}

export default MenuContent;
