import { Dispatch, SetStateAction } from "react";
import { sequence } from "../sequence";
import { randomName } from "../utils/randomName";
import { Address } from "viem";

const Connector = (props: {
  setWalletAddress: Dispatch<SetStateAction<Address | undefined>>;
}) => {
  const { setWalletAddress } = props;
  const handleGuestLogin = async () => {
    const signInResponse = await sequence.signIn({ guest: true }, randomName());
    console.log(`Wallet address: ${signInResponse.wallet}`);
    setWalletAddress(signInResponse.wallet as Address);
  };

  return (
    <div>
      <button onClick={handleGuestLogin}>Connect</button>
    </div>
  );
};

export default Connector;
