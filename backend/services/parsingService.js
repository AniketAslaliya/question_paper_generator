const { GoogleGenerativeAI } = require("@google/generative-ai");
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const genAI = process.env.GEMINI_API_KEY 
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

/**
 * Enhanced CIF Parsing using AI for better accuracy
 */
const parseCIF = async (text) => {
    try {
        if (!genAI) {
            console.log('⚠️ GEMINI_API_KEY not set, using regex fallback for CIF parsing');
            return parseCIFRegex(text);
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

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const responseText = response.text();

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

                console.log(`✅ AI CIF Parsing: Found ${parsed.topics.length} topics`);
                return {
                    subjectName: (parsed.subjectName || parsed.courseName || 'Unknown Subject').trim(),
                    topics: parsed.topics,
                    totalTopics: parsed.topics.length,
                    additionalInfo: parsed.additionalInfo || ''
                };
            } catch (parseError) {
                console.error('JSON parse error in AI response:', parseError.message);
                // Fallback to regex
                return parseCIFRegex(text);
            }
        }

        // Fallback to regex parsing if AI fails
        console.log('⚠️ AI CIF parsing returned no JSON, using regex fallback');
        return parseCIFRegex(text);
    } catch (error) {
        console.error('AI CIF parsing error, using regex fallback:', error.message);
        return parseCIFRegex(text);
    }
};

/**
 * Enhanced Regex-based CIF Parsing (Fallback)
 */
const parseCIFRegex = (text) => {
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

    // Enhanced topic patterns - more comprehensive
    const topicPatterns = [
        // Unit/Module/Topic with number and weightage
        /(?:Unit|Module|Topic|Chapter|Part)\s*[:\-]?\s*(\d+)[\s:.\-]+([^\n\r]+?)[\s\-]+(\d+)\s*%?/gi,
        // Numbered list with weightage
        /(\d+)[\.\)]\s*([^\n\r]+?)[\s\-]+(\d+)\s*%?/gi,
        // Unit/Module/Topic name followed by weightage on same or next line
        /(?:Unit|Module|Topic|Chapter)\s*[:\-]?\s*(\d+)[\s:.\-]+([^\n\r]{5,100})/gi,
        // Table format: Name | Weightage
        /([^\n\r]{5,80})\s*\|\s*(\d+)\s*%?/gi,
        // Simple numbered topics
        /(\d+)[\.\)]\s+([A-Z][^\n\r]{5,100})/gi,
        // Unit/Module followed by description
        /(?:Unit|Module|Topic)\s+(\d+)[\s:.\-]+([^\n\r]{10,150})/gi
    ];

    topicPatterns.forEach((pattern, patternIndex) => {
        let match;
        const regex = new RegExp(pattern.source, pattern.flags);
        
        while ((match = regex.exec(text)) !== null) {
            let name = '';
            let weightage = 0;

            if (patternIndex === 0 || patternIndex === 1) {
                // Patterns with weightage
                name = (match[2] || match[1] || '').trim();
                weightage = parseInt(match[3] || match[2] || 0);
            } else if (patternIndex === 3) {
                // Table format
                name = (match[1] || '').trim();
                weightage = parseInt(match[2] || 0);
            } else {
                // Patterns without explicit weightage
                name = (match[2] || match[1] || '').trim();
                weightage = 0; // Will be calculated later
            }

            // Clean up name
            name = name.replace(/\s+/g, ' ').trim();
            
            // Remove common prefixes/suffixes
            name = name.replace(/^(Unit|Module|Topic|Chapter)\s*\d+[\s:.\-]+/i, '');
            name = name.replace(/\s*\d+\s*%?\s*$/, '');
            name = name.replace(/^[\d\.\)\s\-]+/, '');

            if (name.length > 3 && name.length < 200 && !seenTopics.has(name.toLowerCase())) {
                seenTopics.add(name.toLowerCase());
                topics.push({ name, weightage: weightage || 0 });
            }
        }
    });

    // If weightage is missing, distribute equally
    if (topics.length > 0) {
        const topicsWithWeightage = topics.filter(t => t.weightage > 0);
        const topicsWithoutWeightage = topics.filter(t => t.weightage === 0);

        if (topicsWithoutWeightage.length > 0 && topicsWithWeightage.length > 0) {
            const totalWeightage = topicsWithWeightage.reduce((sum, t) => sum + t.weightage, 0);
            const remaining = Math.max(0, 100 - totalWeightage);
            const equalShare = Math.floor(remaining / topicsWithoutWeightage.length);
            
            topicsWithoutWeightage.forEach(topic => {
                topic.weightage = equalShare;
            });
        } else if (topicsWithoutWeightage.length === topics.length) {
            // All topics missing weightage - distribute equally
            const equalShare = Math.floor(100 / topics.length);
            topics.forEach(topic => {
                topic.weightage = equalShare;
            });
        }
    }

    // If still no topics found, try line-by-line extraction
    if (topics.length === 0) {
        const lines = text.split(/\n|\r/).filter(line => {
            const trimmed = line.trim();
            return trimmed.length > 10 && trimmed.length < 200 && 
                   !trimmed.match(/^(Subject|Course|Paper|Name|Title)/i) &&
                   !trimmed.match(/^\d+$/);
        });

        lines.slice(0, 10).forEach((line, idx) => {
            const trimmed = line.trim();
            if (trimmed.length > 5 && !seenTopics.has(trimmed.toLowerCase())) {
                seenTopics.add(trimmed.toLowerCase());
                topics.push({
                    name: trimmed.substring(0, 150),
                    weightage: Math.floor(100 / Math.min(lines.length, 10))
                });
            }
        });
    }

    // Sort topics by weightage (descending) or by order found
    topics.sort((a, b) => {
        if (b.weightage !== a.weightage) {
            return b.weightage - a.weightage;
        }
        return 0;
    });

    console.log(`✅ Regex CIF Parsing: Found ${topics.length} topics`);

    return {
        subjectName,
        topics: topics.slice(0, 20), // Limit to 20 topics
        totalTopics: topics.length,
        additionalInfo: ''
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

