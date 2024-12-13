import { Text } from "@0xsequence/design-system";
import { useEmailAuth } from "../hooks/useEmailAuth";
import { randomName } from "../utils/randomName";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { PINCodeInput } from "./PinCodeInput";
import { EmailOutlined } from "@mui/icons-material";
import { Account } from "@0xsequence/waas";

export default function Email(props: {
  emailAuthInProgress: boolean;
  setEmailAuthInProgress: Dispatch<SetStateAction<boolean>>;
  currentAccount: Account | null;
}) {
  const { setEmailAuthInProgress, currentAccount } = props;

  const [showEmailWarning, setEmailWarning] = useState(false);
  const [code, setCode] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isEmailValid = inputRef.current?.validity.valid;

  const {
    inProgress: emailAuthInProgress,
    loading: emailAuthLoading,
    initiateAuth: initiateEmailAuth,
    sendChallengeAnswer,
  } = useEmailAuth({
    sessionName: randomName(),
    onSuccess: async ({ wallet }) => {
      console.log(`Wallet address: ${wallet}`);
    },
    linkAccount: !!currentAccount,
  });
  useEffect(() => {
    setEmailAuthInProgress(emailAuthInProgress || emailAuthLoading);
  }, [emailAuthInProgress, emailAuthLoading]);

  return (
    <>
      <div style={{ width: "100%", display: "flex", flexDirection: "row" }}>
        {sendChallengeAnswer ? (
          <div
            style={{ width: "100%", display: "flex", flexDirection: "column" }}
          >
            <Text marginTop="5" variant="normal" color="text80">
              Enter code received in email.
            </Text>
            <div
              style={{
                flex: "1",
                display: "flex",
                flexDirection: "row",
                justifyContent: "end",
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: "1" }}>
                <PINCodeInput value={code} digits={6} onChange={setCode} />
              </div>
              <button
                disabled={code.includes("")}
                onClick={() => sendChallengeAnswer(code.join(""))}
                data-id="verifyButton"
                style={{ flex: "0 0 150px" }}
              >
                Verify
              </button>
            </div>
          </div>
        ) : (
          <>
            <EmailOutlined style={{ transform: "translateY(12px)" }} />
            <input
              name="email"
              type="email"
              onChange={(ev: { target: { value: SetStateAction<string> } }) => {
                setEmail(ev.target.value);
              }}
              ref={inputRef}
              onKeyDown={(ev: { key: string }) => {
                if (email && ev.key === "Enter") {
                  initiateEmailAuth(email);
                }
              }}
              onBlur={() => setEmailWarning(!!email && !isEmailValid)}
              value={email}
              placeholder="hello@example.com"
              required
              data-id="loginEmail"
              style={{
                flex: "1",
                fontSize: "16px",
                margin: "4px",
                outlineWidth: "2px",
                outlineColor: "#ffffff",
                outlineStyle: "solid",
                borderRadius: "10px",
                borderStyle: "hidden",
                padding: "10px",
              }}
            />
            <button
              disabled={!isEmailValid}
              onClick={() => initiateEmailAuth(email)}
              data-id="continueButton"
              style={{ flex: "0 0 150px" }}
            >
              {currentAccount ? "Link Email" : "Login via Email"}
            </button>
          </>
        )}
      </div>

      {showEmailWarning && (
        <Text as="p" variant="small" color="negative" marginY="2">
          Invalid email address
        </Text>
      )}
    </>
  );
}
