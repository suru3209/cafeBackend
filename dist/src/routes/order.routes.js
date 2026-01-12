"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_controller_1 = require("../controllers/order.controller");
const isAuth_1 = require("../middlewares/isAuth");
const router = (0, express_1.Router)();
router.post("/", isAuth_1.isAuth, order_controller_1.placeOrder);
router.get("/my", isAuth_1.isAuth, order_controller_1.getMyOrders);
exports.default = router;
