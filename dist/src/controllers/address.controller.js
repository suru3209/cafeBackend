"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAddress = exports.updateAddress = exports.getMyAddresses = exports.createAddress = void 0;
const prisma_1 = require("../utils/prisma");
/**
 * ➕ Create new address
 */
const createAddress = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { label, address, city, state, zipCode, latitude, longitude, isDefault, } = req.body;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }
        // ✅ Validation
        if (!label ||
            !address ||
            !city ||
            !state ||
            !zipCode ||
            latitude == null ||
            longitude == null) {
            return res.status(400).json({
                message: "Complete address required (including pincode)",
            });
        }
        // 🔹 First address OR explicitly default
        const count = await prisma_1.prisma.address.count({
            where: { userId },
        });
        const shouldBeDefault = count === 0 || isDefault === true;
        if (shouldBeDefault) {
            await prisma_1.prisma.address.updateMany({
                where: { userId },
                data: { isDefault: false },
            });
        }
        const newAddress = await prisma_1.prisma.address.create({
            data: {
                userId,
                label,
                address,
                city,
                state,
                zipCode,
                latitude,
                longitude,
                isDefault: shouldBeDefault,
            },
        });
        return res.status(201).json({
            success: true,
            address: newAddress,
        });
    }
    catch (error) {
        console.error("CREATE ADDRESS ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create address",
        });
    }
};
exports.createAddress = createAddress;
/**
 * 📥 Get logged-in user's addresses
 */
const getMyAddresses = async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }
        const addresses = await prisma_1.prisma.address.findMany({
            where: { userId },
            orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        });
        return res.json({
            success: true,
            addresses,
        });
    }
    catch (error) {
        console.error("GET ADDRESS ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch addresses",
        });
    }
};
exports.getMyAddresses = getMyAddresses;
/**
 * ✏️ Update address
 */
const updateAddress = async (req, res) => {
    try {
        const userId = req.session.userId;
        const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
        const { label, address, city, state, zipCode, latitude, longitude, isDefault, } = req.body;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }
        const existing = await prisma_1.prisma.address.findFirst({
            where: { id, userId },
        });
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Address not found",
            });
        }
        if (isDefault === true) {
            await prisma_1.prisma.address.updateMany({
                where: { userId },
                data: { isDefault: false },
            });
        }
        const updated = await prisma_1.prisma.address.update({
            where: { id },
            data: {
                label: label ?? existing.label,
                address: address ?? existing.address,
                city: city ?? existing.city,
                state: state ?? existing.state,
                zipCode: zipCode ?? existing.zipCode,
                latitude: typeof latitude === "number" ? latitude : existing.latitude,
                longitude: typeof longitude === "number" ? longitude : existing.longitude,
                isDefault: isDefault ?? existing.isDefault,
            },
        });
        return res.json({
            success: true,
            address: updated,
        });
    }
    catch (error) {
        console.error("UPDATE ADDRESS ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update address",
        });
    }
};
exports.updateAddress = updateAddress;
/**
 * 🗑️ Delete address
 */
const deleteAddress = async (req, res) => {
    try {
        const userId = req.session.userId;
        const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const existing = await prisma_1.prisma.address.findFirst({
            where: { id, userId },
            include: { orders: true },
        });
        if (!existing) {
            return res
                .status(404)
                .json({ success: false, message: "Address not found" });
        }
        if (existing.orders.length > 0) {
            return res.status(400).json({
                success: false,
                message: "This address is used in orders and cannot be deleted",
            });
        }
        await prisma_1.prisma.address.delete({ where: { id } });
        return res.json({ success: true });
    }
    catch (error) {
        console.error("DELETE ADDRESS ERROR:", error);
        return res
            .status(500)
            .json({ success: false, message: "Failed to delete address" });
    }
};
exports.deleteAddress = deleteAddress;
