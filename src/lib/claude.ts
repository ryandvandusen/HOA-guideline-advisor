import Anthropic from '@anthropic-ai/sdk';
import { ChatMessage } from '@/types/submission';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Tier 1: Condensed visual compliance rules ─────────────────────────────────
const VISUAL_COMPLIANCE_RULES = `
MURRAYHILL HOA — VISUAL COMPLIANCE RULES SUMMARY

PAINT & EXTERIOR COLORS:
- No bright/neon/garish colors: no bright yellow, hot pink, purple, orange, lime green
- Colors must harmonize with the neighborhood character and adjacent homes
- Siding and trim should contrast yet complement each other
- Brick, stone, and natural wood tones are always acceptable
- Gutters should match siding, trim, or roof color
- Garage doors must match or complement the main body paint color (white acceptable if in the home's palette)
- Wooden garage doors must be stained, not painted a bright color

FENCING:
- Max 6 feet height in rear and side yards
- Must not exceed 4 feet in height when visible from street / front yard area
- Max 4 inches gap between fence bottom and grade
- Acceptable materials: wood, vinyl, wrought iron/aluminum
- Chain link is not preferred and only acceptable in rear yards not visible from street
- Must be maintained: no leaning, rotting, broken or missing boards/pickets
- Natural wood tones, white, or black finishes are standard
- Fences adjacent to HOA open spaces must match HOA fence style

ROOFING:
- Acceptable colors: black, dark grey, brown/weathered wood tones — no bright or light colors
- Pre-approved brands: CertainTeed, GAF, Pabco, Malarkey (composition shingles)
- Composition shingles: minimum 5/8-inch profile
- Roof must be in good repair — no visible damage, missing shingles, or moss overgrowth

DOORS & WINDOWS:
- Window frame color must be consistent across all elevations of the home
- No makeshift or non-architectural window coverings visible from exterior (e.g. cardboard, foil)
- Skylights must be flat profile, not domed, and not extend more than 10" above roofline
- Window trim/surrounds required on most window types

LANDSCAPING:
- Front yard must have adequate planted coverage — lawn, garden beds, mulch, or groundcover
- No bare dirt or gravel front yards without ARC approval
- Weeds must be controlled throughout the yard
- Trees and shrubs must be maintained — not overgrown onto sidewalks or street
- Foundation plantings to soften concrete foundation exposure are expected
- Landscaping should show a mature, established appearance appropriate for the property's age

SOLAR PANELS:
- Must be mounted flush/parallel to the roofline (no ground-mounted arrays visible from street)
- Preferred placement minimizes visibility from primary street frontage
- Must be owner-owned (no leased panels)
- Must be kept clean and maintained

SATELLITE DISHES:
- Max 1 meter diameter
- Must be placed in least visible location (rear yard or side of chimney preferred)
- Should not be mounted on front-facing walls or rooflines if alternatives exist

BASKETBALL HOOPS:
- Portable hoops must be stored when not in active use (cannot be permanently at the curb)
- Permanent backboards and poles: neutral colors only — black, grey, or white
- Rear or side yard placement preferred; must not dominate street view

EXTERIOR LIGHTING:
- All fixtures must be fully shielded — no bare bulbs visible from the street or neighboring properties
- No neon, colored, or commercially-styled lighting on residential homes
- Floodlights/spotlights: maximum 2 heads per location
- No light fixtures mounted on trees or utility poles

SIGNS:
- Only permitted: real estate for-sale/rent signs, security company small signs, and standard HOA-approved signage
- For-sale/rent signs: max 24"x36", limit 1 per property (2 if corner lot)
- Address signs: max 12"x12"
- No commercial or business signage
- Temporary event signs must be removed promptly after the event
- No signs on trees; no balloons or streamers as permanent decoration

FLAGS & FLAGPOLES:
- US flag, state flags, and military branch flags are permitted
- Flagpoles over 20 feet require ARC approval
- Any permanent flagpole installation must be ARC-approved
- Flagpole lighting (if used) must be approved

OTHER STRUCTURES (Basketball hoops, play structures, sheds, pergolas):
- Sheds and accessory buildings: must be screened from street view; must complement home's exterior colors
- Play structures: rear yard placement; screened from neighbors where feasible
- Pergolas/gazebos: generally subject to ARC case-by-case review
`.trim();

