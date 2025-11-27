const { GoogleGenerativeAI } = require("@google/generative-ai");

if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is not set in environment variables!');
}

const genAI = process.env.GEMINI_API_KEY 
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

/**
 * Suggest important questions based on uploaded content
 */
const suggestImportantQuestions = async (extractedText, subjectName = null) => {
    if (!genAI) {
        console.warn('⚠️ GEMINI_API_KEY not set, returning empty suggestions');
        return { suggestions: [] };
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const textToUse = extractedText.length > 30000 ? extractedText.substring(0, 30000) : extractedText;

        const prompt = `You are an expert academic question paper generator. Analyze the following course content and suggest 10-15 important questions that should be included in an exam paper.

Subject: ${subjectName || 'General Subject'}

Course Content:
${textToUse}

Based on the content, suggest important questions that:
1. Cover key concepts and theories
2. Test understanding at different cognitive levels (Remember, Understand, Apply, Analyze, Evaluate, Create)
3. Include both theoretical and numerical questions where applicable
4. Focus on important topics that students must know
5. Are suitable for examination purposes

Return a JSON array with this EXACT structure:
[
  {
    "question": "Complete question text here",
    "questionType": "Theoretical" or "Numerical" or "Multiple Choice" or "Problem Solving",
    "difficulty": "Easy" or "Medium" or "Hard",
    "bloomLevel": "Remember" or "Understand" or "Apply" or "Analyze" or "Evaluate" or "Create",
    "topic": "Topic or chapter name this question relates to",
    "reason": "Why this question is important"
  }
]

IMPORTANT: Return ONLY valid JSON array, no markdown, no code blocks.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean and parse JSON
        let cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const jsonMatch = cleanText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            cleanText = jsonMatch[0];
        }

        try {
            const suggestions = JSON.parse(cleanText);
            if (Array.isArray(suggestions)) {
                return { suggestions: suggestions.slice(0, 15) }; // Limit to 15
            }
        } catch (parseError) {
            console.error('Failed to parse suggestions:', parseError);
        }

        // Fallback: Extract questions using regex
        const questionPattern = /["']question["']\s*:\s*["']([^"']+)["']/gi;
        const questions = [];
        let match;
        while ((match = questionPattern.exec(text)) !== null && questions.length < 10) {
            questions.push({
                question: match[1],
                questionType: 'Theoretical',
                difficulty: 'Medium',
                bloomLevel: 'Understand',
                topic: 'General',
                reason: 'Extracted from content analysis'
            });
        }

        return { suggestions: questions };
    } catch (error) {
        console.error('Error generating question suggestions:', error);
        return { suggestions: [], error: error.message };
    }
};

module.exports = { suggestImportantQuestions };




