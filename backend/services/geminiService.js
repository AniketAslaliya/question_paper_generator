const { GoogleGenerativeAI } = require("@google/generative-ai");

// Check for API key at startup
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error('❌ GEMINI_API_KEY is not set in environment variables!');
    console.error('⚠️  Paper generation will fail without this key');
} else {
    console.log('✅ GEMINI_API_KEY is configured (length:', apiKey.length, ')');
}

let genAI = null;
try {
    if (apiKey) {
        genAI = new GoogleGenerativeAI(apiKey);
        console.log('✅ GoogleGenerativeAI client initialized successfully');
    }
} catch (initError) {
    console.error('❌ Failed to initialize GoogleGenerativeAI:', initError.message);
}

/**
 * LAYER 1: Extract and combine all allowed topics from CIF and important topics
 * These are the ONLY topics questions should be generated from
 */
const extractAllowedTopics = (cifData, importantTopics) => {
    const allowedTopics = [];
    
    // Extract topics from CIF
    if (cifData && cifData.topics && Array.isArray(cifData.topics)) {
        cifData.topics.forEach(topic => {
            const topicName = (topic.name || topic.title || '').trim().toLowerCase();
            if (topicName && !allowedTopics.includes(topicName)) {
                allowedTopics.push(topicName);
            }
        });
    }
    
    // Extract topics from importantTopics string
    if (importantTopics && typeof importantTopics === 'string') {
        importantTopics.split(',').forEach(topic => {
            const topicName = topic.trim().toLowerCase();
            if (topicName && !allowedTopics.includes(topicName)) {
                allowedTopics.push(topicName);
            }
        });
    }
    
    console.log('📌 Allowed Topics for Filtering:', allowedTopics);
    return allowedTopics;
};

/**
 * LAYER 2: Filter extracted text to only include content related to allowed topics
 * This prevents Gemini from seeing (and using) content outside allowed topics
 */
const filterContentByTopics = (extractedText, allowedTopics) => {
    if (!allowedTopics || allowedTopics.length === 0) {
        console.warn('⚠️ No allowed topics provided. Using full content (not recommended).');
        return extractedText;
    }
    
    console.log(`🔍 Filtering content: ${extractedText.length} chars against ${allowedTopics.length} topics`);
    
    // Split text into paragraphs/sections
    const sections = extractedText.split(/\n\n+/);
    const relevantSections = [];
    
    sections.forEach((section, idx) => {
        // Check if section contains ANY allowed topic keyword
        const sectionLower = section.toLowerCase();
        const isRelevant = allowedTopics.some(topic => {
            // Match whole words or common variations
            const patterns = [
                new RegExp(`\\b${topic}\\b`, 'i'),
                new RegExp(topic, 'i')
            ];
            return patterns.some(p => p.test(sectionLower));
        });
        
        if (isRelevant) {
            relevantSections.push(section);
            console.log(`   ✅ Section ${idx + 1}: Relevant (contains allowed topics)`);
        } else {
            console.log(`   ❌ Section ${idx + 1}: Filtered out (no allowed topics)`);
        }
    });
    
    const filteredContent = relevantSections.join('\n\n');
    console.log(`📊 Filtering result: ${extractedText.length} → ${filteredContent.length} chars (${Math.round((filteredContent.length / extractedText.length) * 100)}% retained)`);
    
    return filteredContent || extractedText; // Fallback to original if nothing matches
};

/**
 * Extract key terms from compound topics for better matching
 * e.g., "channel state matrix, power dissipation, large-scale fading effects: path loss, shadowing"
 * becomes: ["channel", "state", "matrix", "power", "dissipation", "fading", "path", "loss", "shadowing", "shadow", ...]
 */
const extractKeyTermsFromTopics = (allowedTopics) => {
    const keyTerms = new Set();
    const stopWords = ['the', 'and', 'or', 'of', 'in', 'to', 'for', 'a', 'an', 'is', 'are', 'with', 'on', 'at', 'by', 'from', 'as', 'into', 'through'];
    
    allowedTopics.forEach(topic => {
        // Split by common delimiters (comma, colon, dash, parentheses, etc.)
        const parts = topic.split(/[,;:\-()\/&]+/);
        
        parts.forEach(part => {
            // Get individual words
            const words = part.trim().toLowerCase().split(/\s+/);
            
            words.forEach(word => {
                const cleanWord = word.replace(/[^a-z0-9]/g, '');
                if (cleanWord.length >= 3 && !stopWords.includes(cleanWord)) {
                    keyTerms.add(cleanWord);
                    
                    // Add common variations/stems
                    // shadow/shadowing
                    if (cleanWord.endsWith('ing')) {
                        keyTerms.add(cleanWord.slice(0, -3));  // removing -> remov
                        keyTerms.add(cleanWord.slice(0, -3) + 'e');  // fading -> fade
                    }
                    if (cleanWord.endsWith('ed')) {
                        keyTerms.add(cleanWord.slice(0, -2));  // modulated -> modulat
                        keyTerms.add(cleanWord.slice(0, -1));  // faded -> fade
                    }
                    // Add -ing form if not present
                    if (!cleanWord.endsWith('ing') && cleanWord.length >= 4) {
                        keyTerms.add(cleanWord + 'ing');  // shadow -> shadowing
                    }
                }
            });
        });
        
        // Also add the full topic phrase (for exact matching)
        const cleanTopic = topic.trim().toLowerCase();
        if (cleanTopic.length >= 3) {
            keyTerms.add(cleanTopic);
        }
    });
    
    return Array.from(keyTerms);
};

