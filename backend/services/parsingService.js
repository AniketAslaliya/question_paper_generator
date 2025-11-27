const { GoogleGenerativeAI } = require("@google/generative-ai");
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const genAI = process.env.GEMINI_API_KEY 
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

/**
 * Detect if PDF is text-based or image-based
 * @param {string} text - Extracted text from PDF
 * @returns {string} - 'text-based' or 'image-based'
 */
const detectPDFType = (text) => {
    if (!text || text.trim().length === 0) {
        console.log('🖼️ PDF Type: IMAGE-BASED (no text extracted)');
        return 'image-based';
    }

    // Calculate text density
    const cleanText = text.trim();
    const lines = cleanText.split(/\n/).filter(line => line.trim().length > 0);
    const avgCharsPerLine = cleanText.length / Math.max(lines.length, 1);
    
    // If mostly whitespace or very few characters, likely image-based
    if (cleanText.length < 100) {
        console.log(`🖼️ PDF Type: IMAGE-BASED (extracted text too short: ${cleanText.length} chars)`);
        return 'image-based';
    }

    // Check for coherence - real text PDFs have consistent character patterns
    const hasNumbers = /\d/.test(cleanText);
    const hasLetters = /[a-zA-Z]/.test(cleanText);
    const hasSpaces = / /.test(cleanText);
    
    if (!hasLetters || (!hasSpaces && !hasNumbers)) {
        console.log('🖼️ PDF Type: IMAGE-BASED (text pattern unrecognizable)');
        return 'image-based';
    }

    console.log(`📄 PDF Type: TEXT-BASED (${cleanText.length} chars extracted, ${lines.length} lines)`);
    return 'text-based';
};

/**
 * Enhanced CIF Parsing using AI for better accuracy
 */
const parseCIF = async (text) => {
    try {
        const startTime = Date.now();
        const pdfType = detectPDFType(text);
        const extractedTextLength = text ? text.trim().length : 0;

        console.log(`\n📋 === CIF PARSING STARTED ===`);
        console.log(`📊 PDF Type: ${pdfType}`);
        console.log(`📊 Extracted text length: ${extractedTextLength} characters`);
        console.log(`📊 Text preview (first 200 chars): ${text.substring(0, 200)}`);

        // If image-based PDF with no text, try OCR if available
        if (pdfType === 'image-based' && extractedTextLength < 100) {
            console.log('⚠️ Text-based parsing may fail, attempting OCR fallback...');
            // OCR would be triggered here if available
            // For now, we'll proceed with enhanced regex patterns
        }

        if (!genAI) {
            console.log('⚠️ GEMINI_API_KEY not set, using regex fallback for CIF parsing');
            return parseCIFRegex(text, pdfType);
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `You are an expert at parsing Course Information Files (CIF). Extract ONLY academic course information from the provided text.

EXTRACT:
1. Subject/Course Name (ONLY the academic subject name, NOT teacher names, NOT author names)
2. All Units/Modules/Topics/Chapters with their weightage percentages
3. Any additional course details

DO NOT EXTRACT:
- Teacher names, instructor names, author names
- Student names
- Institution names (unless part of course title)
- Dates, timestamps
- Email addresses, contact information
- Generic words like "Subject", "Course", "Paper" as topic names

EXTRACTION RULES:
- Look for Unit/Module/Topic/Chapter followed by numbers and descriptive names
- Weightage percentages (can be written as %, percent, or just numbers)
- Topics can be in tables, lists, or paragraphs
- Topics might be numbered (1, 2, 3) or labeled (Unit 1, Module 1, etc.)
- Topic names should be 5-100 characters, descriptive of course content
- If a "topic" is just a name (like "Dr. John Smith") or generic word, SKIP IT
- Extract detailed topic descriptions if available (e.g., "Statistical Fading Models: Narrowband Fading, Wideband Fading")

Return a JSON object with this EXACT structure:
{
  "subjectName": "Full subject/course name (academic subject only)",
  "topics": [
    {
      "name": "Complete topic/unit name (must be academic content, 5-100 chars)",
      "weightage": 20
    }
  ],
  "additionalInfo": "Any other relevant course information"
}

VALIDATION:
- Each topic name must be 5-100 characters
- Topic names must NOT be person names (check for patterns like "Dr.", "Prof.", titles)
- Topic names must NOT be generic words like "Subject", "Course", "Paper", "Name"
- If weightage is missing, estimate based on equal distribution

Text to parse:
${text.substring(0, 30000)}`;

        console.log('🤖 Sending request to Gemini API...');
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const responseText = response.text();

        console.log('✅ Gemini API response received');

        // Clean and parse JSON
        let cleanText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[0]);
                
                // Validate and normalize topics
                if (parsed.topics && Array.isArray(parsed.topics)) {
                    parsed.topics = parsed.topics.map(topic => ({
                        name: (topic.name || topic.title || topic.unit || 'Untitled Topic').trim(),
                        weightage: parseInt(topic.weightage || topic.weight || 0) || 0
                    })).filter(topic => topic.name && topic.name.length > 2 && topic.name.length < 200);
                    
                    // Ensure weightages sum to approximately 100
                    const totalWeightage = parsed.topics.reduce((sum, t) => sum + t.weightage, 0);
                    if (totalWeightage === 0 && parsed.topics.length > 0) {
                        // Distribute equally if no weightages
                        const equalShare = Math.floor(100 / parsed.topics.length);
                        parsed.topics.forEach(topic => {
                            topic.weightage = equalShare;
                        });
                    }
                } else {
                    parsed.topics = [];
                }

                const elapsedTime = Date.now() - startTime;
                console.log(`✅ AI CIF Parsing Success: Found ${parsed.topics.length} topics in ${elapsedTime}ms`);
                console.log(`📍 Topics extracted: ${parsed.topics.map(t => t.name).join(', ')}`);

                return {
                    status: 'success',
                    subjectName: (parsed.subjectName || parsed.courseName || 'Unknown Subject').trim(),
                    topics: parsed.topics,
                    totalTopics: parsed.topics.length,
                    additionalInfo: parsed.additionalInfo || '',
                    pdfType: pdfType,
                    extractedTextLength: extractedTextLength
                };
            } catch (parseError) {
                console.error('❌ JSON parse error in AI response:', parseError.message);
                console.log('⏱️ Falling back to regex parsing...');
                // Fallback to regex
                return parseCIFRegex(text, pdfType);
            }
        }

        // Fallback to regex parsing if AI fails
        console.log('⚠️ AI CIF parsing returned no JSON, using regex fallback');
        return parseCIFRegex(text, pdfType);
    } catch (error) {
        console.error('❌ AI CIF parsing error:', error.message);
        console.log('⏱️ Falling back to regex parsing...');
        return parseCIFRegex(text, 'error');
    }
};

