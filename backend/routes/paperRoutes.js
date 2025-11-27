const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Paper = require('../models/Paper');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { generatePaper } = require('../services/geminiService');

// Multer setup with file size limits
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
        files: 10 // Max 10 files
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, DOCX, and TXT files are allowed.'), false);
        }
    }
});

// Phase 1: Upload & Analyze
router.post('/create-phase1', auth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        
        // Validate file size
        if (req.file.size > 10 * 1024 * 1024) {
            return res.status(400).json({ message: 'File size exceeds 10MB limit' });
        }

        let text = '';
        if (req.file.mimetype === 'application/pdf') {
            const data = await pdfParse(req.file.buffer);
            text = data.text;
        } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const result = await mammoth.extractRawText({ buffer: req.file.buffer });
            text = result.value;
        } else {
            text = req.file.buffer.toString('utf8');
        }

        // Extract chapters using enhanced parsing
        const { extractChapters } = require('../services/parsingService');
        let chapters = extractChapters(text);
        
        // Fallback if no chapters found
        if (chapters.length === 0) {
            chapters = ['Chapter 1', 'Chapter 2', 'Chapter 3'];
        }

        // Create initial paper record
        const paper = new Paper({
            userId: req.user.id,
            userName: req.user.name,
            paperName: req.body.paperName || 'Untitled Paper',
            extractedData: {
                textChunks: [text], // Storing full text for now, ideally chunk it
                chapters: chapters
            }
        });
        await paper.save();

        if (req.logActivity) await req.logActivity('file_upload', { paperId: paper.id });

        res.json({ paperId: paper.id, chapters, message: 'File processed successfully' });
    } catch (err) {
        console.error(err);
        if (err.message && err.message.includes('Invalid file type')) {
            return res.status(400).json({ message: err.message });
        }
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File size exceeds limit' });
        }
        res.status(500).json({ message: 'Server Error', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
    }
});

// Phase 1: Upload Multiple Files
router.post('/create-phase1-multi', auth, upload.array('files', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }
        
        // Validate total size
        const totalSize = req.files.reduce((sum, file) => sum + file.size, 0);
        if (totalSize > 50 * 1024 * 1024) { // 50MB total
            return res.status(400).json({ message: 'Total file size exceeds 50MB limit' });
        }

        let combinedText = '';
        const fileNames = [];
        const detectedExercises = [];

        for (const file of req.files) {
            let text = '';

            if (file.mimetype === 'application/pdf') {
                const data = await pdfParse(file.buffer);
                text = data.text;
            } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                const result = await mammoth.extractRawText({ buffer: file.buffer });
                text = result.value;
            } else {
                text = file.buffer.toString('utf8');
            }

            combinedText += `\n\n=== ${file.originalname} ===\n\n${text}`;
            fileNames.push(file.originalname);

            // Extract exercises using regex patterns
            const exercisePatterns = [
                /Exercise\s+\d+\.?\d*/gi,
                /Example\s+\d+\.?\d*/gi,
                /Problem\s+\d+\.?\d*/gi,
                /Question\s+\d+\.?\d*/gi
            ];

            exercisePatterns.forEach(pattern => {
                const matches = text.match(pattern);
                if (matches) {
                    detectedExercises.push(...matches.slice(0, 5));
                }
            });
        }

        // Extract chapters using enhanced parsing
        const { extractChapters } = require('../services/parsingService');
        let chapters = extractChapters(combinedText);
        
        // Fallback if no chapters found
        if (chapters.length === 0) {
            const chapterMatches = combinedText.match(/Chapter\s+\d+[:\s-]*.*/gi);
            chapters = chapterMatches ?
                [...new Set(chapterMatches.slice(0, 10))].map(ch => ch.trim()) :
                ['Chapter 1', 'Chapter 2', 'Chapter 3'];
        }

        // Create initial paper record
        const paper = new Paper({
            userId: req.user.id,
            userName: req.user.name,
            paperName: req.body.paperName || 'Untitled Paper',
            extractedData: {
                textChunks: [combinedText],
                chapters: chapters,
                uploadedFiles: fileNames,
                detectedExercises: [...new Set(detectedExercises)]
            }
        });
        await paper.save();

        if (req.logActivity) {
            await req.logActivity('multi_file_upload', {
                paperId: paper.id,
                fileCount: req.files.length
            });
        }

        res.json({
            paperId: paper.id,
            chapters,
            exercises: [...new Set(detectedExercises)],
            uploadedFiles: fileNames,
            message: `${req.files.length} file(s) processed successfully`
        });
    } catch (err) {
        console.error(err);
        if (err.message && err.message.includes('Invalid file type')) {
            return res.status(400).json({ message: err.message });
        }
        if (err.code === 'LIMIT_FILE_SIZE' || err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ message: err.message || 'File limit exceeded' });
        }
        res.status(500).json({ message: 'Server Error', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
    }
});


