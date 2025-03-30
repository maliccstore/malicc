import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import UserRouter from "./api/User.route";

dotenv.config();
const app: Express = express();
const port = process.env.PORT;

app.use(express.json());
app.use("/api", UserRouter);

function root(req: Request, res: Response): void {
  res.status(200).json({ message: "This is root path of malicc server" });
}

app.get("/", root);

app.listen(port, () => {
  console.log("Server running on port", port);
});

app.on("error", (error) => {
  console.error("Server error:", error);
  process.exit(1);
});