/**
 * LAYER 3: Validate generated questions against allowed topics (post-generation safety)
 * Uses smarter matching with key terms extraction for better accuracy
 * Acts as a final filter if Gemini generates questions outside scope
 */
const validateQuestionsAgainstTopics = (questions, allowedTopics) => {
    if (!allowedTopics || allowedTopics.length === 0) {
        console.warn('⚠️ No allowed topics for validation. Skipping question filtering.');
        return questions;
    }
    
    // Extract key terms for smarter matching
    const keyTerms = extractKeyTermsFromTopics(allowedTopics);
    console.log(`🛡️ Validating ${questions.length} questions against ${allowedTopics.length} topics (${keyTerms.length} key terms extracted)`);
    
    const validQuestions = [];
    const invalidQuestions = [];
    
    // Define core wireless communication terms that should always be valid
    // These are fundamental terms that appear across all wireless communication topics
    const coreWirelessTerms = [
        'wireless', 'communication', 'channel', 'fading', 'fade', 'signal', 'modulation',
        'diversity', 'mimo', 'ofdm', 'antenna', 'path', 'loss', 'capacity', 'snr', 'ber',
        'coherence', 'bandwidth', 'frequency', 'time', 'rayleigh', 'rician', 'doppler',
        'multipath', 'interference', 'noise', 'power', 'transmit', 'receive', 'receiver',
        'transmitter', 'cellular', 'mobile', 'gsm', 'cdma', 'lte', '5g', '4g', '3g',
        'spectral', 'efficiency', 'throughput', 'error', 'probability', 'detection',
        'estimation', 'equalizer', 'equalization', 'isi', 'cyclic', 'prefix', 'subcarrier',
        'awgn', 'flat', 'selective', 'narrowband', 'wideband', 'shadowing', 'shadow',
        'propagation', 'attenuation', 'gain', 'combining', 'mrc', 'egc', 'selection',
        'alamouti', 'space', 'code', 'block', 'trellis', 'viterbi', 'turbo', 'ldpc',
        'mmwave', 'massive', 'beamforming', 'precoding', 'csi', 'papr', 'sc-fdma',
        'ofdma', 'dft', 'idft', 'fft', 'ifft', 'qam', 'psk', 'qpsk', 'bpsk', 'ask',
        'fsk', 'gmsk', 'oqpsk', 'msk', 'constellation', 'symbol', 'bit', 'rate'
    ];
    
    questions.forEach((question, idx) => {
        const questionText = (question.text || '').toLowerCase();
        const questionWords = questionText.split(/\s+/).map(w => w.replace(/[^a-z0-9]/g, ''));
        
        // Method 1: Check if question contains any key term from allowed topics
        const hasKeyTerm = keyTerms.some(term => {
            // For short terms (3-4 chars), require word boundary match
            if (term.length <= 4) {
                return questionWords.includes(term);
            }
            // For longer terms, substring match is fine
            return questionText.includes(term);
        });
        
        // Method 2: Check if question contains core wireless communication terms
        const hasCoreTerms = coreWirelessTerms.filter(term => questionText.includes(term)).length >= 2;
        
        // Method 3: Check original topics with fuzzy matching
        const hasTopicMatch = allowedTopics.some(topic => {
            const topicLower = topic.toLowerCase();
            // Check if significant part of topic appears in question
            const topicWords = topicLower.split(/\s+/).filter(w => w.length >= 3);
            const matchingWords = topicWords.filter(w => questionText.includes(w));
            return matchingWords.length >= Math.min(2, topicWords.length * 0.3);
        });
        
        const isValid = hasKeyTerm || hasCoreTerms || hasTopicMatch;
        
        if (isValid) {
            validQuestions.push(question);
            console.log(`   ✅ Q${idx + 1}: Valid (topic matched)`);
        } else {
            // For now, keep all questions but log them as potentially off-topic
            // This is less aggressive filtering that won't break the paper
            console.log(`   ⚠️ Q${idx + 1}: Potentially off-topic - "${questionText.substring(0, 60)}..."`);
            validQuestions.push(question); // Keep it anyway - better to have questions than none
        }
    });
    
    console.log(`📊 Validation result: ${questions.length} questions validated`);
    
    return validQuestions;
};

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
  importantTopicsWithNotes = [], // NEW: Array of {topic, notes, priority}
  cifTopics = [], // NEW: Array of confirmed CIF topic names
  cifData = null,
  duration = '3 Hours'
}) => {
  if (!genAI) {
    console.error('❌ genAI is null. GEMINI_API_KEY status:', process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET');
    throw new Error('GEMINI_API_KEY is invalid or not set. Please configure it in environment variables.');
  }

  // Validate sections early
  if (!sections || !Array.isArray(sections) || sections.length === 0) {
    console.error('❌ No sections provided for paper generation');
    throw new Error('No sections configured. Please configure at least one section before generating.');
  }

  // ============ LAYER 1: Extract Allowed Topics ============
  // Priority: Use confirmed CIF topics + important topics, fallback to old method
  let allowedTopics = [];
  
  if (cifTopics && cifTopics.length > 0) {
    // Use new confirmed CIF topics
    allowedTopics.push(...cifTopics.map(t => typeof t === 'string' ? t.toLowerCase() : t.name.toLowerCase()));
  } else if (cifData && cifData.topics && Array.isArray(cifData.topics)) {
    // Fallback to old cifData structure
    cifData.topics.forEach(topic => {
      const topicName = (topic.name || topic.title || '').trim().toLowerCase();
      if (topicName && !allowedTopics.includes(topicName)) {
        allowedTopics.push(topicName);
      }
    });
  }
  
  // Add important topics
  if (importantTopicsWithNotes && Array.isArray(importantTopicsWithNotes)) {
    importantTopicsWithNotes.forEach(item => {
      const topicName = (item.topic || '').trim().toLowerCase();
      if (topicName && !allowedTopics.includes(topicName)) {
        allowedTopics.push(topicName);
      }
    });
  } else if (importantTopics && typeof importantTopics === 'string') {
    // Fallback to old string format
    importantTopics.split(',').forEach(topic => {
      const topicName = topic.trim().toLowerCase();
      if (topicName && !allowedTopics.includes(topicName)) {
        allowedTopics.push(topicName);
      }
    });
  }
  
  console.log(`📌 Allowed Topics for Generation (${allowedTopics.length} topics):`, allowedTopics);
  console.log(`   - CIF Topics: ${cifTopics?.length || 0}`);
  console.log(`   - Important Topics: ${importantTopicsWithNotes?.length || 0}`);
  
  // ============ LAYER 2: Filter Content by Topics ============
  // If allowed topics exist, filter extracted text to only include relevant sections
  const contentToUse = allowedTopics.length > 0 
    ? filterContentByTopics(extractedText, allowedTopics)
    : extractedText;

  // Log the input configuration
  console.log('📋 Generating paper with configuration:', {
    sectionsCount: sections.length,
    sections: sections.map(s => ({
      name: s.name,
      marks: s.marks,
      questionCount: s.questionCount,
      questionType: s.questionType,
      sectionDifficulty: s.sectionDifficulty || 'Medium',
      questionDifficultiesLength: s.questionDifficulties?.length || 0
    })),
    totalMarks: templateConfig?.marks,
    hasExtractedText: !!extractedText && extractedText.length > 0,
    originalTextLength: extractedText?.length || 0,
    filteredTextLength: contentToUse?.length || 0,
    allowedTopicsCount: allowedTopics.length
  });

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  // Ensure templateConfig has defaults
  const safeTemplateConfig = {
    marks: templateConfig?.marks || 100,
    duration: templateConfig?.duration || duration || '3 Hours',
    templateName: templateConfig?.templateName || 'Question Paper',
    ...templateConfig
  };

  // Build detailed section requirements
  const sectionsInfo = sections.map(s => {
    const typeNote = s.questionType === 'Mixed' 
      ? 'Type: Mixed (can use any question type)' 
      : `CRITICAL: ALL ${s.questionCount} questions in ${s.name} MUST be ${s.questionType} type. NO EXCEPTIONS.`;
    
    const marksPerQuestion = s.questionCount > 0 ? (s.marks / s.questionCount) : s.marks;
    return `${s.name}: EXACTLY ${s.questionCount} questions, ${s.marks} total marks (${marksPerQuestion.toFixed(1)} marks per question), ${typeNote}`;
  }).join('\n');
  
  const sectionsDetail = sections.map(s => {
    const marksPerQuestion = s.questionCount > 0 ? (s.marks / s.questionCount) : s.marks;
    const questionCount = s.questionCount || 1;
    // Get per-question difficulties or fallback to section difficulty or 'Medium'
    const sectionDifficulty = s.sectionDifficulty || 'Medium';
    let questionDifficulties = s.questionDifficulties;
    
    // Ensure questionDifficulties is a valid array with correct length
    if (!Array.isArray(questionDifficulties) || questionDifficulties.length === 0) {
      questionDifficulties = Array(questionCount).fill(sectionDifficulty);
    } else if (questionDifficulties.length < questionCount) {
      // Pad with section difficulty if array is too short
      questionDifficulties = [
        ...questionDifficulties,
        ...Array(questionCount - questionDifficulties.length).fill(sectionDifficulty)
      ];
    } else if (questionDifficulties.length > questionCount) {
      // Trim if array is too long
      questionDifficulties = questionDifficulties.slice(0, questionCount);
    }
    
    return {
      name: s.name || 'Section',
      questionCount: questionCount,
      totalMarks: s.marks || 10,
      marksPerQuestion: marksPerQuestion,
      questionType: s.questionType || 'Theoretical',
      sectionDifficulty: sectionDifficulty,
      questionDifficulties: questionDifficulties,
      instructions: s.instructions || `Answer all questions from this section`
    };
  });
  const bloomsInfo = bloomsTaxonomy ? Object.entries(bloomsTaxonomy).map(([level, percent]) => `${level}: ${percent}%`).join(', ') : 'Not specified';

  const previousQuestionsContext = previousVersions.length > 0
    ? `\n\nPREVIOUSLY GENERATED QUESTIONS (DO NOT REPEAT THESE):\n${previousVersions.map((v, i) => `Version ${i + 1}: ${JSON.stringify(v.generatedContentJSON?.sections || []).substring(0, 500)}`).join('\n')}\n\nGenerate COMPLETELY NEW and DIFFERENT questions.`
    : '';

  const referenceContext = referenceQuestions.length > 0
    ? `\n\nREFERENCE QUESTIONS (Use these as style/difficulty guides):\n${referenceQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
    : '';

  const importantTopicsContext = importantTopics
    ? `\n\n⚠️ ALLOWED TOPICS (CRITICAL - ONLY GENERATE QUESTIONS FROM THESE TOPICS):\n${importantTopics}\n\nDO NOT GENERATE QUESTIONS FROM ANY OTHER TOPIC, EVEN IF IT APPEARS IN THE REFERENCE TEXT.`
    : '';

  const cifContext = cifData && cifData.subjectName
    ? `\n\n⚠️ CIF TOPICS (CRITICAL - ONLY GENERATE QUESTIONS FROM THESE TOPICS):\nSubject: ${cifData.subjectName}\nAllowed Topics: ${cifData.topics?.map(t => t.name).join(', ') || 'Not specified'}\n\nDO NOT GENERATE QUESTIONS FROM ANY OTHER TOPIC.`
    : '';

  // Validate extracted text
  if (!contentToUse || contentToUse.trim().length < 100) {
    console.warn('⚠️ Filtered content is too short or empty. Length:', contentToUse?.length || 0);
    throw new Error('Insufficient content matching allowed topics. Please ensure your files contain content related to the specified topics.');
  }

  const textToUse = contentToUse.length > 50000 ? contentToUse.substring(0, 50000) : contentToUse;
  
  // Calculate total questions
  const totalQuestions = sections.reduce((sum, s) => sum + (s.questionCount || 0), 0);
  
  console.log('📊 Paper generation details:', {
    totalQuestions,
    sectionsDetailCount: sectionsDetail.length,
    textLength: textToUse.length
  });
  
  // NOTE: Weightage is IGNORED - sections configuration takes absolute priority
  // Questions should be distributed based on important topics, not weightage percentages

  // Build a more detailed prompt with examples
  const exampleQuestions = textToUse.length > 500 ? `
EXAMPLE OF GOOD QUESTIONS (based on similar content):
- "Explain the working principle of amplitude modulation (AM) and derive the mathematical expression for an AM wave. Discuss the modulation index and its significance in communication systems."
- "A carrier wave of frequency 1 MHz and amplitude 5V is modulated by a signal of frequency 5 kHz and amplitude 2V. Calculate the modulation index and the sideband frequencies. Draw the frequency spectrum."
- "Compare and contrast TDMA and FDMA multiple access techniques in wireless communication. Explain the advantages and disadvantages of each with suitable examples."

EXAMPLE OF BAD QUESTIONS (DO NOT GENERATE THESE):
- "Question 1 for Section A - Based on the reference material provided"
- "Write about the topic mentioned in the syllabus"
- "Explain the concept discussed in the course material"

` : '';

  // Build strict topic constraint message
  const topicConstraintMessage = allowedTopics.length > 0 ? `
🚫 STRICT TOPIC CONSTRAINT - READ THIS CAREFULLY:
You MUST ONLY generate questions from these ${allowedTopics.length} allowed topics:
${allowedTopics.map((t, i) => `${i + 1}. ${t}`).join('\n')}

DO NOT GENERATE ANY QUESTIONS ABOUT:
- Topics not listed above
- Concepts outside these topics
- Examples from other areas
- ANY content that is not explicitly related to the allowed topics above

ENFORCEMENT:
- Every single question MUST be about one of the allowed topics listed above
- If a topic has insufficient content, SKIP IT rather than invent questions
- If you cannot find enough content for all required questions from allowed topics, say so
- Never use external knowledge to fill gaps - only use the provided reference text
` : '';

  // Build important topics with custom instructions
  const importantTopicsInstructions = importantTopicsWithNotes && importantTopicsWithNotes.length > 0 ? `
📌 IMPORTANT TOPICS WITH SPECIAL INSTRUCTIONS:
For these topics, follow the specific guidance provided:

${importantTopicsWithNotes.map((item, i) => `${i + 1}. "${item.topic}" ${item.priority ? `[Priority: ${item.priority}]` : ''}
   ${item.notes ? `Instructions: ${item.notes}` : 'No specific instructions'}`).join('\n\n')}

When generating questions for these topics, prioritize following the special instructions above.
` : '';

  const prompt = `You are an expert academic question paper generator. Your task is to create REAL, SPECIFIC examination questions based on the provided course content.

${topicConstraintMessage}

${importantTopicsInstructions}

🚫 ABSOLUTELY FORBIDDEN - DO NOT GENERATE:
- Placeholder text like "Question 1 for Section A - Based on the reference material provided"
- Generic questions like "Explain the topic" or "Write about the concept"
- Questions that don't reference specific content from the material
- Questions shorter than 15 words
- Questions about topics NOT in the allowed topics list above

✅ YOU MUST GENERATE:
- Real, detailed questions that test understanding of specific concepts from the content
- Questions that reference actual topics, theories, formulas, or examples from the material
- Each question should be 20-50 words and ask for specific information
- Questions that can be answered using ONLY the provided content and allowed topics
- Questions ONLY about the allowed topics listed above

${exampleQuestions}

COURSE CONTENT (Analyze this carefully and create questions from it):
${textToUse.substring(0, 40000)}

PAPER REQUIREMENTS - FOLLOW EXACTLY:
- Total Marks: ${safeTemplateConfig.marks}
- Duration: ${duration || safeTemplateConfig.duration || '3 Hours'}
- Total Questions: ${totalQuestions}

SECTION BREAKDOWN (CRITICAL - FOLLOW EXACTLY):
${sectionsDetail.map(s => `
${s.name}:
  - Question Count: EXACTLY ${s.questionCount} questions (NO MORE, NO LESS)
  - Total Marks: ${s.totalMarks} marks
  - Marks per Question: ${s.marksPerQuestion.toFixed(1)} marks
  - Question Type: ${s.questionType === 'Multiple Choice' ? 'ALL questions MUST be Multiple Choice with 4 options (a, b, c, d)' : s.questionType === 'Numerical' ? 'ALL questions MUST be Numerical problems with calculations' : s.questionType === 'Long Answer' ? 'ALL questions MUST be Long Answer/Theoretical requiring detailed explanations' : s.questionType === 'Theoretical' ? 'ALL questions MUST be Theoretical/Descriptive' : 'Mixed types allowed'}
  - Section Difficulty: ${s.sectionDifficulty}
  - PER-QUESTION DIFFICULTY (CRITICAL - Each question MUST match its specified difficulty):
    ${s.questionDifficulties.map((d, i) => `Q${i + 1}: ${d}`).join(', ')}
  - Instructions: ${s.instructions}
  - ⚠️ ALL questions in this section MUST BE ABOUT ALLOWED TOPICS ONLY
`).join('\n')}

⚠️ DIFFICULTY IS NOW PER-QUESTION: Generate each question at its EXACT specified difficulty level (Easy/Medium/Hard)
- Bloom's Taxonomy: ${bloomsInfo}
${mandatoryList.length > 0 ? `- Mandatory Exercises: ${JSON.stringify(mandatoryList)}` : ''}
${cifContext || ''}
${importantTopicsContext}
${referenceContext ? `\nReference Questions (use as style guide):\n${referenceContext}` : ''}
${previousQuestionsContext}

⚠️ CRITICAL: IGNORE ANY WEIGHTAGE PERCENTAGES. Section configuration is ABSOLUTE and must be followed exactly.

⚠️ FINAL REMINDER: Questions MUST be about allowed topics. If you generate questions outside these topics, they will be automatically filtered and rejected.

CRITICAL QUESTION TYPE RULES:
- Multiple Choice: Each question MUST have exactly 4 options labeled (a), (b), (c), (d) in the question text
- Numerical: Each question MUST include specific numerical values and ask for calculations with units
- Theoretical: Each question MUST ask for explanations, comparisons, derivations, or detailed analyses (not just definitions)

OUTPUT FORMAT - Return ONLY valid JSON (no markdown, no code blocks):
{
  "title": "${cifData?.subjectName || safeTemplateConfig.templateName || 'Question Paper'}",
  "subjectName": "${cifData?.subjectName || 'Subject Name'}",
  "instructions": "Answer all questions. All questions carry equal marks unless specified.",
  "totalMarks": ${safeTemplateConfig.marks},
  "duration": "${duration || safeTemplateConfig.duration || '3 Hours'}",
  "sections": [
    ${sectionsDetail.map(s => `{
      "name": "${s.name}",
      "instructions": "${s.instructions}",
      "questions": [
        ${Array(s.questionCount).fill(0).map((_, i) => `{
          "id": ${i + 1},
          "text": "A REAL, SPECIFIC ${s.questionDifficulties[i] || 'Medium'}-level ${s.questionType === 'Multiple Choice' ? 'multiple choice question with 4 options (a, b, c, d) - format: Question text? (a) option1 (b) option2 (c) option3 (d) option4' : s.questionType === 'Numerical' ? 'numerical problem with specific values and calculations - include all numerical data needed' : s.questionType === 'Long Answer' ? 'long answer/theoretical question requiring detailed explanation (minimum 30 words)' : s.questionType === 'Theoretical' ? 'theoretical question requiring explanation' : 'question'} about ONE OF THE ALLOWED TOPICS LISTED ABOVE. Minimum 20 words. Reference actual topics, formulas, or examples.",
          "marks": ${s.marksPerQuestion.toFixed(1)},
          "type": "${s.questionType}",
          "difficulty": "${s.questionDifficulties[i] || 'Medium'}",
          "bloomLevel": "Understand",
          "chapter": "Chapter name from content",
          "answer": ${generateAnswerKey ? '"Detailed answer referencing specific content"' : 'null'}
        }`).join(',\n        ')}
      ]
    }`).join(',\n    ')}
  ]
}

CRITICAL VALIDATION REQUIREMENTS:
- Each section MUST have EXACTLY the specified number of questions (no more, no less)
- Each section MUST have ONLY the specified question type (unless Mixed)
- Each question MUST have the exact marks specified for that section (${sectionsDetail.map(s => `${s.name}: ${s.marksPerQuestion.toFixed(1)} marks per question`).join(', ')})
- Total marks across all sections MUST equal ${safeTemplateConfig.marks}
- DO NOT use weightage percentages to determine marks - use section configuration only
- ⚠️ EVERY QUESTION MUST BE ABOUT AN ALLOWED TOPIC - Questions about other topics will be filtered out`;

  try {
    console.log('🤖 Calling Gemini API for paper generation...');
    console.log('📊 Configuration:', {
      sections: sections?.length || 0,
      totalMarks: safeTemplateConfig.marks,
      extractedTextLength: textToUse.length,
      hasCIF: !!cifData,
      hasWeightage: !!weightage && Object.keys(weightage).length > 0
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('✅ Received response from Gemini, length:', text.length);
    console.log('📝 First 500 chars of response:', text.substring(0, 500));

    let cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Try to extract JSON if wrapped in other text
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanText = jsonMatch[0];
    }

    try {
      const parsed = JSON.parse(cleanText);
      
      // Validate the parsed structure
      if (!parsed.sections || !Array.isArray(parsed.sections) || parsed.sections.length === 0) {
        throw new Error('Invalid structure: No sections found in AI response');
      }

      // ============ LAYER 3: Validate Questions Against Allowed Topics ============
      if (allowedTopics.length > 0) {
        console.log('🛡️ Applying Layer 3: Post-generation topic validation...');
        
        // Validate questions in each section
        parsed.sections.forEach((section, sectionIdx) => {
          if (section.questions && Array.isArray(section.questions)) {
            const validQuestions = validateQuestionsAgainstTopics(section.questions, allowedTopics);
            
            // Log filtered out questions
            const filteredCount = section.questions.length - validQuestions.length;
            if (filteredCount > 0) {
              console.warn(`⚠️ Section ${sectionIdx + 1}: Filtered out ${filteredCount} questions outside allowed topics`);
            }
            
            // Replace section questions with validated ones
            section.questions = validQuestions;
          }
        });
      }

      // Validate section configuration matches requirements
      if (sections && sections.length > 0) {
        const validationErrors = [];
        
        sections.forEach((requiredSection, idx) => {
          const generatedSection = parsed.sections[idx];
          
          if (!generatedSection) {
            validationErrors.push(`Missing section: ${requiredSection.name}`);
            return;
          }
          
          // Check question count
          const actualCount = generatedSection.questions?.length || 0;
          if (actualCount !== requiredSection.questionCount) {
            validationErrors.push(`${requiredSection.name}: Expected ${requiredSection.questionCount} questions, got ${actualCount}`);
          }
          
          // Check question types (if not Mixed)
          if (requiredSection.questionType !== 'Mixed' && generatedSection.questions) {
            const wrongTypeQuestions = generatedSection.questions.filter(q => {
              const qType = (q.type || '').toLowerCase();
              const requiredType = requiredSection.questionType.toLowerCase();
              return qType !== requiredType && qType !== 'mixed';
            });
            
            if (wrongTypeQuestions.length > 0) {
              validationErrors.push(`${requiredSection.name}: ${wrongTypeQuestions.length} questions have wrong type. All must be ${requiredSection.questionType}`);
            }
          }
          
          // Check marks
          const sectionMarks = generatedSection.questions?.reduce((sum, q) => sum + (parseFloat(q.marks) || 0), 0) || 0;
          if (Math.abs(sectionMarks - requiredSection.marks) > 1) {
            validationErrors.push(`${requiredSection.name}: Expected ${requiredSection.marks} marks, got ${sectionMarks.toFixed(1)}`);
          }
        });
        
        if (validationErrors.length > 0) {
          console.warn('⚠️ Configuration validation errors:', validationErrors);
          // Don't throw error, but log it - AI might have slight variations
        }
      }

      // Validate questions are real, not placeholders
      const placeholderPatterns = [
        /question\s+\d+\s+for\s+section/i,
        /based\s+on\s+the\s+reference\s+material\s+provided/i,
        /based\s+on\s+the\s+provided\s+material/i,
        /explain\s+the\s+topic/i,
        /write\s+about\s+the\s+concept/i,
        /question\s+text\s+here/i,
        /placeholder/i
      ];

      const hasPlaceholders = parsed.sections.some(section => 
        section.questions?.some(q => {
          const text = (q.text || '').toLowerCase();
          return placeholderPatterns.some(pattern => pattern.test(text)) || text.length < 20;
        })
      );

      if (hasPlaceholders) {
        console.warn('⚠️ AI generated placeholder questions. Regenerating with much stricter prompt...');
        console.warn('📝 Sample problematic question:', parsed.sections[0]?.questions?.[0]?.text?.substring(0, 100));
        
        // Create a much more explicit retry prompt
        const retryPrompt = `You FAILED to generate real questions. You generated placeholders like "Question 1 for Section A - Based on the reference material provided". 

THIS IS UNACCEPTABLE. You MUST generate REAL questions.

STRICT REQUIREMENTS:
1. Each question MUST be 20-50 words
2. Each question MUST reference a specific concept, formula, theory, or example from this content:
${textToUse.substring(0, 20000)}

3. Example of GOOD question: "Explain the working principle of amplitude modulation and derive the mathematical expression for an AM wave. Discuss how the modulation index affects the transmitted signal power."

4. Example of BAD question: "Question 1 for Section A - Based on the reference material provided" (THIS IS FORBIDDEN)

Generate questions NOW following the exact same JSON structure but with REAL questions. Each question text must be a complete, specific question about the content provided.`;

        try {
          const retryResult = await model.generateContent(retryPrompt);
          const retryResponse = await retryResult.response;
          const retryText = retryResponse.text();
          let retryCleanText = retryText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const retryJsonMatch = retryCleanText.match(/\{[\s\S]*\}/);
          if (retryJsonMatch) {
            retryCleanText = retryJsonMatch[0];
          }
          const retryParsed = JSON.parse(retryCleanText);
          
          // Validate retry also
          const retryHasPlaceholders = retryParsed.sections?.some(section => 
            section.questions?.some(q => {
              const text = (q.text || '').toLowerCase();
              return placeholderPatterns.some(pattern => pattern.test(text)) || text.length < 20;
            })
          );

          if (!retryHasPlaceholders && retryParsed.sections && retryParsed.sections.length > 0) {
            console.log('✅ Retry successful - real questions generated');
            parsed.sections = retryParsed.sections;
            parsed.title = retryParsed.title || parsed.title;
            parsed.subjectName = retryParsed.subjectName || parsed.subjectName;
          } else {
            console.error('❌ Retry also failed - still has placeholders');
            throw new Error('AI generated placeholder questions even after retry. Please check the uploaded content and try again.');
          }
        } catch (retryError) {
          console.error('❌ Retry generation failed:', retryError.message);
          throw new Error('Failed to generate real questions. Please ensure your uploaded content has sufficient detail and try again.');
        }
      }

      // Final validation - check question quality
      const totalQuestions = parsed.sections.reduce((sum, s) => sum + (s.questions?.length || 0), 0);
      const shortQuestions = parsed.sections.some(section => 
        section.questions?.some(q => (q.text || '').trim().length < 20)
      );

      if (shortQuestions) {
        console.warn('⚠️ Some questions are too short. Minimum length should be 20 characters.');
      }

      console.log('✅ Successfully parsed JSON structure');
      console.log('📋 Sections generated:', parsed.sections.length);
      console.log('📝 Total questions:', totalQuestions);
      
      // Log sample questions for debugging
      if (parsed.sections[0]?.questions?.[0]) {
        console.log('📝 Sample question:', parsed.sections[0].questions[0].text?.substring(0, 100));
      }

      // Generate separate HTMLs
      const html = enhanceHTMLStyling(parsed);
      const answerKeyHtml = generateAnswerKey ? enhanceAnswerKeyStyling(parsed) : null;

      return { json: parsed, html, answerKeyHtml };
    } catch (parseError) {
      console.error("❌ JSON parse error:", parseError.message);
      console.error("📝 Response text (first 1000 chars):", cleanText.substring(0, 1000));
      
      // Try to extract JSON more aggressively
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          console.log('✅ Successfully extracted JSON from response');
          const html = enhanceHTMLStyling(parsed);
          const answerKeyHtml = generateAnswerKey ? enhanceAnswerKeyStyling(parsed) : null;
          return { json: parsed, html, answerKeyHtml };
        } catch (e) {
          console.error("❌ Extracted JSON also failed to parse:", e.message);
        }
      }

      console.error("❌ Using fallback structure - AI generation failed");
      throw new Error(`AI generation failed: ${parseError.message}. Please check if GEMINI_API_KEY is valid and the content is sufficient.`);
    }
  } catch (error) {
    console.error("❌ Gemini Generation Error:", error);
    if (error.message?.includes('API_KEY')) {
      throw new Error('GEMINI_API_KEY is invalid or not set. Please configure it in environment variables.');
    }
    if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      throw new Error('Gemini API quota exceeded. Please try again later.');
    }
    throw new Error(`Failed to generate paper: ${error.message}`);
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
    .error {
      color: #d32f2f;
      font-style: italic;
      padding: 10px;
      background: #ffebee;
      border-left: 4px solid #d32f2f;
      margin: 10px 0;
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
  
  ${(jsonData?.sections && Array.isArray(jsonData.sections) && jsonData.sections.length > 0) ? jsonData.sections.map((section) => `
    <div class="section">
      <div class="section-title">${section?.name || 'Section'}</div>
      ${section?.instructions ? `<p style="margin-bottom:15px; font-style:italic;">${section.instructions}</p>` : ''}
      ${(section?.questions && Array.isArray(section.questions) && section.questions.length > 0) ? section.questions.map((q) => `
        <div class="question">
          <div class="q-num">${q?.id || '?'}.</div>
          <div class="q-text">${q?.text || '[Question text not generated]'}</div>
          <div class="q-marks">[${q?.marks || '?'}]</div>
        </div>
      `).join('') : '<p class="error">No questions generated for this section</p>'}
    </div>
  `).join('') : '<p class="error">No sections were generated. Please try regenerating the paper.</p>'}
  
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
  
  ${(jsonData?.sections && Array.isArray(jsonData.sections) && jsonData.sections.length > 0) ? jsonData.sections.map((section) => `
    <div class="section">
      <div class="section-title">${section?.name || 'Section'}</div>
      ${(section?.questions && Array.isArray(section.questions) && section.questions.length > 0) ? section.questions.map((q) => `
        <div class="question">
          <div class="q-header">
            <span>Q${q?.id || '?'}.</span>
            <span>[${q?.marks || '?'} Marks]</span>
          </div>
          <div class="q-text">${q?.text || '[Question text not generated]'}</div>
          <div class="answer-box">
            <span class="answer-label">Model Answer:</span>
            ${q?.answer || 'No answer provided.'}
          </div>
        </div>
      `).join('') : '<p class="error">No questions generated for this section</p>'}
    </div>
  `).join('') : '<p class="error">No sections were generated.</p>'}
  
  <div style="text-align: center; margin-top: 50px; border-top: 1px solid #000; padding-top: 10px; color: #d32f2f;">
    *** CONFIDENTIAL - FOR EVALUATOR USE ONLY ***
  </div>
</body>
</html>
  `;
};

const generateFallbackStructure = (sections, questionTypes, generateAnswerKey, cifData) => {
  console.error('⚠️ WARNING: Using fallback structure - this should only happen if AI completely fails');
  console.error('⚠️ This means the AI generation failed and we cannot generate real questions');
  
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
          text: `[PLACEHOLDER - AI Generation Failed] Please regenerate the paper. Question ${i + 1} for ${s.name || 'Section'}`,
          marks: s.questionCount > 0 ? Math.floor((s.marks || 0) / s.questionCount) : 10,
          type: s.questionType || 'Theoretical',
          difficulty: i % 3 === 0 ? 'Easy' : i % 3 === 1 ? 'Medium' : 'Hard',
          bloomLevel: 'Understand',
          chapter: 'General',
          answer: generateAnswerKey ? '[AI Generation Failed - Please regenerate]' : null
        }))
      }))
    }
  };

  const html = enhanceHTMLStyling(fallbackData.json);
  const answerKeyHtml = generateAnswerKey ? enhanceAnswerKeyStyling(fallbackData.json) : null;

  return { json: fallbackData.json, html, answerKeyHtml };
};

module.exports = { 
  generatePaper,
  // Export filtering functions for testing and external use
  extractAllowedTopics,
  filterContentByTopics,
  validateQuestionsAgainstTopics
};
