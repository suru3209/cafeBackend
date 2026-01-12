import { Router } from "express";
import { generateInvoice } from "../controllers/invoice.controller";
import { isAuth } from "../middlewares/isAuth";
const router = Router();
// User & Admin both can access their invoice
router.get("/:orderId", isAuth, generateInvoice);
export default router;
