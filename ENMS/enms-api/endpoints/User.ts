import { Router } from "express";
import {
  createArtistHandler,
  createClientHandler,
  clientResetKeyHandler,
  deleteUserHandler,
} from "../handlers/UserHandlers";
const userRouter = Router();

import { checkAuth, checkNotAuth } from "../auth-service";

userRouter.post("/CreateClient", checkAuth, createClientHandler);
userRouter.post("/CreateUser", checkNotAuth, createArtistHandler);
userRouter.post("/ClientResetKey", checkNotAuth, clientResetKeyHandler);
userRouter.post("/DeleteAccount", checkAuth, deleteUserHandler);
export { userRouter };
