import { ethers } from "ethers";

const DEVICE_EMOJIS = [
  // 256 emojis for unsigned byte range 0 - 255
  ..."🐶🐱🐭🐹🐰🦊🐻🐼🐨🐯🦁🐮🐷🐽🐸🐵🙈🙉🙊🐒🐔🐧🐦🐤🐣🐥🦆🦅🦉🦇🐺🐗🐴🦄🐝🐛🦋🐌🐞🐜🦟🦗🕷🕸🦂🐢🐍🦎🦖🦕🐙🦑🦐🦞🦀🐡🐠🐟🐬🐳🐋🦈🐊🐅🐆🦓🦍🦧🐘🦛🦏🐪🐫🦒🦘🐃🐂🐄🐎🐖🐏🐑🦙🐐🦌🐕🐩🦮🐈🐓🦃🦚🦜🦢🦩🕊🐇🦝🦨🦡🦦🦥🐁🐀🐿🦔🐾🐉🐲🌵🎄🌲🌳🌴🌱🌿🍀🎍🎋🍃👣🍂🍁🍄🐚🌾💐🌷🌹🥀🌺🌸🌼🌻🌞🌝🍏🍎🍐🍊🍋🍌🍉🍇🍓🍈🥭🍍🥥🥝🍅🥑🥦🥬🥒🌶🌽🥕🧄🧅🥔🍠🥐🥯🍞🥖🥨🧀🥚🍳🧈🥞🧇🥓🥩🍗🍖🦴🌭🍔🍟🍕🥪🥙🧆🌮🌯🥗🥘🥫🍝🍜🍲🍛🍣🍱🥟🦪🍤🍙🍚🍘🍥🥠🥮🍢🍡🍧🍨🍦🥧🧁🍰🎂🍮🍭🍬🍫🍿🍩🍪🌰🥜👀👂👃👄👅👆👇👈👉👊👋👌👍👎👏👐👑👒👓🎯🎰🎱🎲🎳👾👯👺👻👽🏂🏃🏄",
];

// Generate a random name for the session, using a single random emoji and 2 random words
// from the list of words of ethers
export function randomName() {
  const wordlistSize = 2048;
  const words = ethers.wordlists.en;

  const randomEmoji =
    DEVICE_EMOJIS[Math.floor(Math.random() * DEVICE_EMOJIS.length)];
  const randomWord1 = words.getWord(Math.floor(Math.random() * wordlistSize));
  const randomWord2 = words.getWord(Math.floor(Math.random() * wordlistSize));

  return `${randomEmoji} ${randomWord1} ${randomWord2}`;
}

function index(n: number) {
  return Math.abs(Math.floor(n));
}

export function psuedorandomName(i: number, j: number, k: number) {
  const wordlistSize = 2048;
  const words = ethers.wordlists.en;

  const randomEmoji = DEVICE_EMOJIS[index(i) % DEVICE_EMOJIS.length];
  const randomWord1 = words.getWord(index(j) % wordlistSize);
  const randomWord2 = words.getWord(index(k) % wordlistSize);

  return `${randomEmoji} ${randomWord1} ${randomWord2}`;
}
