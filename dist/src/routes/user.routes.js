"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../utils/prisma");
const isAuth_1 = require("../middlewares/isAuth");
const router = (0, express_1.Router)();
router.put("/update-profile", isAuth_1.isAuth, async (req, res) => {
    try {
        const { name, email } = req.body;
        const user = await prisma_1.prisma.user.update({
            where: { id: req.session.userId },
            data: { name, email },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            },
        });
        res.json({ user });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to update profile" });
    }
});
exports.default = router;
