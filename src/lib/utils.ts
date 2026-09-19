import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Mask an email for admin display and CSV export, e.g.
//   idrisaloma120@gmail.com -> id********20@gmail.com
// The star run is a fixed length so the real address length isn't leaked.
const MASK = "********";

export function maskEmail(email?: string | null): string {
  if (!email) return "-";

  const at = email.lastIndexOf("@");
  if (at <= 0) return MASK; // Not an address we can safely partially reveal

  const local = email.slice(0, at);
  const domain = email.slice(at); // includes "@"

  // Too short to show both ends without effectively revealing the whole local part.
  if (local.length < 5) {
    return `${local.slice(0, 1)}${MASK}${domain}`;
  }

  return `${local.slice(0, 2)}${MASK}${local.slice(-2)}${domain}`;
}
