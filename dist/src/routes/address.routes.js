"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const address_controller_1 = require("../controllers/address.controller");
const isAuth_1 = require("../middlewares/isAuth");
const router = (0, express_1.Router)();
// ➕ Create address
router.post("/", isAuth_1.isAuth, address_controller_1.createAddress);
// 📥 Get my addresses
router.get("/", isAuth_1.isAuth, address_controller_1.getMyAddresses);
// ✏️ Update address
router.put("/:id", isAuth_1.isAuth, address_controller_1.updateAddress);
// 🗑️ Delete address
router.delete("/:id", isAuth_1.isAuth, address_controller_1.deleteAddress);
exports.default = router;
