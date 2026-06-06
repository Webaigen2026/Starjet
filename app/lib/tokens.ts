import crypto from "crypto";

export function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function getTokenExpiry(minutes = 30) {
  return new Date(Date.now() + minutes * 60 * 1000);
}