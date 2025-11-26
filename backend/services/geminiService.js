const { GoogleGenerativeAI } = require("@google/generative-ai");

if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is not set in environment variables!');
    console.error('⚠️  Paper generation will fail without this key');
}

const genAI = process.env.GEMINI_API_KEY 
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

const generatePaper = async ({
  extractedText,
  templateConfig,
  difficulty,
  weightage,
  questionTypes,
  sections,
  bloomsTaxonomy,
  mandatoryList,
  generateAnswerKey,
  setsRequired,
  previousVersions = [],
  referenceQuestions = [],
  importantTopics = '',
  cifData = null,
  duration = '3 Hours'
}) => {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY is not configured. Please set it in environment variables.');
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const sectionsInfo = sections ? sections.map(s => {
    const typeNote = s.questionType === 'Mixed' 
      ? 'Type: Mixed (can use any question type)' 
      : `REQUIRED TYPE: ${s.questionType} (ALL ${s.questionCount} questions in this section MUST be ${s.questionType} type)`;
    return `${s.name}: ${s.questionCount} questions, ${s.marks} marks, ${typeNote}`;
  }).join('; ') : '';
  const bloomsInfo = bloomsTaxonomy ? Object.entries(bloomsTaxonomy).map(([level, percent]) => `${level}: ${percent}%`).join(', ') : 'Not specified';

  const previousQuestionsContext = previousVersions.length > 0
    ? `\n\nPREVIOUSLY GENERATED QUESTIONS (DO NOT REPEAT THESE):\n${previousVersions.map((v, i) => `Version ${i + 1}: ${JSON.stringify(v.generatedContentJSON?.sections || []).substring(0, 500)}`).join('\n')}\n\nGenerate COMPLETELY NEW and DIFFERENT questions.`
    : '';

  const referenceContext = referenceQuestions.length > 0
    ? `\n\nREFERENCE QUESTIONS (Use these as style/difficulty guides):\n${referenceQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
    : '';

  const importantTopicsContext = importantTopics
    ? `\n\nIMPORTANT TOPICS (MUST BE INCLUDED WITH HIGH PRIORITY):\n${importantTopics}`
    : '';

  const cifContext = cifData
    ? `\n\nSUBJECT INFORMATION FROM CIF:\nSubject: ${cifData.subjectName}\nTopics with Weightage:\n${cifData.topics.map(t => `- ${t.name}: ${t.weightage}%`).join('\n')}`
    : '';

  const prompt = `You are an expert academic question paper generator with deep knowledge of pedagogy and assessment design.

CRITICAL INSTRUCTIONS:
1. Generate UNIQUE, HIGH-QUALITY questions that test deep understanding
2. Ensure questions are CLEAR, UNAMBIGUOUS, and WELL-STRUCTURED
3. Match the exact difficulty distribution and Bloom's taxonomy levels
4. Include mandatory exercises EXACTLY as specified
5. Prioritize important topics mentioned
6. Use reference questions as style guides
7. STRICTLY FOLLOW the question type specified for each section - if a section is marked as "Multiple Choice", ALL questions in that section MUST be multiple choice. If marked as "Theoretical", ALL must be theoretical. Do NOT mix types within a section unless the type is explicitly "Mixed".
${previousQuestionsContext}
${referenceContext}
${importantTopicsContext}
${cifContext}

Subject Content (Reference Material):
${extractedText.substring(0, 15000)}... (truncated for context)

PAPER CONFIGURATION:
- Total Marks: ${templateConfig.marks}
- Sections Configuration (STRICTLY FOLLOW): ${sectionsInfo}
- Difficulty Distribution: Easy ${difficulty.easy}%, Medium ${difficulty.medium}%, Hard ${difficulty.hard}%
- Bloom's Taxonomy Distribution: ${bloomsInfo}
- Mandatory Exercises to Include: ${JSON.stringify(mandatoryList)}
- Generate Answer Key: ${generateAnswerKey ? 'YES' : 'NO'}

QUALITY REQUIREMENTS:
1. Questions must be academically rigorous and test conceptual understanding
2. Use proper academic language and terminology
3. Ensure questions are answerable based on the provided content
4. For numerical questions, provide clear problem statements
5. For theoretical questions, ask for explanations, not just definitions
6. Distribute questions evenly across chapters based on weightage

OUTPUT FORMAT:
Return a JSON object with this EXACT structure:
{
  "title": "${cifData?.subjectName || 'Question Paper'}",
  "subjectName": "${cifData?.subjectName || 'Subject Name'}",
  "instructions": "General instructions for students",
  "totalMarks": ${templateConfig.marks},
  "duration": "${duration || templateConfig.duration || '3 Hours'}",
  "sections": [
    {
      "name": "Section A",
      "instructions": "Answer all questions",
      "questions": [
        {
          "id": 1,
          "text": "Question text here",
          "marks": 5,
          "type": "Theoretical",
          "difficulty": "Medium",
          "bloomLevel": "Understand",
          "chapter": "Chapter 1",
          "answer": ${generateAnswerKey ? '"Detailed answer with explanation"' : 'null'}
        }
      ]
    }
  ]
}

IMPORTANT: Ensure all JSON strings are properly escaped. Use double quotes only.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      const parsed = JSON.parse(cleanText);

      // Generate separate HTMLs
      const html = enhanceHTMLStyling(parsed);
      const answerKeyHtml = generateAnswerKey ? enhanceAnswerKeyStyling(parsed) : null;

      return { json: parsed, html, answerKeyHtml };
    } catch (parseError) {
      console.warn("JSON parse error, trying to extract JSON:", parseError.message);

      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          const html = enhanceHTMLStyling(parsed);
          const answerKeyHtml = generateAnswerKey ? enhanceAnswerKeyStyling(parsed) : null;
          return { json: parsed, html, answerKeyHtml };
        } catch (e) {
          console.warn("Extracted JSON also failed to parse");
        }
      }

      console.warn("Using fallback structure");
      return generateFallbackStructure(sections, questionTypes, generateAnswerKey, cifData);
    }
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw new Error("Failed to generate paper");
  }
};

