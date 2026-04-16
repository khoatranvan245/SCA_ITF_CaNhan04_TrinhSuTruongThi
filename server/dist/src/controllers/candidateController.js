import { prisma } from "../lib/prisma";
const ROLE_CANDIDATE = 1;
function normalizeSkillName(value) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[đĐ]/g, "d")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toLowerCase();
}
function parseUserId(rawUserId) {
    const normalizedValue = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;
    const userId = Number(normalizedValue);
    if (!Number.isInteger(userId) || userId <= 0) {
        return null;
    }
    return userId;
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
export const getCandidateCities = async (_req, res) => {
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
        console.error("Get candidate cities error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        res
            .status(500)
            .json({ message: "Internal server error", error: errorMessage });
    }
};
export const getCandidateProfile = async (req, res) => {
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
        if (!user || user.role_id !== ROLE_CANDIDATE) {
            res.status(403).json({ message: "Access denied" });
            return;
        }
        const candidate = await prisma.candidate.findFirst({
            where: { user_id: userId },
            include: {
                city: true,
                candidate_skills: {
                    include: {
                        skill: true,
                    },
                },
            },
        });
        if (!candidate) {
            res.status(404).json({ message: "Candidate profile not found" });
            return;
        }
        res.status(200).json({
            candidate: {
                candidate_id: candidate.candidate_id,
                user_id: candidate.user_id,
                full_name: candidate.full_name,
                phone: candidate.phone,
                experience_years: candidate.experience_years,
                city_id: candidate.city_id,
                city: candidate.city,
                skills: candidate.candidate_skills.map((item) => item.skill.name),
            },
            user: {
                user_id: user.user_id,
                email: user.email,
            },
        });
    }
    catch (error) {
        console.error("Get candidate profile error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        res
            .status(500)
            .json({ message: "Internal server error", error: errorMessage });
    }
};
export const updateCandidateProfile = async (req, res) => {
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
        if (!user || user.role_id !== ROLE_CANDIDATE) {
            res.status(403).json({ message: "Access denied" });
            return;
        }
        const existingCandidate = await prisma.candidate.findFirst({
            where: { user_id: userId },
        });
        if (!existingCandidate) {
            res.status(404).json({ message: "Candidate profile not found" });
            return;
        }
        const { full_name, phone, experience_years, city_id } = req.body;
        const skillsInput = Array.isArray(req.body.skills)
            ? req.body.skills
            : typeof req.body.skills === "string" && req.body.skills.trim()
                ? req.body.skills.split(",")
                : [];
        if (typeof full_name === "string" && !full_name.trim()) {
            res.status(400).json({ message: "Full name cannot be empty" });
            return;
        }
        if (experience_years !== undefined && experience_years !== null) {
            const parsedYears = Number(experience_years);
            if (!Number.isInteger(parsedYears) || parsedYears < 0) {
                res.status(400).json({ message: "Invalid experience years" });
                return;
            }
        }
        if (city_id !== undefined) {
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
        const normalizedSkillNames = Array.from(skillsInput
            .reduce((skillMap, skill) => {
            const trimmedSkill = typeof skill === "string" ? skill.trim() : String(skill).trim();
            if (!trimmedSkill) {
                return skillMap;
            }
            const normalizedKey = normalizeSkillName(trimmedSkill);
            if (!normalizedKey || skillMap.has(normalizedKey)) {
                return skillMap;
            }
            skillMap.set(normalizedKey, trimmedSkill);
            return skillMap;
        }, new Map())
            .values());
        const updatedCandidate = await prisma.$transaction(async (transaction) => {
            const savedCandidate = await transaction.candidate.update({
                where: { candidate_id: existingCandidate.candidate_id },
                data: {
                    ...(typeof full_name === "string"
                        ? { full_name: full_name.trim() }
                        : {}),
                    ...(typeof phone === "string" ? { phone: phone.trim() || null } : {}),
                    ...(experience_years !== undefined
                        ? {
                            experience_years: experience_years === null ? null : Number(experience_years),
                        }
                        : {}),
                    ...(city_id !== undefined ? { city_id: Number(city_id) } : {}),
                },
                include: {
                    city: true,
                },
            });
            if (skillsInput !== undefined) {
                await transaction.candidateSkill.deleteMany({
                    where: { candidate_id: savedCandidate.candidate_id },
                });
                if (normalizedSkillNames.length > 0) {
                    const linkedSkills = [];
                    for (const skillName of normalizedSkillNames) {
                        const skill = await transaction.skill.findFirst({
                            where: {
                                OR: [
                                    { name: skillName },
                                    { name: { equals: skillName, mode: "insensitive" } },
                                ],
                            },
                        });
                        if (skill) {
                            linkedSkills.push({ skill_id: skill.skill_id, name: skill.name });
                            continue;
                        }
                        const createdSkill = await transaction.skill.create({
                            data: { name: skillName },
                        });
                        linkedSkills.push({
                            skill_id: createdSkill.skill_id,
                            name: createdSkill.name,
                        });
                    }
                    await transaction.candidateSkill.createMany({
                        data: linkedSkills.map((skill) => ({
                            candidate_id: savedCandidate.candidate_id,
                            skill_id: skill.skill_id,
                        })),
                    });
                }
            }
            return transaction.candidate.findUnique({
                where: { candidate_id: savedCandidate.candidate_id },
                include: {
                    city: true,
                    candidate_skills: {
                        include: {
                            skill: true,
                        },
                    },
                },
            });
        });
        if (!updatedCandidate) {
            res.status(404).json({ message: "Candidate profile not found" });
            return;
        }
        res.status(200).json({
            message: "Candidate profile updated successfully",
            candidate: {
                candidate_id: updatedCandidate.candidate_id,
                user_id: updatedCandidate.user_id,
                full_name: updatedCandidate.full_name,
                phone: updatedCandidate.phone,
                experience_years: updatedCandidate.experience_years,
                city_id: updatedCandidate.city_id,
                city: updatedCandidate.city,
                skills: updatedCandidate.candidate_skills.map((item) => item.skill.name),
            },
            user: {
                user_id: user.user_id,
                email: user.email,
            },
        });
    }
    catch (error) {
        console.error("Update candidate profile error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        res
            .status(500)
            .json({ message: "Internal server error", error: errorMessage });
    }
};
