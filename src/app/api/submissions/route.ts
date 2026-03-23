
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from "nodemailer";
import { getEmailSettings } from "@/app/admin/settings/actions/email-actions";
import { getContactDetails } from "@/app/admin/settings/actions/contact-actions";
import { APP_NAME } from "@/lib/config";
import { createNotification } from '@/app/admin/notifications/actions';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, phone, budget, message } = body;

        if (!name || !email || !message) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const id = uuidv4();
        
        // 1. Save to database
        await db.query(
            'INSERT INTO contact_submissions (id, name, email, phone, budget, message) VALUES (?, ?, ?, ?, ?, ?)',
            [id, name, email, phone || null, budget || null, message]
        );

        // 2. Create notification
        await createNotification({
            type: 'submission',
            message: `New contact form submission from ${name}.`
        });

        // 3. Send emails
        const emailSettings = await getEmailSettings();
        const contactDetails = await getContactDetails();

        if (emailSettings.smtp_host && emailSettings.smtp_user && emailSettings.smtp_password && emailSettings.smtp_sender_email) {
            const transporter = nodemailer.createTransport({
                host: emailSettings.smtp_host,
                port: emailSettings.smtp_port,
                secure: emailSettings.smtp_port === 465,
                auth: {
                    user: emailSettings.smtp_user,
                    pass: emailSettings.smtp_password,
                },
            });

            // Email to Admin
            await transporter.sendMail({
                from: `"${APP_NAME}" <${emailSettings.smtp_sender_email}>`,
                to: contactDetails.email,
                subject: `New Contact Form Submission from ${name}`,
                html: `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                        <h2 style="color: #333;">New Contact Form Submission</h2>
                        <hr>
                        <p><strong>Name:</strong> ${name}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Message:</strong> ${message}</p>
                    </div>
                `,
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Submission API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