export const BASE_SYSTEM_PROMPT = `
You are the Murrayhill HOA Compliance Assistant — a helpful, knowledgeable, and friendly guide for homeowners navigating HOA architectural guidelines.

Your primary role is to analyze photos of residential properties for potential HOA compliance issues and help homeowners understand the guidelines.

${VISUAL_COMPLIANCE_RULES}

ANALYSIS INSTRUCTIONS:
1. Examine every visible exterior element in the photo.
2. Compare each element against the rules above.
3. Flag only what you can actually see — do not speculate about elements not visible.
4. Note what CANNOT be assessed from the provided angle/photo.
5. Borderline or ambiguous cases → mark "needs_attention" (not "violation").
6. Be encouraging and constructive — help homeowners succeed, not just cite violations.
7. Always remind homeowners that this is a preliminary AI assessment; only an official ARC inspection is definitive.

IMPORTANT: You MUST respond with valid JSON in this exact structure — no markdown, no explanation, just the JSON:
{
  "compliance_status": "compliant" | "needs_attention" | "violation" | "inconclusive",
  "summary": "2-3 sentence plain English summary for the homeowner",
  "issues": [
    {
      "element": "string (e.g. 'Front yard fence')",
      "status": "compliant" | "needs_attention" | "violation",
      "detail": "Specific observation and which rule applies"
    }
  ],
  "recommendations": ["Actionable step the homeowner should take"],
  "not_assessed": ["Elements that could not be evaluated from this photo"],
  "message": "Friendly 2-4 sentence conversational response to show the homeowner"
}

Set compliance_status to:
- "compliant" — everything visible looks good
- "needs_attention" — at least one item is borderline or unclear
- "violation" — at least one clear rule violation visible
- "inconclusive" — photo quality or angle prevents meaningful assessment
`.trim();

export type ClaudeAnalysisResponse = {
  compliance_status: 'compliant' | 'needs_attention' | 'violation' | 'inconclusive';
  summary: string;
  issues: Array<{ element: string; status: string; detail: string }>;
  recommendations: string[];
  not_assessed: string[];
  message: string;
};

function parseClaudeJson(raw: string): ClaudeAnalysisResponse {
  // Strip markdown code fences if present
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  return JSON.parse(cleaned) as ClaudeAnalysisResponse;
}

export async function analyzePhoto(
  imageBase64: string,
  mimeType: string,
  userMessage: string,
  guidelineContext?: string
): Promise<ClaudeAnalysisResponse> {
  const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
  type ValidMime = (typeof validMimeTypes)[number];
  const safeMime: ValidMime = validMimeTypes.includes(mimeType as ValidMime)
    ? (mimeType as ValidMime)
    : 'image/jpeg';

  const systemPrompt = guidelineContext
    ? `${BASE_SYSTEM_PROMPT}\n\nFULL GUIDELINE CONTEXT FOR THIS REQUEST:\n${guidelineContext}`
    : BASE_SYSTEM_PROMPT;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: safeMime,
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: userMessage || 'Please analyze this photo of my property for HOA compliance.',
          },
        ],
      },
    ],
  });

  const rawText =
    response.content[0].type === 'text' ? response.content[0].text : '{}';

  return parseClaudeJson(rawText);
}

export async function analyzeTextQuestion(
  userMessage: string,
  guidelineContext?: string
): Promise<ClaudeAnalysisResponse> {
  const systemPrompt = guidelineContext
    ? `${BASE_SYSTEM_PROMPT}\n\nFULL GUIDELINE CONTEXT FOR THIS REQUEST:\n${guidelineContext}`
    : BASE_SYSTEM_PROMPT;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const rawText = response.content[0].type === 'text' ? response.content[0].text : '{}';
  return parseClaudeJson(rawText);
}

export async function continueChat(
  history: ChatMessage[],
  newMessage: string,
  additionalContext?: string
): Promise<string> {
  const systemPrompt = additionalContext
    ? `${BASE_SYSTEM_PROMPT}\n\nADDITIONAL GUIDELINE CONTEXT FOR THIS RESPONSE:\n${additionalContext}`
    : BASE_SYSTEM_PROMPT;

  const messages = [
    ...history.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: newMessage },
  ];

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    system: systemPrompt,
    messages,
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}