const enhanceHTMLStyling = (jsonData) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${jsonData?.title || 'Question Paper'}</title>
  <style>
    @page { margin: 2.5cm; }
    body {
      font-family: 'Times New Roman', Times, serif;
      line-height: 1.5;
      color: #000;
      max-width: 850px;
      margin: 0 auto;
      padding: 40px;
      background: #fff;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 24px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .header .subject {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .meta-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      font-weight: bold;
      border-bottom: 1px solid #ccc;
      padding-bottom: 10px;
    }
    .instructions {
      margin-bottom: 30px;
      font-style: italic;
    }
    .section {
      margin-bottom: 40px;
    }
    .section-title {
      font-size: 16px;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 15px;
      background: #f0f0f0;
      padding: 5px 10px;
      border-left: 4px solid #000;
    }
    .question {
      margin-bottom: 20px;
      page-break-inside: avoid;
      display: flex;
      gap: 10px;
    }
    .q-num {
      font-weight: bold;
      min-width: 25px;
    }
    .q-text {
      flex-grow: 1;
    }
    .q-marks {
      font-weight: bold;
      white-space: nowrap;
      margin-left: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${jsonData?.title || 'EXAMINATION PAPER'}</h1>
    <div class="subject">${jsonData?.subjectName || 'Subject Name'}</div>
  </div>
  
  <div class="meta-info">
    <div>Time: ${jsonData?.duration || '3 Hours'}</div>
    <div>Max. Marks: ${jsonData?.totalMarks || 100}</div>
  </div>
  
  <div class="instructions">
    <strong>Instructions to Candidates:</strong><br>
    ${jsonData?.instructions || '1. Answer all questions.\n2. Figures to the right indicate full marks.'}
  </div>
  
  ${jsonData?.sections?.map((section) => `
    <div class="section">
      <div class="section-title">${section.name}</div>
      ${section.instructions ? `<p style="margin-bottom:15px; font-style:italic;">${section.instructions}</p>` : ''}
      ${section.questions?.map((q) => `
        <div class="question">
          <div class="q-num">${q.id}.</div>
          <div class="q-text">${q.text}</div>
          <div class="q-marks">[${q.marks}]</div>
        </div>
      `).join('')}
    </div>
  `).join('')}
  
  <div style="text-align: center; margin-top: 50px; border-top: 1px solid #000; padding-top: 10px;">
    *** END OF PAPER ***
  </div>
</body>
</html>
  `;
};

const enhanceAnswerKeyStyling = (jsonData) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${jsonData?.title || 'Answer Key'} - Answer Key</title>
  <style>
    @page { margin: 2.5cm; }
    body {
      font-family: 'Times New Roman', Times, serif;
      line-height: 1.5;
      color: #000;
      max-width: 850px;
      margin: 0 auto;
      padding: 40px;
      background: #fff;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 24px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #d32f2f;
    }
    .header .subject {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .meta-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      font-weight: bold;
      border-bottom: 1px solid #ccc;
      padding-bottom: 10px;
    }
    .section {
      margin-bottom: 40px;
    }
    .section-title {
      font-size: 16px;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 15px;
      background: #ffebee;
      padding: 5px 10px;
      border-left: 4px solid #d32f2f;
      color: #b71c1c;
    }
    .question {
      margin-bottom: 25px;
      page-break-inside: avoid;
    }
    .q-header {
      display: flex;
      gap: 10px;
      font-weight: bold;
      margin-bottom: 8px;
      color: #555;
    }
    .q-text {
      margin-bottom: 10px;
      font-style: italic;
    }
    .answer-box {
      background: #f1f8e9;
      border: 1px solid #8bc34a;
      padding: 15px;
      border-radius: 4px;
    }
    .answer-label {
      font-weight: bold;
      color: #2e7d32;
      margin-bottom: 5px;
      display: block;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>ANSWER KEY</h1>
    <div class="subject">${jsonData?.subjectName || 'Subject Name'}</div>
  </div>
  
  <div class="meta-info">
    <div>Time: ${jsonData?.duration || '3 Hours'}</div>
    <div>Max. Marks: ${jsonData?.totalMarks || 100}</div>
  </div>
  
  ${jsonData?.sections?.map((section) => `
    <div class="section">
      <div class="section-title">${section.name}</div>
      ${section.questions?.map((q) => `
        <div class="question">
          <div class="q-header">
            <span>Q${q.id}.</span>
            <span>[${q.marks} Marks]</span>
          </div>
          <div class="q-text">${q.text}</div>
          <div class="answer-box">
            <span class="answer-label">Model Answer:</span>
            ${q.answer || 'No answer provided.'}
          </div>
        </div>
      `).join('')}
    </div>
  `).join('')}
  
  <div style="text-align: center; margin-top: 50px; border-top: 1px solid #000; padding-top: 10px; color: #d32f2f;">
    *** CONFIDENTIAL - FOR EVALUATOR USE ONLY ***
  </div>
</body>
</html>
  `;
};

