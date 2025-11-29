import express from "express";
import multer from "multer";
import { Resend } from "resend";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const app = express();
const upload = multer({ dest: "uploads/" });
const resend = new Resend(process.env.RESEND_API_KEY);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/contact", upload.any(), async (req, res) => {
    try {
        const { body, files } = req;
        console.log("Received form data:", body);

        // Build HTML table
        let htmlContent = "<h2>New Form Submission</h2><table border='1' cellpadding='5'>";
        Object.keys(body).forEach(key => {
            if (key !== "sendTo") {
                htmlContent += `<tr><td><strong>${key}</strong></td><td>${body[key]}</td></tr>`;
            }
        });
        htmlContent += "</table>";

        // Convert uploaded files to base64 for Resend
        let attachments = [];
        if (files && files.length > 0) {
            attachments = files.map(file => {
                const content = fs.readFileSync(file.path).toString("base64");
                return {
                    filename: file.originalname,
                    type: file.mimetype,
                    content // ✅ use 'content' here
                };
            });
        }

        // Send email via Resend
        const emailResponse = await resend.emails.send({
            from: "Form Notification <admin@thetechtide.site>",
            to: body.sendTo,
            subject: "New Form Submission",
            html: htmlContent,
            attachments,
        });

        console.log("Email response from Resend:", emailResponse);

        // Clean up uploaded files
        if (files) {
            files.forEach(f => fs.unlinkSync(f.path));
        }

        res.json({ success: true, message: "Email sent successfully!" });
    } catch (err) {
        console.error("Error sending email:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.listen(process.env.PORT || 3000, () =>
    console.log(`Server running on port ${process.env.PORT || 3000}`)
);
