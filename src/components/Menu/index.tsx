import { Dispatch, SetStateAction, useState } from "react";
import SettingsButton from "./Button";
import MenuContent from "./MenuContent";
import { getGameEngine } from "../../game/gameEngine";
import "./style.css";
import { Network } from "@0xsequence/waas";
import { Address } from "viem";

function Menu(props: {
  walletAddress?: Address;
  network: Network | undefined;
  setNetwork: Dispatch<SetStateAction<Network | undefined>>;
}) {
  const { network, setNetwork, walletAddress } = props;
  const [open, setOpen] = useState(false);
  getGameEngine().renderer.domElement.className = open ? "blur" : "";
  return (
    <div className={`${open ? "settingsOpen" : "settingsClosed"} panel`}>
      <SettingsButton
        open={open}
        onClick={() => {
          setOpen(!open);
          getGameEngine().game.paused = !open;
        }}
      />
      {open ? (
        <MenuContent
          network={network}
          walletAddress={walletAddress}
          setNetwork={setNetwork}
        />
      ) : null}
    </div>
  );
}

export default Menu;
