import { prisma } from "../lib/prisma";
const ROLE_RECRUITER = 2;
function parseUserId(rawUserId) {
    const normalizedValue = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;
    const userId = Number(normalizedValue);
    if (!Number.isInteger(userId) || userId <= 0) {
        return null;
    }
    return userId;
}
function parseCategoryId(rawCategoryId) {
    if (rawCategoryId === null) {
        return null;
    }
    const categoryId = Number(rawCategoryId);
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
        return null;
    }
    return categoryId;
}
function parseCityId(rawCityId) {
    if (rawCityId === null) {
        return null;
    }
    const cityId = Number(rawCityId);
    if (!Number.isInteger(cityId) || cityId <= 0) {
        return null;
    }
    return cityId;
}
export const getCategories = async (_req, res) => {
    try {
        await prisma.$connect();
        const categories = await prisma.category.findMany({
            orderBy: { title: "asc" },
            select: {
                category_id: true,
                title: true,
            },
        });
        res.status(200).json({ categories });
    }
    catch (error) {
        console.error("Get categories error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        res
            .status(500)
            .json({ message: "Internal server error", error: errorMessage });
    }
};
export const getCities = async (_req, res) => {
    try {
        await prisma.$connect();
        const cities = await prisma.city.findMany({
            orderBy: { name: "asc" },
            select: {
                city_id: true,
                name: true,
            },
        });
        res.status(200).json({ cities });
    }
    catch (error) {
        console.error("Get cities error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        res
            .status(500)
            .json({ message: "Internal server error", error: errorMessage });
    }
};
export const getCompanyProfile = async (req, res) => {
    try {
        await prisma.$connect();
        const userId = parseUserId(req.params.userId);
        if (!userId) {
            res.status(400).json({ message: "Invalid user id" });
            return;
        }
        const user = await prisma.user.findUnique({
            where: { user_id: userId },
            include: { role: true },
        });
        if (!user || user.role_id !== ROLE_RECRUITER) {
            res.status(403).json({ message: "Access denied" });
            return;
        }
        const company = await prisma.company.findFirst({
            where: { user_id: userId },
            include: { category: true, city: true },
        });
        if (!company) {
            res.status(404).json({ message: "Company profile not found" });
            return;
        }
        res.status(200).json({ company });
    }
    catch (error) {
        console.error("Get company profile error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        res
            .status(500)
            .json({ message: "Internal server error", error: errorMessage });
    }
};
export const updateCompanyProfile = async (req, res) => {
    try {
        await prisma.$connect();
        const userId = parseUserId(req.params.userId);
        if (!userId) {
            res.status(400).json({ message: "Invalid user id" });
            return;
        }
        const user = await prisma.user.findUnique({
            where: { user_id: userId },
            include: { role: true },
        });
        if (!user || user.role_id !== ROLE_RECRUITER) {
            res.status(403).json({ message: "Access denied" });
            return;
        }
        const existingCompany = await prisma.company.findFirst({
            where: { user_id: userId },
        });
        if (!existingCompany) {
            res.status(404).json({ message: "Company profile not found" });
            return;
        }
        const { name, website, description, category_id, city_id, address } = req.body;
        if (typeof name === "string" && !name.trim()) {
            res.status(400).json({ message: "Company name cannot be empty" });
            return;
        }
        if (category_id !== undefined && category_id !== null) {
            const parsedCategoryId = parseCategoryId(category_id);
            if (!parsedCategoryId) {
                res.status(400).json({ message: "Invalid category" });
                return;
            }
            const existingCategory = await prisma.category.findUnique({
                where: { category_id: parsedCategoryId },
            });
            if (!existingCategory) {
                res.status(400).json({ message: "Selected category does not exist" });
                return;
            }
        }
        if (city_id !== undefined && city_id !== null) {
            const parsedCityId = parseCityId(city_id);
            if (!parsedCityId) {
                res.status(400).json({ message: "Invalid city" });
                return;
            }
            const existingCity = await prisma.city.findUnique({
                where: { city_id: parsedCityId },
            });
            if (!existingCity) {
                res.status(400).json({ message: "Selected city does not exist" });
                return;
            }
        }
        const updatedCompany = await prisma.company.update({
            where: { company_id: existingCompany.company_id },
            data: {
                ...(typeof name === "string" ? { name: name.trim() } : {}),
                ...(typeof website === "string" ? { website: website.trim() } : {}),
                ...(typeof address === "string" ? { address: address.trim() } : {}),
                ...(typeof description === "string"
                    ? { description: description.trim() }
                    : {}),
                ...(category_id !== undefined
                    ? { category_id: parseCategoryId(category_id) }
                    : {}),
                ...(city_id !== undefined ? { city_id: parseCityId(city_id) } : {}),
            },
            include: { category: true, city: true },
        });
        res.status(200).json({
            message: "Company profile updated successfully",
            company: updatedCompany,
        });
    }
    catch (error) {
        console.error("Update company profile error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        res
            .status(500)
            .json({ message: "Internal server error", error: errorMessage });
    }
};
