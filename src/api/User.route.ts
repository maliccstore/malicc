import { Request, Response, Router } from "express";

const UserRouter = Router();

UserRouter.get("/getme/:id", (req: Request, res: Response) => {
  const userId = req.params.id;
  const userName = req.query.name;
  const lastName = req.query.lastname;
  res.status(200).json({
    message: "This is the user ",
    userNumber: userId,
    userName: userName,
    userLastName: lastName,
  });
});

export default UserRouter;
