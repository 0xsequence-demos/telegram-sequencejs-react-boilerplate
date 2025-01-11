import { SequenceWaaS } from "@0xsequence/waas";

export const sequence = new SequenceWaaS({
  network: import.meta.env.VITE_CHAIN_HANDLE,
  projectAccessKey: import.meta.env.VITE_SEQUENCE_PROJECT_ACCESS_KEY,
  waasConfigKey: import.meta.env.VITE_WAAS_CONFIG_KEY,
});