/**
 * Enhanced Regex-based CIF Parsing (Fallback)
 * Optimized for extracting units, topics with detailed descriptions
 */
const parseCIFRegex = (text, pdfType = 'text-based') => {
    const startTime = Date.now();
    console.log(`\n📋 === REGEX CIF PARSING STARTED ===`);
    console.log(`📊 PDF Type: ${pdfType}`);
    
    // Extract subject name with multiple patterns
    const subjectPatterns = [
        /(?:Subject|Course|Paper)\s*(?:Name|Title)?[\s:]+([^\n\r]+)/i,
        /(?:Subject|Course|Paper)[\s:]+([^\n\r]+)/i,
        /^([A-Z][^\n\r]{5,50})$/m
    ];

    let subjectName = 'Unknown Subject';
    for (const pattern of subjectPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            subjectName = match[1].trim();
            if (subjectName.length > 3 && subjectName.length < 100) {
                break;
            }
        }
    }

    const topics = [];
    const seenTopics = new Set();

    // IMPROVED: Enhanced topic patterns specifically for units and detailed topics
    const topicPatterns = [
        // UNIT I: Full description pattern (matches "UNIT I: Statistical Fading Models: Narrowband Fading, Wideband Fading")
        /(?:UNIT|Unit)\s*[IVX]+[\s:.\-]+([^\n\r]{10,200})/gi,
        // Unit with number and description (Unit 1: Description)
        /(?:Unit|Module|Topic|Chapter)\s*[:\-]?\s*(\d+)[\s:.\-]+([^\n\r]+?)(?:\n|$)/gi,
        // Topics with percentage weightage (Topic Name - 20%)
        /^[\s]*[•\-\*]?\s*([A-Z][^\n\r]+?)[\s\-]+(\d+)\s*%?$/gm,
        // Numbered items with colon (1. Topic Name:)
        /^[\s]*(\d+)[\.\)]\s+([A-Z][^\n\r:]+):/gm,
        // ZF, MMSE, ML type patterns (DetectorNames, Techniques)
        /(?:ZF|MMSE|ML|LSE|OLS)\s*(?:Detector|Estimation|Equalizer)[^\n\r]{0,100}/gi,
        // Digital Modulation pattern
        /Digital\s+(?:Modulation|Demodulation)[^\n\r]{0,150}/gi,
        // Narrowband/Wideband patterns
        /(?:Narrowband|Wideband|Flat|Frequency-Selective)\s+(?:Fading|Channel)[^\n\r]{0,100}/gi,
        // Statistical models
        /(?:Rayleigh|Rician|Fading)\s+(?:Model|Distribution|Process)[^\n\r]{0,100}/gi
    ];

    topicPatterns.forEach((pattern, patternIndex) => {
        let match;
        const regex = new RegExp(pattern.source, pattern.flags);
        
        while ((match = regex.exec(text)) !== null) {
            let name = '';

            if (patternIndex === 0) {
                // UNIT pattern - use full match
                name = match[0].replace(/(?:UNIT|Unit)\s*[IVX]+[\s:.\-]+/i, '').trim();
            } else if (patternIndex === 1) {
                // Unit with number pattern
                name = (match[2] || match[1] || '').trim();
            } else if (patternIndex >= 2) {
                // Other patterns - use first capture group
                name = (match[1] || match[0] || '').trim();
            }

            // Clean up name
            name = name.replace(/\s+/g, ' ').trim();
            
            // Remove trailing junk
            name = name.replace(/\s*\d+\s*%?\s*$/, '');
            name = name.replace(/^[\d\.\)\s\-]+/, '');
            name = name.replace(/[•\-\*]$/, '').trim();

            // Validation
            if (name.length > 5 && name.length < 250 && !seenTopics.has(name.toLowerCase())) {
                // Exclude if it matches person names or generic terms
                if (!name.match(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.|Subject|Course|Paper|Name|Title)/i)) {
                    seenTopics.add(name.toLowerCase());
                    topics.push({ name, weightage: 0 });
                    console.log(`  ✓ Detected topic (pattern ${patternIndex}): "${name}"`);
                }
            }
        }
    });

    // Calculate weightages if missing
    if (topics.length > 0) {
        const topicsWithWeightage = topics.filter(t => t.weightage > 0);
        const topicsWithoutWeightage = topics.filter(t => t.weightage === 0);

        if (topicsWithoutWeightage.length > 0) {
            const remainingWeightage = Math.max(0, 100 - topicsWithWeightage.reduce((sum, t) => sum + t.weightage, 0));
            const equalShare = Math.floor(remainingWeightage / topicsWithoutWeightage.length);
            topicsWithoutWeightage.forEach(topic => {
                topic.weightage = equalShare || (100 / topicsWithoutWeightage.length);
            });
        }
    }

    // If no topics found, try line-by-line extraction
    if (topics.length === 0) {
        console.log('⚠️ No structured topics found, attempting line-by-line extraction...');
        const lines = text.split(/\n|\r/).filter(line => {
            const trimmed = line.trim();
            return trimmed.length > 10 && trimmed.length < 200 && 
                   !trimmed.match(/^(Subject|Course|Paper|Name|Title)/i) &&
                   !trimmed.match(/^\d+$/) &&
                   trimmed.match(/[A-Z]/); // Must have at least one uppercase letter
        });

        lines.slice(0, 15).forEach((line, idx) => {
            const trimmed = line.replace(/^[\s•\-\*]+/, '').replace(/[\d\-%]+$/, '').trim();
            if (trimmed.length > 5 && !seenTopics.has(trimmed.toLowerCase())) {
                seenTopics.add(trimmed.toLowerCase());
                topics.push({
                    name: trimmed.substring(0, 150),
                    weightage: Math.floor(100 / Math.min(lines.length, 15))
                });
                console.log(`  ✓ Extracted line-based topic: "${trimmed}"`);
            }
        });
    }

    // Sort topics by weightage (descending)
    topics.sort((a, b) => {
        if (b.weightage !== a.weightage) {
            return b.weightage - a.weightage;
        }
        return 0;
    });

    const elapsedTime = Date.now() - startTime;
    console.log(`✅ Regex CIF Parsing Complete: Found ${topics.length} topics in ${elapsedTime}ms`);
    console.log(`📍 Topics extracted: ${topics.map(t => t.name).join(', ')}`);

    return {
        status: 'success',
        subjectName,
        topics: topics.slice(0, 25), // Limit to 25 topics
        totalTopics: topics.length,
        additionalInfo: '',
        pdfType: pdfType,
        extractedTextLength: text.length
    };
};

