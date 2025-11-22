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
