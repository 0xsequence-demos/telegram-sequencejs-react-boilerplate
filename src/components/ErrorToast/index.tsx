import { CloseIcon } from "@0xsequence/design-system";
import "./style.css";
import { createPortal } from "react-dom";
export default function ErrorToast(props: {
  description: string;
  onClose: () => void;
}) {
  const { description, onClose } = props;
  return createPortal(
    <div className="error-toast">
      <button className="close-btn" onClick={onClose}>
        <CloseIcon />
      </button>
      {description}
    </div>,
    document.body,
  );
}
