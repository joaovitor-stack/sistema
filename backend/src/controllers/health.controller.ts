import type { Request, Response } from "express";

export function healthCheck(req: Request, res: Response) {
  return res.status(200).json({
    ok: true,
    service: "maxtour-backend",
    timestamp: new Date().toISOString()
  });
}
