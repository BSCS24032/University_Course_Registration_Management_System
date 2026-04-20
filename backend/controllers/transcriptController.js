const db = require('../config/db');

/** Escape untrusted strings before dropping them into generated HTML. */
function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/** GET /students/me/transcript/pdf — returns a print-ready HTML document.
 *  The student (or their browser) renders and then uses Ctrl+P → Save as PDF.
 *  No external PDF library needed; this keeps the dependency list short. */
exports.getTranscriptHtml = async (req, res) => {
    try {
        const student_id = req.user.role === 'Admin' && req.query.student_id
            ? parseInt(req.query.student_id)
            : req.user.linked_id;

        if (!student_id) {
            return res.status(400).send('No student context available.');
        }

        const [[stu]] = await db.execute(
            `SELECT s.*, p.name AS program_name, p.degree_type,
                    d.name AS department_name
             FROM student s
             JOIN program p ON s.program_id = p.program_id
             JOIN department d ON p.department_id = d.department_id
             WHERE s.student_id = ?`,
            [student_id]
        );
        if (!stu) return res.status(404).send('Student not found.');

        const [rows] = await db.execute(
            `SELECT c.course_code, c.name AS course_name, c.credits,
                    sec.semester, sec.year,
                    e.grade, e.grade_points, e.status
             FROM enrollment e
             JOIN section sec ON e.section_id = sec.section_id
             JOIN course c ON sec.course_id = c.course_id
             WHERE e.student_id = ?
             ORDER BY sec.year, FIELD(sec.semester,'Spring','Summer','Fall'),
                      c.course_code`,
            [student_id]
        );

        // Group by semester
        const grouped = {};
        for (const r of rows) {
            const key = `${r.semester} ${r.year}`;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(r);
        }

        // Build per-semester tables with semester GPA
        const termBlocks = Object.entries(grouped).map(([term, courses]) => {
            let gradedCredits = 0, qualityPoints = 0;
            const rowsHtml = courses.map(c => {
                if (c.grade_points !== null && c.status === 'Completed') {
                    gradedCredits += Number(c.credits);
                    qualityPoints += Number(c.credits) * Number(c.grade_points);
                }
                return `
                    <tr>
                        <td>${esc(c.course_code)}</td>
                        <td>${esc(c.course_name)}</td>
                        <td class="num">${esc(c.credits)}</td>
                        <td>${esc(c.grade || '—')}</td>
                        <td class="num">${c.grade_points !== null ? Number(c.grade_points).toFixed(2) : '—'}</td>
                        <td>${esc(c.status)}</td>
                    </tr>`;
            }).join('');
            const sgpa = gradedCredits > 0 ? (qualityPoints / gradedCredits).toFixed(2) : '—';
            return `
                <h3>${esc(term)}</h3>
                <table class="tx">
                    <thead>
                        <tr>
                            <th>Code</th><th>Course</th><th>Credits</th>
                            <th>Grade</th><th>GP</th><th>Status</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
                <p class="term-gpa">Semester GPA: <strong>${sgpa}</strong>
                   &nbsp;|&nbsp; Credits earned: <strong>${gradedCredits}</strong></p>`;
        }).join('');

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Academic Transcript — ${esc(stu.first_name)} ${esc(stu.last_name)}</title>
    <style>
        body { font-family: Georgia, 'Times New Roman', serif; color: #222;
               max-width: 780px; margin: 30px auto; padding: 20px; }
        header { border-bottom: 3px double #333; padding-bottom: 15px; margin-bottom: 20px; }
        h1 { margin: 0 0 5px; font-size: 22px; letter-spacing: 1px; }
        .uni { font-size: 14px; color: #555; }
        .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 20px;
                margin: 20px 0; font-size: 14px; }
        .meta div b { display: inline-block; min-width: 120px; color: #333; }
        h3 { margin: 20px 0 8px; font-size: 15px; border-bottom: 1px solid #bbb;
             padding-bottom: 3px; }
        table.tx { width: 100%; border-collapse: collapse; font-size: 13px; }
        table.tx th, table.tx td { border: 1px solid #ccc; padding: 6px 8px;
                                   text-align: left; }
        table.tx th { background: #f0f0f0; }
        td.num { text-align: right; }
        .term-gpa { font-size: 13px; margin: 5px 0 15px; text-align: right; }
        .summary { margin-top: 25px; padding: 15px; border: 1px solid #333;
                   background: #fafafa; }
        .summary h2 { margin: 0 0 10px; font-size: 16px; }
        footer { margin-top: 40px; text-align: center; font-size: 11px;
                 color: #777; border-top: 1px solid #ccc; padding-top: 10px; }
        @media print {
            body { margin: 0; padding: 10px; }
            .no-print { display: none; }
            @page { margin: 1cm; }
        }
        button.print-btn { background: #1a3a6e; color: white; border: none;
                          padding: 10px 20px; font-size: 14px; cursor: pointer;
                          border-radius: 4px; }
    </style>
</head>
<body>
    <div class="no-print" style="text-align: right; margin-bottom: 15px;">
        <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
    </div>
    <header>
        <h1>ACADEMIC TRANSCRIPT</h1>
        <div class="uni">University Management System — Official Record</div>
    </header>
    <div class="meta">
        <div><b>Student Name:</b> ${esc(stu.first_name)} ${esc(stu.last_name)}</div>
        <div><b>Student ID:</b> ${esc(stu.student_id)}</div>
        <div><b>Email:</b> ${esc(stu.email)}</div>
        <div><b>Program:</b> ${esc(stu.degree_type)} ${esc(stu.program_name)}</div>
        <div><b>Department:</b> ${esc(stu.department_name)}</div>
        <div><b>Status:</b> ${esc(stu.status)}</div>
        <div><b>Enrolment Year:</b> ${esc(stu.enrollment_year || '—')}</div>
        <div><b>Issued:</b> ${new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </div>

    ${termBlocks || '<p><em>No completed coursework on record.</em></p>'}

    <div class="summary">
        <h2>Cumulative Summary</h2>
        <div><b>Cumulative GPA (CGPA):</b> ${stu.cgpa !== null ? Number(stu.cgpa).toFixed(2) : '—'}</div>
        <div><b>Credit Limit (per semester):</b> ${esc(stu.credit_limit)}</div>
    </div>

    <footer>
        This transcript was generated electronically by the University Management System.
        For verification, please contact the Registrar's Office.
    </footer>
</body>
</html>`;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.status(200).send(html);
    } catch (e) {
        res.status(500).send(`Error generating transcript: ${esc(e.message)}`);
    }
};
