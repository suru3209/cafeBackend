import { Router } from "express";
import { getMyOrders, placeOrder } from "../controllers/order.controller";
import { isAuth } from "../middlewares/isAuth";
const router = Router();
router.post("/", isAuth, placeOrder);
router.get("/my", isAuth, getMyOrders);
export default router;
