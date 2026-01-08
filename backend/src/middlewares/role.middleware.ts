import { Request, Response, NextFunction } from "express";

export const garantirAcesso = (rolesPermitidas: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.headers['x-user-role'] as string;

    if (!userRole || !rolesPermitidas.includes(userRole)) {
      return res.status(403).json({ error: "Seu cargo não tem permissão para esta ação." });
    }
    next();
  };
};