const generateFallbackStructure = (sections, questionTypes, generateAnswerKey, cifData) => {
  // Default sections if none provided
  const defaultSections = sections && Array.isArray(sections) && sections.length > 0 
    ? sections 
    : [
        { name: 'Section A', marks: 50, questionCount: 5, questionType: 'Theoretical' },
        { name: 'Section B', marks: 50, questionCount: 5, questionType: 'Theoretical' }
      ];

  const fallbackData = {
    json: {
      title: "Generated Question Paper",
      subjectName: cifData?.subjectName || "Subject Name",
      instructions: "Answer all questions. All questions carry equal marks unless specified.",
      totalMarks: defaultSections.reduce((sum, s) => sum + (s.marks || 0), 0) || 100,
      duration: "3 Hours",
      sections: defaultSections.map((s, idx) => ({
        name: s.name || `Section ${String.fromCharCode(65 + idx)}`,
        instructions: "Answer all questions from this section",
        questions: Array.from({ length: s.questionCount || 5 }, (_, i) => ({
          id: i + 1,
          text: `Question ${i + 1} for ${s.name || 'Section'} - Based on the reference material provided`,
          marks: s.questionCount > 0 ? Math.floor((s.marks || 0) / s.questionCount) : 10,
          type: s.questionType || 'Theoretical',
          difficulty: i % 3 === 0 ? 'Easy' : i % 3 === 1 ? 'Medium' : 'Hard',
          bloomLevel: 'Understand',
          chapter: 'General',
          answer: generateAnswerKey ? 'Sample answer based on course content' : null
        }))
      }))
    }
  };

  const html = enhanceHTMLStyling(fallbackData.json);
  const answerKeyHtml = generateAnswerKey ? enhanceAnswerKeyStyling(fallbackData.json) : null;

  return { json: fallbackData.json, html, answerKeyHtml };
};

module.exports = { generatePaper };
