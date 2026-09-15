import { Router } from "express";
import healthRouter from "./health";
import categoriesRouter from "./categories";
import suppliersRouter from "./suppliers";
import productsRouter from "./products";
import ordersRouter from "./orders";
import promotionsRouter from "./promotions";
import reviewsRouter from "./reviews";
import statsRouter from "./stats";

const router = Router();

router.use(healthRouter);
router.use(categoriesRouter);
router.use(suppliersRouter);
router.use(productsRouter);
router.use(ordersRouter);
router.use(promotionsRouter);
router.use(reviewsRouter);
router.use(statsRouter);

export default router;
