import { TabbedNav } from "@0xsequence/design-system";
import MenuContentSettings from "./content/Settings";
import MenuContentInfo from "./content/Info";
import { Dispatch, SetStateAction, useState } from "react";
import { Info, Settings } from "@mui/icons-material";
import { Network } from "@0xsequence/waas";
import { Address } from "viem";

function MenuContent(props: {
  network: Network | undefined;
  walletAddress?: Address;
  setNetwork: Dispatch<SetStateAction<Network | undefined>>;
}) {
  const { network, setNetwork, walletAddress } = props;
  const [tab, setTab] = useState("info");
  return (
    <div>
      <TabbedNav
        className="menuTabs"
        defaultValue={tab}
        tabs={[
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
    </div>
  );
}

export default MenuContent;
