import { Text } from "@0xsequence/design-system";
import Disconnector from "./Disconnector";
import { Dispatch, SetStateAction } from "react";
import { Account } from "@0xsequence/waas";
import { Address } from "viem";

const MainConnected = (props: {
  setCurrentAccount: Dispatch<SetStateAction<Account | undefined>>;
  walletAddress: Address | undefined;
  setWalletAddress: Dispatch<SetStateAction<Address | undefined>>;
}) => {
  const { setCurrentAccount, setWalletAddress, walletAddress } = props;
  return (
    <>
      <Text
        variant="large"
        fontWeight="bold"
        color="text100"
        wordBreak="break-word"
      >
        Connected with address: {walletAddress}
      </Text>
      <Disconnector
        setCurrentAccount={setCurrentAccount}
        setWalletAddress={setWalletAddress}
      />
    </>
  );
};

export default MainConnected;
