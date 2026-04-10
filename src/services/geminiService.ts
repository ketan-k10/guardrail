import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY_1 || process.env.GEMINI_API_KEY });

export interface PreprocessedQuery {
  original_query: string;
  corrected_query: string;
  is_safe: boolean;
  reason: string;
  suggestions: string[];
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
  timeTakenMs: number;
}

export async function preprocessQuery(
  query: string,
  allowedWords: string[] = [],
  blockedWords: string[] = []
): Promise<PreprocessedQuery> {
  const model = "gemini-3.1-flash-lite-preview";
  const startTime = performance.now();
  
//   const dictionaryInstruction = `
// ### CUSTOM USER DICTIONARY (CRITICAL PRIORITY - SEMANTIC MATCHING):
// - ALLOWED CONCEPTS: [${allowedWords.join(', ')}] (If the query contains these words, their synonyms, or closely related concepts, DO NOT flag them as unsafe, even if they normally violate policy).
// - BLOCKED CONCEPTS: [${blockedWords.join(', ')}] (If the query contains these words, their synonyms, or closely related concepts, you MUST mark "is_safe": false and state the reason as "Contains blocked concept").
// `;

//   const systemInstruction = `You are the Safety & Optimization Engine for EEVA (AI Video Analytics). 
// Your goal is to sanitize, optimize, and structure raw user queries into a JSON format while strictly enforcing ethical guardrails.
// ${dictionaryInstruction}
// ### SEARCH GUIDELINES:
// 1. ALLOWED (Descriptive): Physical descriptions of people, objects, vehicles, or environments (e.g., "woman with backpack," "red sedan," "unattended backpack," "wet floor").
// 2. PROHIBITED (Profiling): Targeting socioeconomic status, religious profiling, or discriminatory intent.

// ### CRITICAL SAFETY POLICY:
// You MUST mark "is_safe": false if the query attempts to profile, target, or filter individuals based on:
// 1. Socioeconomic status (e.g., "poor," "homeless," "beggar," "rich").
// 2. Protected characteristics used for discrimination or profiling (e.g., race, religion, disability, age). 
//    *Note: Neutral physical descriptors like gender or clothing for identification are ALLOWED.*
// 3. Harmful intent or surveillance of private behavior.

// ### TASKS:
// 1. BIAS CHECK: Identify and block any discriminatory or profiling language based on the policy above.
// 2. SPELLING & CLIP OPTIMIZATION: Fix typos. If the query is long, conversational, or complex, paraphrase and rephrase it into a concise, highly descriptive caption optimized for CLIP or similar vision-language models. Focus strictly on visual elements, remove filler words, and keep the core meaning and intent intact (ideally under 30 words). 
//    *CRITICAL RULE*: DO NOT add human context (e.g., "person carrying a...") if the original query is only about an object, vehicle, or scene. For example, "backpack" should remain "backpack" or "a backpack".
// 3. BIAS CHECK: Identify and block any discriminatory or profiling language based on the policy above.
// 4. SUGGESTIONS: For SAFE queries, provide 3 logical next steps (e.g., "Red car", "Unattended bag", "Person wearing a red jacket"). For UNSAFE queries, suggest 3 generic safety-compliant searches (e.g., "Person carrying a backpack", "Blue vehicle").

// ### OUTPUT FORMAT:
// Return ONLY a JSON object:
// {
//   "original_query": string,
//   "corrected_query": string (optimized for CLIP, empty if unsafe),
//   "is_safe": boolean,
//   "reason": string (specific policy violated or "Safe"),
//   "suggestions": string[]
// }`;

const dictionaryInstruction = `
### CUSTOM USER DICTIONARY (CRITICAL PRIORITY - SEMANTIC MATCHING):
- ALLOWED CONCEPTS: [${allowedWords.join(', ')}] (If the query contains these words, their synonyms, or closely related concepts, DO NOT flag them as unsafe, even if they normally violate policy).
- BLOCKED CONCEPTS: [${blockedWords.join(', ')}] (If the query contains these words, their synonyms, or closely related concepts, you MUST mark "is_safe": false and state the reason as "Contains blocked concept").
`;

const systemInstruction = `You are the Safety & Optimization Engine for EEVA (AI Video Analytics). 
Your goal is to sanitize, optimize, and structure raw user queries into a JSON format while strictly enforcing ethical guardrails.
${dictionaryInstruction}

### SEARCH GUIDELINES:
1. ALLOWED (Descriptive): Neutral physical descriptions of clothing, objects, vehicles, or environments (e.g., "person wearing a black shirt", "woman with backpack", "red sedan").
2. PROHIBITED (Profiling & Protected Characteristics): Targeting or identifying individuals based on socioeconomic status, religion, or any racial/skin color descriptors (e.g., "black person", "white man", "asian woman").

### CRITICAL SAFETY POLICY:
You MUST mark "is_safe": false if the query contains or attempts to filter individuals based on:
1. Socioeconomic status (e.g., "poor", "homeless", "beggar", "rich").
2. Protected characteristics, strictly INCLUDING race, ethnicity, or skin color. 
   *CRITICAL RULE*: Any query mentioning race or skin tone (e.g., "black person in a black shirt") MUST be flagged as UNSAFE. Do not attempt to "fix" or "sanitize" it into a safe query; it must be rejected outright.
3. Harmful intent or surveillance of private behavior.

### TASKS:
1. BIAS CHECK: Identify and block any language violating the policy above. If a query uses racial or skin color descriptors, you MUST set "is_safe": false and provide a specific reason (e.g., "Unsafe: Contains protected characteristic (race/skin color)").
2. SPELLING & CLIP OPTIMIZATION: For SAFE queries only, fix typos and rephrase into a concise, highly descriptive caption optimized for CLIP (under 30 words). If the query is UNSAFE, you MUST leave "corrected_query" completely empty.
   *CRITICAL RULE*: DO NOT add human context (e.g., "person carrying a...") if the original query is only about an object, vehicle, or scene.
3. SUGGESTIONS: For SAFE queries, provide 3 logical next steps. For UNSAFE queries, suggest 3 generic, safety-compliant alternative searches (e.g., "Person wearing a black shirt", "Person carrying a backpack").

### OUTPUT FORMAT:
Return ONLY a JSON object:
{
  "original_query": string,
  "corrected_query": string (optimized for CLIP, must be empty if unsafe),
  "is_safe": boolean,
  "reason": string (specific policy violated or "Safe"),
  "suggestions": string[]
}`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: query }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        seed: 42, temperature : 0.0,
        safetySettings: [ 
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        ],
      },
    });

    if (response.candidates?.[0]?.finishReason === 'SAFETY') {
      return {
        original_query: query,
        corrected_query: "",
        is_safe: false,
        reason: "The query was blocked by safety filters. Please rephrase your search.",
        suggestions: [],
        usageMetadata: { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 },
        timeTakenMs: Math.round(performance.now() - startTime)
      };
    }

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from AI");
    }

    const parsed = JSON.parse(text);
    
    return {
      ...parsed,
      usageMetadata: {
        promptTokenCount: response.usageMetadata?.promptTokenCount || 0,
        candidatesTokenCount: response.usageMetadata?.candidatesTokenCount || 0,
        totalTokenCount: response.usageMetadata?.totalTokenCount || 0,
      },
      timeTakenMs: Math.round(performance.now() - startTime)
    };
  } catch (error: any) {
    console.error("Error preprocessing query:", error);
    
    let reason = "An error occurred while processing the query. Please try again.";
    
    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      reason = "API rate limit exceeded. Please wait a moment and try again.";
    } else if (error.status === 403 || error.message?.includes('403') || error.message?.includes('PERMISSION_DENIED')) {
      reason = "API permission denied. Please check your API key configuration.";
    }

    return {
      original_query: query,
      corrected_query: query,
      is_safe: false,
      reason,
      suggestions: [],
      usageMetadata: { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 },
      timeTakenMs: Math.round(performance.now() - startTime)
    };
  }
}
