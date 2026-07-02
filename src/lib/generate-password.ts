import { randomInt } from "node:crypto";

// Excludes visually ambiguous characters (0/O, 1/l/I) since these
// passwords get read aloud or typed by hand from a screen by HR handing
// them to a new staff member — not just copy-pasted.
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

export function generatePassword(length = 12): string {
  let password = "";
  for (let i = 0; i < length; i++) {
    password += CHARS[randomInt(CHARS.length)];
  }
  return password;
}
