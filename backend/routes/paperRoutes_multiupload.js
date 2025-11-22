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
                    detectedExercises.push(...matches.slice(0, 5)); // Limit to 5 per pattern
                }
            });
        }

        // Extract chapters (simple approach - look for "Chapter" keyword)
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
