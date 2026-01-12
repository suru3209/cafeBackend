"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../utils/prisma");
const router = (0, express_1.Router)();
//get all categories
router.get("/", async (req, res) => {
    const categories = await prisma_1.prisma.category.findMany({
        orderBy: { name: "asc" },
    });
    res.json({ success: true, categories });
});
exports.default = router;
