import { GoogleGenerativeAI } from "@google/generative-ai";
import { PDFParse } from "pdf-parse";
import { supabaseAdmin } from "./supabaseAdmin";

const CV_BUCKET_NAME = "CV";

const geminiApiKey =
  process.env.GEMINI_KEY ||
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  "";

const geminiClient = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];

type GeminiEvaluationResult = {
  score: number;
  matchingSkills: string[];
  missingSkills: string[];
  summary: string;
  candidateExperienceYears?: number | null;
  experienceMatch?: boolean;
  experienceGap?: number | null;
};

function normalizeSkillList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) =>
      typeof item === "string" ? item.trim() : String(item).trim(),
    )
    .filter((item) => item.length > 0);
}

function extractJsonObject(value: string): string | null {
  const trimmedValue = value.trim();

  const fencedJsonMatch = trimmedValue.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fencedJsonMatch?.[1]) {
    return fencedJsonMatch[1].trim();
  }

  const firstBrace = trimmedValue.indexOf("{");
  const lastBrace = trimmedValue.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  return trimmedValue.slice(firstBrace, lastBrace + 1);
}

export async function extractPdfText(fileBuffer: Buffer): Promise<string> {
  try {
    const parser = new PDFParse({ data: fileBuffer });

    try {
      const result = await parser.getText();
      return result.text || "";
    } finally {
      await parser.destroy().catch(() => undefined);
    }
  } catch (error) {
    console.error("Error extracting PDF text:", error);
    return "";
  }
}

export async function extractCvTextFromSupabase(
  cvFilePath: string,
): Promise<string> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(CV_BUCKET_NAME)
      .download(cvFilePath);

    if (error || !data) {
      console.error("Error downloading CV from Supabase:", error);
      return "";
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    return extractPdfText(buffer);
  } catch (error) {
    console.error("Error extracting CV text from Supabase:", error);
    return "";
  }
}

export async function evaluateApplicationAI(params: {
  cvText: string;
  jobRequirements: string | null;
  jobSkills: Array<{ name: string }>;
  jobTitle: string;
  jobExperienceYears?: number | null;
}): Promise<GeminiEvaluationResult> {
  const skillNames = normalizeSkillList(
    params.jobSkills.map((skill) => skill.name),
  );
  const prompt = `You are an expert recruiter and CV evaluator.

Evaluate the candidate CV against the job title, job requirement, and required skills.

Job Title:
${params.jobTitle}

Job Requirement:
${params.jobRequirements || "No specific requirement provided"}

Required Skills:
${skillNames.length > 0 ? skillNames.join(", ") : "No required skills provided"}

Required Experience:
${
  typeof params.jobExperienceYears === "number"
    ? `${params.jobExperienceYears} years`
    : "No specific experience requirement provided"
}

CV Text:
${params.cvText || "No CV text extracted"}

Return ONLY valid JSON with exactly this structure:
{
  "score": number, 
  "matchingSkills": [string],
  "missingSkills": [string],
  "summary": string,
  "candidateExperienceYears": number | null,
  "experienceMatch": boolean,
  "experienceGap": number | null
}

Rules:
- score must be an integer from 0 to 100.
- matchingSkills should include required skills clearly found in the CV.
- missingSkills should include required skills not found in the CV.
- summary should be more detailed, 2-4 sentences.
- summary must clearly state the CV's strengths and weaknesses.
- summary should mention strengths in skills, experience, or relevance, and weaknesses such as missing skills, limited experience, or unclear details.
- Keep the summary practical and recruiter-focused, without being overly verbose.
- Infer candidateExperienceYears from the CV's work history, profile summary, or experience section.
- If Required Experience is provided, compare it against candidateExperienceYears and set experienceMatch and experienceGap.
- Lower the score if the candidate's experience is below the requirement.
- Do not include markdown, backticks, or any extra text.`;

  if (!geminiClient) {
    console.error("Gemini API key is missing");
    return {
      score: 0,
      matchingSkills: [],
      missingSkills: skillNames,
      summary: "Gemini API key is missing",
    };
  }

  for (const modelName of GEMINI_MODELS) {
    try {
      const model = geminiClient.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const jsonText = extractJsonObject(responseText);

      if (!jsonText) {
        console.error(
          `Could not extract JSON from Gemini response for ${modelName}:`,
          responseText,
        );
        continue;
      }

      const parsed = JSON.parse(jsonText) as Partial<GeminiEvaluationResult>;

      return {
        score: Math.max(
          0,
          Math.min(100, Math.round(Number(parsed.score) || 0)),
        ),
        matchingSkills: normalizeSkillList(parsed.matchingSkills),
        missingSkills: normalizeSkillList(parsed.missingSkills),
        summary:
          typeof parsed.summary === "string" && parsed.summary.trim()
            ? parsed.summary.trim()
            : "No summary available",
        candidateExperienceYears:
          typeof parsed.candidateExperienceYears === "number"
            ? parsed.candidateExperienceYears
            : null,
        experienceMatch: Boolean(parsed.experienceMatch),
        experienceGap:
          typeof parsed.experienceGap === "number"
            ? parsed.experienceGap
            : null,
      };
    } catch (error) {
      console.error(
        `Error evaluating CV with Gemini model ${modelName}:`,
        error,
      );
    }
  }

  return {
    score: 0,
    matchingSkills: [],
    missingSkills: skillNames,
    summary: "Error evaluating CV with AI",
  };
}
