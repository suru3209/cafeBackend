"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const invoice_controller_1 = require("../controllers/invoice.controller");
const isAuth_1 = require("../middlewares/isAuth");
const router = (0, express_1.Router)();
// User & Admin both can access their invoice
router.get("/:orderId", isAuth_1.isAuth, invoice_controller_1.generateInvoice);
exports.default = router;
