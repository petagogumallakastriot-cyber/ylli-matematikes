import { Router, type IRouter } from "express";
import healthRouter from "./health";
import mathRouter from "./math";
import practiceRouter from "./practice";
import learnerAuthRouter from "./learner-auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(learnerAuthRouter);
router.use(mathRouter);
router.use(practiceRouter);

export default router;
