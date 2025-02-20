import { NextFunction, Request, Response } from "express";

export default function requestSniffer(
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log("Headers:", req.headers);
  console.log("Query Params:", req.query);
  console.log("Body:", req.body); // Requires express.json()
  console.log("IP:", req.ip);
  res.status(200);
  next(); // Pass control to the next middleware/route
}
