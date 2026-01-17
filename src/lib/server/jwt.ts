import jwt from "jsonwebtoken";

export interface JWTPayload {
  userId: string;
  email: string;
  isAdmin: boolean;
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function getUserFromHeaders(headers: Record<string, string | string[] | undefined>): JWTPayload | null {
  const authHeader = headers.authorization || headers.Authorization;
  const token = typeof authHeader === "string" ? authHeader.replace("Bearer ", "") : null;
  
  if (!token) return null;
  
  return verifyToken(token);
}