// Phase 2: Configure Paper (Save Config)
router.post('/create-phase2', auth, async (req, res) => {
    const { paperId, config } = req.body;
    
    // Log incoming request
    console.log('📥 create-phase2 request received:', {
        paperId,
        hasConfig: !!config,
        configKeys: config ? Object.keys(config) : [],
        sectionsCount: config?.sections?.length || 0
    });
    
    // Validate input
    if (!paperId) {
        return res.status(400).json({ message: 'Paper ID is required' });
    }
    if (!config) {
        return res.status(400).json({ message: 'Configuration is required' });
    }
    
    // Validate config structure
    if (config.sections && Array.isArray(config.sections)) {
        const totalMarks = config.sections.reduce((sum, s) => sum + (parseInt(s.marks) || 0), 0);
        const expectedMarks = config.marks || 100;
        if (Math.abs(totalMarks - expectedMarks) > 1) { // Allow 1 mark difference for rounding
            console.warn(`⚠️ Section marks (${totalMarks}) do not match total marks (${expectedMarks})`);
            // Don't fail, just warn - let it proceed
        }
        console.log(`✅ Saving ${config.sections.length} sections:`, config.sections.map(s => `${s.name}: ${s.questionCount} questions, ${s.marks} marks, type: ${s.questionType}`).join(', '));
    } else {
        console.warn('⚠️ No sections found in config:', { 
            hasSections: !!config.sections,
            isArray: Array.isArray(config.sections)
        });
    }
    
    try {
        const paper = await Paper.findById(paperId);
        if (!paper) return res.status(404).json({ message: 'Paper not found' });
        if (paper.userId.toString() !== req.user.id) return res.status(401).json({ message: 'Unauthorized' });

        // Log what we're about to save
        console.log('💾 Saving config to paper:', {
            marks: config.marks,
            duration: config.duration,
            sectionsCount: config.sections?.length || 0,
            sections: config.sections
        });

        // Ensure sections are preserved
        paper.config = {
            ...config,
            sections: config.sections || []
        };
        paper.templateUsed = config.templateName || 'Custom';
        
        await paper.save();
        
        // Verify save was successful
        const savedPaper = await Paper.findById(paperId);
        console.log('✅ Config saved and verified:', {
            paperId,
            savedSectionsCount: savedPaper.config?.sections?.length || 0,
            savedSections: savedPaper.config?.sections
        });

        res.json({ message: 'Configuration saved', paper: savedPaper });
    } catch (err) {
        console.error('❌ Error saving config:', err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// Phase 3: Generate Paper
router.post('/create-phase3', auth, async (req, res) => {
    const { paperId } = req.body;
    
    // Log incoming request
    console.log('📥 create-phase3 request received:', {
        paperId,
        userId: req.user?.id,
        body: JSON.stringify(req.body)
    });
    
    // Validate paperId
    if (!paperId) {
        console.log('❌ Missing paperId in request');
        return res.status(400).json({ 
            message: 'Paper ID is required',
            error: 'MISSING_PAPER_ID',
            received: req.body
        });
    }
    
    try {
        console.log('📝 Generating paper for user:', req.user.id, 'Paper ID:', paperId);

        const paper = await Paper.findById(paperId);
        if (!paper) {
            console.log('❌ Paper not found:', paperId);
            return res.status(404).json({ 
                message: 'Paper not found',
                error: 'PAPER_NOT_FOUND',
                paperId 
            });
        }

        console.log('✅ Paper found:', {
            id: paper._id,
            hasConfig: !!paper.config,
            hasExtractedData: !!paper.extractedData,
            configSections: paper.config?.sections?.length || 0
        });
        
        // Validate extractedData and textChunks
        if (!paper.extractedData || !paper.extractedData.textChunks || paper.extractedData.textChunks.length === 0) {
            console.log('❌ No text content found:', {
                hasExtractedData: !!paper.extractedData,
                hasTextChunks: !!paper.extractedData?.textChunks,
                textChunksLength: paper.extractedData?.textChunks?.length || 0
            });
            return res.status(400).json({ 
                message: 'No text content found. Please upload files first.',
                error: 'NO_TEXT_CONTENT',
                details: {
                    hasExtractedData: !!paper.extractedData,
                    hasTextChunks: !!paper.extractedData?.textChunks
                }
            });
        }
        
        // Update generation status - START
        paper.generationStatus = {
            status: 'generating',
            progress: 10,
            startedAt: new Date()
        };
        await paper.save();

        // Combine all text chunks for better context
        const extractedText = paper.extractedData.textChunks 
            ? paper.extractedData.textChunks.join('\n\n---\n\n')
            : (paper.extractedData.fullText || '');

        if (!extractedText || extractedText.trim().length < 100) {
            paper.generationStatus.status = 'failed';
            paper.generationStatus.error = 'Insufficient content extracted from files';
            await paper.save();
            return res.status(400).json({ 
                message: 'Insufficient content extracted from files. Please upload files with readable text content.',
                error: 'INSUFFICIENT_CONTENT',
                textLength: extractedText?.length || 0
            });
        }

        console.log('📄 Generating paper with:', {
            paperId: paper.id,
            textLength: extractedText.length,
            sections: paper.config.sections?.length || 0,
            totalMarks: paper.config.marks,
            hasConfig: !!paper.config,
            configKeys: Object.keys(paper.config || {})
        });

        // Validate sections exist before generation
        if (!paper.config || !paper.config.sections || !Array.isArray(paper.config.sections) || paper.config.sections.length === 0) {
            console.log('❌ No sections configured:', {
                hasConfig: !!paper.config,
                hasSections: !!paper.config?.sections,
                sectionsIsArray: Array.isArray(paper.config?.sections),
                sectionsLength: paper.config?.sections?.length || 0
            });
            paper.generationStatus.status = 'failed';
            paper.generationStatus.error = 'No sections configured';
            await paper.save();
            return res.status(400).json({ 
                message: 'No sections configured. Please configure at least one section before generating.',
                error: 'NO_SECTIONS',
                details: {
                    hasConfig: !!paper.config,
                    hasSections: !!paper.config?.sections,
                    sectionsLength: paper.config?.sections?.length || 0
                } 
            });
        }

        // Log section details for debugging
        console.log('📋 Section configuration:', paper.config.sections.map(s => ({
            name: s.name,
            marks: s.marks,
            questionCount: s.questionCount,
            questionType: s.questionType
        })));

        // Auto-save progress: Update status to 30%
        paper.generationStatus.progress = 30;
        await paper.save();

        // Include important questions from paper.importantQuestions
        const importantQuestionsList = paper.importantQuestions?.map(iq => iq.question) || [];
        const allReferenceQuestions = [
            ...(paper.config.referenceQuestions || []),
            ...importantQuestionsList
        ];

        const generatedData = await generatePaper({
            extractedText: extractedText,
            templateConfig: paper.config,
            difficulty: paper.config.difficulty || { easy: 30, medium: 50, hard: 20 },
            weightage: paper.config.weightage || {},
            questionTypes: paper.config.questionTypes,
            sections: paper.config.sections,
            bloomsTaxonomy: paper.config.bloomsTaxonomy || {},
            mandatoryList: paper.config.mandatoryExercises || [],
            generateAnswerKey: paper.config.generateAnswerKey || false,
            setsRequired: paper.config.setsGenerated,
            previousVersions: [],
            referenceQuestions: allReferenceQuestions,
            importantTopics: paper.config.importantTopics || '',
            cifData: paper.config.cifData || null,
            duration: paper.config.duration || '3 Hours'
        });

        // Auto-save progress: Update status to 80%
        paper.generationStatus.progress = 80;
        await paper.save();

        console.log('✅ Paper generated successfully');
        
        // AUTO-SAVE: Add version with metadata
        paper.versions.push({
            versionNumber: paper.versions.length + 1,
            generatedContentHTML: generatedData.html,
            generatedAnswerKeyHTML: generatedData.answerKeyHtml,
            generatedContentJSON: generatedData.json,
            aiModel: 'Gemini Flash 2.5',
            changeReason: 'generation',
            modifiedBy: req.user.id
        });
        
        // Set current version to the latest
        paper.currentVersionIndex = paper.versions.length - 1;

        // Update generation status - COMPLETE
        paper.generationStatus = {
            status: 'completed',
            progress: 100,
            startedAt: paper.generationStatus.startedAt,
            completedAt: new Date()
        };
        
        // AUTO-SAVE metadata update
        paper.isAutoSaved = true;
        paper.lastAutoSaveAt = new Date();
        
        console.log('💾 Auto-saving paper after generation. Version:', paper.versions.length);

        await paper.save();

        if (req.logActivity) await req.logActivity('paper_generated', { paperId: paper.id });

        res.json({ paper, generatedData });
    } catch (err) {
        console.error('❌ Paper generation error:', err.message);
        console.error('Full error:', err);
        
        // Update generation status - FAILED
        try {
            const paper = await Paper.findById(paperId);
            if (paper) {
                paper.generationStatus = {
                    status: 'failed',
                    progress: 0,
                    startedAt: paper.generationStatus?.startedAt,
                    completedAt: new Date(),
                    error: err.message
                };
                await paper.save();
            }
        } catch (saveErr) {
            console.error('Failed to save error status:', saveErr);
        }

        res.status(500).json({
            message: 'Server Error',
            error: err.message,
            details: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

// Regenerate Paper
router.post('/:id/regenerate', auth, async (req, res) => {
    try {
        const paper = await Paper.findById(req.params.id);
        if (!paper) return res.status(404).json({ message: 'Paper not found' });
        if (paper.userId.toString() !== req.user.id) return res.status(401).json({ message: 'Unauthorized' });

        // Validate extractedData and textChunks
        if (!paper.extractedData || !paper.extractedData.textChunks || paper.extractedData.textChunks.length === 0) {
            return res.status(400).json({ message: 'No text content found. Please upload files first.' });
        }

        // Combine all text chunks for better context
        const extractedText = paper.extractedData.textChunks 
            ? paper.extractedData.textChunks.join('\n\n---\n\n')
            : (paper.extractedData.fullText || '');

        if (!extractedText || extractedText.trim().length < 100) {
            return res.status(400).json({ 
                message: 'Insufficient content extracted from files. Please upload files with readable text content.' 
            });
        }

        console.log('🔄 Regenerating paper with:', {
            paperId: paper.id,
            textLength: extractedText.length,
            sections: paper.config.sections?.length || 0,
            previousVersions: paper.versions?.length || 0
        });

        // Validate sections exist before regeneration
        if (!paper.config.sections || !Array.isArray(paper.config.sections) || paper.config.sections.length === 0) {
            return res.status(400).json({ 
                message: 'No sections configured. Please configure at least one section before regenerating.' 
            });
        }

        const generatedData = await generatePaper({
            extractedText: extractedText,
            templateConfig: paper.config,
            difficulty: paper.config.difficulty || { easy: 30, medium: 50, hard: 20 },
            weightage: paper.config.weightage || {},
            questionTypes: paper.config.questionTypes,
            sections: paper.config.sections,
            bloomsTaxonomy: paper.config.bloomsTaxonomy || {},
            mandatoryList: paper.config.mandatoryExercises || [],
            generateAnswerKey: paper.config.generateAnswerKey || false,
            setsRequired: paper.config.setsGenerated,
            previousVersions: paper.versions || [],
            referenceQuestions: paper.config.referenceQuestions || [],
            importantTopics: paper.config.importantTopics || '',
            cifData: paper.config.cifData || null,
            duration: paper.config.duration || '3 Hours'
        });

        paper.versions.push({
            versionNumber: paper.versions.length + 1,
            generatedContentHTML: generatedData.html,
            generatedAnswerKeyHTML: generatedData.answerKeyHtml,
            generatedContentJSON: generatedData.json,
            aiModel: 'Gemini Flash 2.5',
            changeReason: 'regeneration',
            modifiedBy: req.user.id
        });
        
        // Set current version to the latest
        paper.currentVersionIndex = paper.versions.length - 1;
        
        // AUTO-SAVE metadata update
        paper.isAutoSaved = true;
        paper.lastAutoSaveAt = new Date();
        
        console.log('💾 Auto-saving paper after regeneration. Version:', paper.versions.length);

        await paper.save();

        if (req.logActivity) await req.logActivity('regenerated', { paperId: paper.id });

        res.json({ paper, generatedData });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Get My Papers
router.get('/my', auth, async (req, res) => {
    try {
        const papers = await Paper.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(papers);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Add Important Question
router.post('/:id/important-questions', auth, async (req, res) => {
    // Log incoming request
    console.log('📥 POST /:id/important-questions received:', {
        paperId: req.params.id,
        body: req.body,
        userId: req.user?.id
    });

    try {
        const { question, questionType, notes } = req.body;
        
        // Validate required fields
        if (!question || (typeof question === 'string' && !question.trim())) {
            console.log('❌ Validation failed: Question is required');
            return res.status(400).json({ 
                message: 'Missing required field: question',
                error: 'VALIDATION_ERROR',
                received: { question, questionType, notes }
            });
        }

        // Validate paperId
        if (!req.params.id) {
            console.log('❌ Validation failed: Paper ID is required');
            return res.status(400).json({ 
                message: 'Paper ID is required',
                error: 'MISSING_PAPER_ID'
            });
        }

        // Validate paperId format
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            console.log('❌ Validation failed: Invalid Paper ID format');
            return res.status(400).json({ 
                message: 'Invalid Paper ID format',
                error: 'INVALID_PAPER_ID',
                received: req.params.id
            });
        }

        const paper = await Paper.findById(req.params.id);
        
        console.log('📄 Paper lookup result:', {
            found: !!paper,
            paperId: req.params.id
        });

        if (!paper) {
            return res.status(404).json({ 
                message: 'Paper not found',
                error: 'PAPER_NOT_FOUND',
                paperId: req.params.id
            });
        }
        
        if (paper.userId.toString() !== req.user.id) {
            console.log('❌ Authorization failed:', {
                paperUserId: paper.userId.toString(),
                requestUserId: req.user.id
            });
            return res.status(401).json({ 
                message: 'Unauthorized: You do not own this paper',
                error: 'UNAUTHORIZED'
            });
        }

        // Initialize importantQuestions array if not exists
        if (!paper.importantQuestions) {
            paper.importantQuestions = [];
        }

        // Normalize questionType to valid values
        const validTypes = ['Reference', 'Important', 'Numerical', 'Specific', 'Theoretical', 'Conceptual', 'Application'];
        const normalizedType = validTypes.includes(questionType) ? questionType : 'Important';

        const newQuestion = {
            question: question.trim(),
            questionType: normalizedType,
            addedBy: req.user.id,
            addedAt: new Date(),
            notes: notes || ''
        };

        console.log('💾 Adding question:', newQuestion);

        paper.importantQuestions.push(newQuestion);

        await paper.save();
        
        console.log('✅ Question added successfully');

        try {
            if (req.logActivity) {
                await req.logActivity('important_question_added', { 
                    paperId: paper.id,
                    questionType: normalizedType
                });
            }
        } catch (logError) {
            console.warn('⚠️ Failed to log activity:', logError.message);
            // Don't fail the request if logging fails
        }

        res.json({ 
            message: 'Important question added', 
            importantQuestion: paper.importantQuestions[paper.importantQuestions.length - 1]
        });
    } catch (err) {
        console.error('❌ Error in POST /:id/important-questions:', err);
        
        // Check for specific Mongoose errors
        if (err.name === 'ValidationError') {
            return res.status(400).json({ 
                message: 'Validation error: ' + err.message,
                error: 'VALIDATION_ERROR',
                details: err.errors
            });
        }
        
        if (err.name === 'CastError') {
            return res.status(400).json({ 
                message: 'Invalid ID format',
                error: 'CAST_ERROR',
                details: err.message
            });
        }
        
        res.status(500).json({ 
            message: 'Server Error: ' + err.message,
            error: 'SERVER_ERROR'
        });
    }
});

// Get Important Questions for a Paper
router.get('/:id/important-questions', auth, async (req, res) => {
    try {
        const paper = await Paper.findById(req.params.id).populate('importantQuestions.addedBy', 'name email');
        if (!paper) return res.status(404).json({ message: 'Paper not found' });
        if (paper.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        res.json({ importantQuestions: paper.importantQuestions || [] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// Delete Important Question
router.delete('/:id/important-questions/:questionId', auth, async (req, res) => {
    try {
        const paper = await Paper.findById(req.params.id);
        if (!paper) return res.status(404).json({ message: 'Paper not found' });
        if (paper.userId.toString() !== req.user.id) return res.status(401).json({ message: 'Unauthorized' });

        paper.importantQuestions = (paper.importantQuestions || []).filter(
            q => q._id.toString() !== req.params.questionId
        );

        await paper.save();
        res.json({ message: 'Question removed', paper });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// ==================== IMPORTANT TOPICS ENDPOINTS ====================

// Add Important Topic
router.post('/:id/important-topics', auth, async (req, res) => {
    try {
        const paper = await Paper.findById(req.params.id);
        if (!paper) return res.status(404).json({ message: 'Paper not found' });
        if (paper.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { topic, priority } = req.body;
        if (!topic || topic.trim().length === 0) {
            return res.status(400).json({ message: 'Topic is required' });
        }

        if (!paper.importantTopicsList) {
            paper.importantTopicsList = [];
        }

        paper.importantTopicsList.push({
            topic: topic.trim(),
            priority: priority || 'Medium',
            addedBy: req.user.id,
            addedAt: new Date()
        });

        // Also update the config.importantTopics string for backward compatibility
        const topicsString = paper.importantTopicsList.map(t => t.topic).join(', ');
        if (!paper.config) paper.config = {};
        paper.config.importantTopics = topicsString;

        paper.isAutoSaved = true;
        paper.lastAutoSaveAt = new Date();

        await paper.save();
        console.log('💾 Auto-saved: Important topic added');

        if (req.logActivity) await req.logActivity('important_topic_added', { paperId: paper.id, topic: topic.trim() });

        res.json({ message: 'Topic added', importantTopicsList: paper.importantTopicsList });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// Get Important Topics for a Paper
router.get('/:id/important-topics', auth, async (req, res) => {
    try {
        const paper = await Paper.findById(req.params.id).populate('importantTopicsList.addedBy', 'name email');
        if (!paper) return res.status(404).json({ message: 'Paper not found' });
        if (paper.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        res.json({ importantTopicsList: paper.importantTopicsList || [] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// Delete Important Topic
router.delete('/:id/important-topics/:topicId', auth, async (req, res) => {
    try {
        const paper = await Paper.findById(req.params.id);
        if (!paper) return res.status(404).json({ message: 'Paper not found' });
        if (paper.userId.toString() !== req.user.id) return res.status(401).json({ message: 'Unauthorized' });

        paper.importantTopicsList = (paper.importantTopicsList || []).filter(
            t => t._id.toString() !== req.params.topicId
        );

        // Update the config.importantTopics string for backward compatibility
        const topicsString = paper.importantTopicsList.map(t => t.topic).join(', ');
        if (!paper.config) paper.config = {};
        paper.config.importantTopics = topicsString;

        paper.isAutoSaved = true;
        paper.lastAutoSaveAt = new Date();

        await paper.save();
        console.log('💾 Auto-saved: Important topic removed');

        res.json({ message: 'Topic removed', importantTopicsList: paper.importantTopicsList });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// ==================== VERSION HISTORY ENDPOINTS ====================

// Get all versions of a paper
router.get('/:id/versions', auth, async (req, res) => {
    try {
        const paper = await Paper.findById(req.params.id).populate('versions.modifiedBy', 'name email');
        if (!paper) return res.status(404).json({ message: 'Paper not found' });
        if (paper.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Return version metadata without full content for performance
        const versionsSummary = (paper.versions || []).map((v, idx) => ({
            _id: v._id,
            versionNumber: v.versionNumber,
            createdAt: v.createdAt,
            aiModel: v.aiModel,
            changeReason: v.changeReason || 'generation',
            modifiedBy: v.modifiedBy,
            isCurrent: idx === (paper.currentVersionIndex || paper.versions.length - 1)
        }));

        res.json({ 
            versions: versionsSummary,
            currentVersionIndex: paper.currentVersionIndex || paper.versions.length - 1,
            totalVersions: paper.versions.length
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// Get specific version content
router.get('/:id/versions/:versionId', auth, async (req, res) => {
    try {
        const paper = await Paper.findById(req.params.id);
        if (!paper) return res.status(404).json({ message: 'Paper not found' });
        if (paper.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const version = paper.versions.find(v => v._id.toString() === req.params.versionId);
        if (!version) {
            return res.status(404).json({ message: 'Version not found' });
        }

        res.json({ version });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// Get Generation Status
router.get('/:id/generation-status', auth, async (req, res) => {
    try {
        const paper = await Paper.findById(req.params.id);
        if (!paper) return res.status(404).json({ message: 'Paper not found' });
        if (paper.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        res.json({ 
            generationStatus: paper.generationStatus || { status: 'pending', progress: 0 }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// Update Paper Content (after editing)
router.put('/:id/update-content', auth, async (req, res) => {
    try {
        const paper = await Paper.findById(req.params.id);
        if (!paper) return res.status(404).json({ message: 'Paper not found' });
        if (paper.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!paper.versions || paper.versions.length === 0) {
            return res.status(400).json({ message: 'No version found to update' });
        }

        const latestVersion = paper.versions[paper.versions.length - 1];
        latestVersion.generatedContentHTML = req.body.content;
        await paper.save();

        if (req.logActivity) await req.logActivity('paper_edited', { paperId: paper.id });

        res.json({ message: 'Paper updated successfully', paper });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Get Single Paper
router.get('/:id', auth, async (req, res) => {
    try {
        const paper = await Paper.findById(req.params.id);
        if (!paper) return res.status(404).json({ message: 'Paper not found' });
        if (paper.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        res.json(paper);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Export Paper Routes
const { exportToPDF, exportToDOCX, exportToHTML } = require('../services/exportService');

router.get('/:id/export/pdf', auth, async (req, res) => {
    try {
        const paper = await Paper.findById(req.params.id);
        if (!paper) return res.status(404).json({ message: 'Paper not found' });
        if (paper.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!paper.versions || paper.versions.length === 0) {
            return res.status(400).json({ message: 'No generated paper found. Please generate the paper first.' });
        }

        const latestVersion = paper.versions[paper.versions.length - 1];
        if (!latestVersion || !latestVersion.generatedContentHTML) {
            return res.status(400).json({ message: 'Generated content not found for this paper version.' });
        }

        const pdfBuffer = await exportToPDF(latestVersion.generatedContentHTML);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${paper.paperName}.pdf"`);
        res.send(pdfBuffer);
    } catch (err) {
        console.error(err);
        res.status(500).send('Export Error');
    }
});

router.get('/:id/export/docx', auth, async (req, res) => {
    try {
        const paper = await Paper.findById(req.params.id);
        if (!paper) return res.status(404).json({ message: 'Paper not found' });
        if (paper.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!paper.versions || paper.versions.length === 0) {
            return res.status(400).json({ message: 'No generated paper found. Please generate the paper first.' });
        }

        const latestVersion = paper.versions[paper.versions.length - 1];
        if (!latestVersion || !latestVersion.generatedContentJSON) {
            return res.status(400).json({ message: 'Generated content not found for this paper version.' });
        }

        const docxBuffer = await exportToDOCX(latestVersion.generatedContentJSON);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${paper.paperName}.docx"`);
        res.send(docxBuffer);
    } catch (err) {
        console.error(err);
        res.status(500).send('Export Error');
    }
});

router.get('/:id/export/html', auth, async (req, res) => {
    try {
        const paper = await Paper.findById(req.params.id);
        if (!paper) return res.status(404).json({ message: 'Paper not found' });
        if (paper.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!paper.versions || paper.versions.length === 0) {
            return res.status(400).json({ message: 'No generated paper found. Please generate the paper first.' });
        }

        const latestVersion = paper.versions[paper.versions.length - 1];
        if (!latestVersion || !latestVersion.generatedContentHTML) {
            return res.status(400).json({ message: 'Generated content not found for this paper version.' });
        }

        const htmlBuffer = exportToHTML(latestVersion.generatedContentHTML);

        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename="${paper.paperName}.html"`);
        res.send(htmlBuffer);
    } catch (err) {
        console.error(err);
        res.status(500).send('Export Error');
    }
});

router.get('/:id/export/answer-key', auth, async (req, res) => {
    try {
        const paper = await Paper.findById(req.params.id);
        if (!paper) return res.status(404).json({ message: 'Paper not found' });
        if (paper.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!paper.versions || paper.versions.length === 0) {
            return res.status(400).json({ message: 'No generated paper found. Please generate the paper first.' });
        }

        const latestVersion = paper.versions[paper.versions.length - 1];
        if (!latestVersion) {
            return res.status(400).json({ message: 'Paper version not found.' });
        }

        if (!latestVersion.generatedAnswerKeyHTML) {
            return res.status(404).json({ message: 'Answer Key not generated for this paper' });
        }

        const pdfBuffer = await exportToPDF(latestVersion.generatedAnswerKeyHTML);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${paper.paperName}_AnswerKey.pdf"`);
        res.send(pdfBuffer);
    } catch (err) {
        console.error(err);
        res.status(500).send('Export Error');
    }
});

// Suggest Important Questions
router.post('/:id/suggest-questions', auth, async (req, res) => {
    try {
        const paper = await Paper.findById(req.params.id);
        if (!paper) return res.status(404).json({ message: 'Paper not found' });
        if (paper.userId.toString() !== req.user.id) return res.status(401).json({ message: 'Unauthorized' });

        // Combine all text chunks
        const extractedText = paper.extractedData.textChunks 
            ? paper.extractedData.textChunks.join('\n\n---\n\n')
            : (paper.extractedData.fullText || '');

        if (!extractedText || extractedText.trim().length < 100) {
            return res.status(400).json({ 
                message: 'Insufficient content. Please upload reference materials first.' 
            });
        }

        const { suggestImportantQuestions } = require('../services/questionSuggestionService');
        const subjectName = paper.config.cifData?.subjectName || paper.subject || null;
        const result = await suggestImportantQuestions(extractedText, subjectName);

        res.json(result);
    } catch (err) {
        console.error('Question suggestion error:', err);
        res.status(500).json({ 
            message: 'Failed to generate suggestions', 
            error: process.env.NODE_ENV === 'development' ? err.message : undefined 
        });
    }
});

// CIF Parsing Route
router.post('/parse-cif', auth, upload.single('cif'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No CIF file uploaded' });

        let text = '';
        if (req.file.mimetype === 'application/pdf') {
            const data = await pdfParse(req.file.buffer);
            text = data.text;
        } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const result = await mammoth.extractRawText({ buffer: req.file.buffer });
            text = result.value;
        } else {
            text = req.file.buffer.toString('utf8');
        }

        if (!text || text.trim().length < 10) {
            return res.status(400).json({ message: 'File appears to be empty or could not be parsed' });
        }

        // Use enhanced parsing service
        const { parseCIF } = require('../services/parsingService');
        const parsedData = await parseCIF(text);

        res.json(parsedData);
    } catch (err) {
        console.error('CIF Parsing Error:', err);
        res.status(500).json({ 
            message: 'CIF Parsing Error', 
            error: process.env.NODE_ENV === 'development' ? err.message : undefined 
        });
    }
});

module.exports = router;
