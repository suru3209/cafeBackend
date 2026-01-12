import { Router } from "express";
import {
  createAddress,
  getMyAddresses,
  updateAddress,
  deleteAddress,
} from "../controllers/address.controller";
import { isAuth } from "../middlewares/isAuth";

const router = Router();

// ➕ Create address
router.post("/", isAuth, createAddress);

// 📥 Get my addresses
router.get("/", isAuth, getMyAddresses);

// ✏️ Update address
router.put("/:id", isAuth, updateAddress);

// 🗑️ Delete address
router.delete("/:id", isAuth, deleteAddress);

export default router;
