const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Paper = require('../models/Paper');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { generatePaper } = require('../services/geminiService');

// Multer setup
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Phase 1: Upload & Analyze
router.post('/create-phase1', auth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

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

        // Basic extraction simulation (In real app, use AI to extract chapters)
        const chapters = ['Chapter 1', 'Chapter 2', 'Chapter 3'];

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
        res.status(500).send('Server Error');
    }
});

// Phase 1: Upload Multiple Files
router.post('/create-phase1-multi', auth, upload.array('files', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
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

        // Extract chapters
        const chapterMatches = combinedText.match(/Chapter\s+\d+[:\s-]*.*/gi);
        const chapters = chapterMatches ?
            [...new Set(chapterMatches.slice(0, 10))].map(ch => ch.trim()) :
            ['Chapter 1', 'Chapter 2', 'Chapter 3'];

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
        res.status(500).send('Server Error');
    }
});


// Phase 2: Configure Paper (Save Config)
router.post('/create-phase2', auth, async (req, res) => {
    const { paperId, config } = req.body;
    try {
        const paper = await Paper.findById(paperId);
        if (!paper) return res.status(404).json({ message: 'Paper not found' });
        if (paper.userId.toString() !== req.user.id) return res.status(401).json({ message: 'Unauthorized' });

        paper.config = config;
        paper.templateUsed = config.templateName || 'Custom';
        await paper.save();

        res.json({ message: 'Configuration saved', paper });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Phase 3: Generate Paper
router.post('/create-phase3', auth, async (req, res) => {
    const { paperId } = req.body;
    try {
        console.log('📝 Generating paper for user:', req.user.id, 'Paper ID:', paperId);

        const paper = await Paper.findById(paperId);
        if (!paper) {
            console.log('❌ Paper not found:', paperId);
            return res.status(404).json({ message: 'Paper not found' });
        }

        console.log('✅ Paper found, starting generation...');
        const generatedData = await generatePaper({
            extractedText: paper.extractedData.textChunks[0],
            templateConfig: paper.config,
            difficulty: paper.config.difficulty,
            weightage: paper.config.weightage,
            questionTypes: paper.config.questionTypes,
            sections: paper.config.sections,
            bloomsTaxonomy: paper.config.bloomsTaxonomy,
            mandatoryList: paper.config.mandatoryExercises || [],
            generateAnswerKey: paper.config.generateAnswerKey || false,
            setsRequired: paper.config.setsGenerated,
            previousVersions: [],
            referenceQuestions: paper.config.referenceQuestions || [],
            importantTopics: paper.config.importantTopics || '',
            cifData: paper.config.cifData || null
        });

        console.log('✅ Paper generated successfully');
        paper.versions.push({
            versionNumber: paper.versions.length + 1,
            generatedContentHTML: generatedData.html,
            generatedAnswerKeyHTML: generatedData.answerKeyHtml,
            generatedContentJSON: generatedData.json,
            aiModel: 'Gemini Flash 2.5'
        });

        await paper.save();

        if (req.logActivity) await req.logActivity('paper_generated', { paperId: paper.id });

        res.json({ paper, generatedData });
    } catch (err) {
        console.error('❌ Paper generation error:', err.message);
        console.error('Full error:', err);
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

        const generatedData = await generatePaper({
            extractedText: paper.extractedData.textChunks[0],
            templateConfig: paper.config,
            difficulty: paper.config.difficulty,
            weightage: paper.config.weightage,
            questionTypes: paper.config.questionTypes,
            sections: paper.config.sections,
            bloomsTaxonomy: paper.config.bloomsTaxonomy,
            mandatoryList: paper.config.mandatoryExercises || [],
            generateAnswerKey: paper.config.generateAnswerKey || false,
            setsRequired: paper.config.setsGenerated,
            previousVersions: paper.versions,
            referenceQuestions: paper.config.referenceQuestions || [],
            importantTopics: paper.config.importantTopics || '',
            cifData: paper.config.cifData || null
        });

        paper.versions.push({
            versionNumber: paper.versions.length + 1,
            generatedContentHTML: generatedData.html,
            generatedAnswerKeyHTML: generatedData.answerKeyHtml,
            generatedContentJSON: generatedData.json,
            aiModel: 'Gemini Flash 2.5'
        });

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

        const latestVersion = paper.versions[paper.versions.length - 1];
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

        const latestVersion = paper.versions[paper.versions.length - 1];
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

        const latestVersion = paper.versions[paper.versions.length - 1];
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

        const latestVersion = paper.versions[paper.versions.length - 1];

        if (!latestVersion.generatedAnswerKeyHTML) {
            return res.status(404).send('Answer Key not generated for this paper');
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

        // Parse CIF content
        const subjectNameMatch = text.match(/(?:Subject|Course)\s*(?:Name)?[\s:]+([^\n]+)/i);
        const subjectName = subjectNameMatch ? subjectNameMatch[1].trim() : 'Unknown Subject';

        // Extract topics and weightage
        const topics = [];
        const topicPatterns = [
            /(?:Unit|Module|Topic|Chapter)\s+\d+[\s:]+([^\n]+?)[\s-]+(\d+)%?/gi,
            /(\d+)\.\s+([^\n]+?)[\s-]+(\d+)%?/gi
        ];

        topicPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                if (match.length >= 3) {
                    const name = match[match.length - 2].trim();
                    const weightage = parseInt(match[match.length - 1]) || 10;
                    if (name && !topics.find(t => t.name === name)) {
                        topics.push({ name, weightage });
                    }
                }
            }
        });

        // If no topics found, create default structure
        if (topics.length === 0) {
            const lines = text.split('\n').filter(l => l.trim().length > 10);
            lines.slice(0, 5).forEach((line, idx) => {
                topics.push({
                    name: line.trim().substring(0, 100),
                    weightage: 20
                });
            });
        }

        res.json({
            subjectName,
            topics,
            totalTopics: topics.length
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('CIF Parsing Error');
    }
});

module.exports = router;
