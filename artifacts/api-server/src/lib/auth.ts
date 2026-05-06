import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export const JWT_SECRET =
  process.env.JWT_SECRET ?? "unify-dev-jwt-secret-change-in-production";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      currentUserId?: number;
    }
  }
}

export async function withCurrentUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
    // Check if user is still banned (timed bans)
    const [user] = await db.select({ isBanned: usersTable.isBanned, bannedUntil: usersTable.bannedUntil })
      .from(usersTable).where(eq(usersTable.id, payload.userId)).limit(1);
    if (user) {
      // Auto-lift timed ban if it has expired
      if (user.isBanned && user.bannedUntil && new Date() > user.bannedUntil) {
        await db.update(usersTable).set({ isBanned: false, bannedUntil: null }).where(eq(usersTable.id, payload.userId));
      } else if (user.isBanned) {
        res.status(403).json({ error: "banned" });
        return;
      }
    }
    req.currentUserId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: "unauthorized" });
  }
}

export async function withModeratorOrAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(403).json({ error: "forbidden" });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, payload.userId))
      .limit(1);
    if (!user || (user.role !== "admin" && user.role !== "moderator")) {
      res.status(403).json({ error: "forbidden" });
      return;
    }
    req.currentUserId = payload.userId;
    next();
  } catch {
    res.status(403).json({ error: "forbidden" });
  }
}

export async function withAdminUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(403).json({ error: "forbidden" });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, payload.userId))
      .limit(1);
    if (!user || user.role !== "admin") {
      res.status(403).json({ error: "forbidden" });
      return;
    }
    req.currentUserId = payload.userId;
    next();
  } catch {
    res.status(403).json({ error: "forbidden" });
  }
}
