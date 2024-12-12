import { Footer } from "../../Footer";
import ConnectedExtraTools from "../../ConnectedExtraTools";
import { Network } from "@0xsequence/waas";
import { Dispatch, SetStateAction } from "react";
import { Address } from "viem";

function MenuContentInfo(props: {
  network: Network | undefined;
  setNetwork: Dispatch<SetStateAction<Network | undefined>>;
  walletAddress?: Address;
}) {
  const { walletAddress, network, setNetwork } = props;
  return (
    <div className="settingsMenuContent scroller">
      <br />
      <h2>Sequence.js Telegram demo</h2>
      <h3 className="homepage__marginBtNormal">Embedded Wallet</h3>
      {walletAddress && (
        <ConnectedExtraTools
          network={network}
          setNetwork={setNetwork}
          walletAddress={walletAddress}
        />
      )}
      <Footer />
    </div>
  );
}

export default MenuContentInfo;
