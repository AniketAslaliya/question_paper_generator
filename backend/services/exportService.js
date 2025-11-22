const htmlPdf = require('html-pdf-node');
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');

const exportToPDF = async (htmlContent) => {
    const options = { format: 'A4' };
    const file = { content: htmlContent };

    try {
        const pdfBuffer = await htmlPdf.generatePdf(file, options);
        return pdfBuffer;
    } catch (error) {
        console.error('PDF Generation Error:', error);
        throw new Error('Failed to generate PDF');
    }
};

const exportToDOCX = async (paperData) => {
    try {
        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        text: paperData.title || 'Question Paper',
                        heading: HeadingLevel.HEADING_1,
                    }),
                    new Paragraph({
                        text: paperData.instructions || '',
                        spacing: { after: 200 }
                    }),
                    ...paperData.sections.flatMap(section => [
                        new Paragraph({
                            text: section.name,
                            heading: HeadingLevel.HEADING_2,
                            spacing: { before: 200 }
                        }),
                        new Paragraph({
                            text: section.instructions || '',
                            spacing: { after: 100 }
                        }),
                        ...section.questions.flatMap(q => [
                            new Paragraph({
                                children: [
                                    new TextRun({ text: `Q${q.id}. `, bold: true }),
                                    new TextRun({ text: q.text }),
                                    new TextRun({ text: ` [${q.marks} marks]`, italics: true })
                                ],
                                spacing: { before: 100, after: 100 }
                            })
                        ])
                    ])
                ]
            }]
        });

        const buffer = await Packer.toBuffer(doc);
        return buffer;
    } catch (error) {
        console.error('DOCX Generation Error:', error);
        throw new Error('Failed to generate DOCX');
    }
};

const exportToHTML = (htmlContent) => {
    const styledHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Question Paper</title>
  <style>
    body { font-family: 'Times New Roman', serif; max-width: 800px; margin: 40px auto; padding: 20px; }
    h1 { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
    h2 { margin-top: 30px; border-bottom: 1px solid #666; }
    .question { margin: 15px 0; line-height: 1.6; }
    .marks { float: right; font-weight: bold; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>
  `;
    return Buffer.from(styledHTML, 'utf-8');
};

module.exports = { exportToPDF, exportToDOCX, exportToHTML };
