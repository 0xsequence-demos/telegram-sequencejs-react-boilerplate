import { Dispatch, SetStateAction } from "react";
import { sequence } from "../sequence";
import { getMessageFromUnknownError } from "../utils/getMessageFromUnknownError";
import { Account } from "@0xsequence/waas";
import { Address } from "viem";

const Disconnector = (props: {
  setCurrentAccount: Dispatch<SetStateAction<Account | undefined>>;
  setWalletAddress: Dispatch<SetStateAction<Address | undefined>>;
}) => {
  const { setCurrentAccount, setWalletAddress } = props;
  return (
    <div className="card">
      <button
        onClick={() => {
          sequence
            .dropSession({ strict: false })
            .catch((e: unknown) => {
              console.warn(
                `Could not drop session: ${getMessageFromUnknownError(e)}`,
              );
            })
            .finally(() => {
              setCurrentAccount(undefined);
              setWalletAddress(undefined);
            });
        }}
      >
        Abandon Guest Account
      </button>
    </div>
  );
};

export default Disconnector;