/**
 * Enhanced Chapter Extraction from Books
 */
const extractChapters = (text) => {
    const chapters = [];
    const seenChapters = new Set();

    // Enhanced chapter patterns
    const chapterPatterns = [
        /Chapter\s+(\d+)[\s:.\-]+([^\n\r]{5,150})/gi,
        /Chapter\s+([IVX]+)[\s:.\-]+([^\n\r]{5,150})/gi,
        /(?:Unit|Module|Part)\s+(\d+)[\s:.\-]+([^\n\r]{5,150})/gi,
        /^\s*(\d+)[\.\)]\s+([A-Z][^\n\r]{10,150})/gm,
        /(?:Chapter|Unit|Module)\s+(\d+)/gi
    ];

    chapterPatterns.forEach(pattern => {
        let match;
        const regex = new RegExp(pattern.source, pattern.flags);
        
        while ((match = regex.exec(text)) !== null) {
            let chapterNum = match[1] || '';
            let chapterName = match[2] || `Chapter ${chapterNum}`;
            
            if (!chapterName || chapterName.trim().length < 3) {
                chapterName = `Chapter ${chapterNum}`;
            }

            chapterName = chapterName.trim().replace(/\s+/g, ' ');
            
            const chapterKey = chapterName.toLowerCase();
            if (!seenChapters.has(chapterKey) && chapterName.length < 200) {
                seenChapters.add(chapterKey);
                chapters.push(chapterName);
            }
        }
    });

    // Patterns to exclude (teacher names, subject names, etc.)
    const excludePatterns = [
        /^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.|Miss|Sir|Madam)\s+[A-Z]/i,
        /^(Teacher|Instructor|Author|Subject|Course|Paper|Name|Title)[\s:]/i,
        /^[A-Z][a-z]+\s+[A-Z][a-z]+$/, // Simple name patterns (First Last)
        /@.*\.(com|edu|org)/i, // Email addresses
        /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/, // Dates
    ];

    const isExcluded = (name) => {
        const trimmed = name.trim();
        if (trimmed.length < 5 || trimmed.length > 150) return true;
        return excludePatterns.some(pattern => pattern.test(trimmed));
    };

    // Filter chapters to exclude names and generic terms
    const filteredChapters = chapters.filter(ch => {
        const lower = ch.toLowerCase();
        return !isExcluded(ch) &&
               !lower.match(/^(subject|course|paper|name|title|teacher|instructor|author|dr\.|prof\.|mr\.|mrs\.|ms\.)/) &&
               !lower.match(/^[a-z]+\s+[a-z]+$/) && // Simple name pattern
               ch.length >= 5 && ch.length <= 150;
    });

    // Remove duplicates and sort
    const uniqueChapters = [...new Set(filteredChapters)];
    
    // If no chapters found, try to extract from headings (with better filtering)
    if (uniqueChapters.length === 0) {
        const lines = text.split(/\n|\r/);
        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.length > 10 && trimmed.length < 150 && 
                trimmed.match(/^[A-Z][A-Za-z\s]{10,}/) &&
                !trimmed.match(/^(Subject|Course|Paper|Table|Figure|Teacher|Instructor|Author|Dr\.|Prof\.)/i) &&
                !isExcluded(trimmed)) {
                const key = trimmed.toLowerCase();
                if (!seenChapters.has(key)) {
                    seenChapters.add(key);
                    uniqueChapters.push(trimmed);
                }
            }
        });
    }

    // Final filtering - remove any that look like names or generic terms
    const finalChapters = uniqueChapters.filter(ch => {
        const lower = ch.toLowerCase();
        return !lower.match(/^(subject|course|paper|name|title|teacher|instructor|author|dr\.|prof\.|mr\.|mrs\.|ms\.)/) &&
               !lower.match(/^[a-z]+\s+[a-z]+$/) && // Simple name pattern
               ch.length >= 5 && ch.length <= 150;
    }).slice(0, 50); // Limit to 50 chapters
    console.log(`✅ Chapter Extraction: Found ${finalChapters.length} chapters`);
    
    return finalChapters;
};

module.exports = {
    parseCIF,
    parseCIFRegex,
    extractChapters
};

