
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
        }

        const id = uuidv4();
        await db.query(
            'INSERT INTO newsletter_subscribers (id, email) VALUES (?, ?) ON DUPLICATE KEY UPDATE subscribedAt = CURRENT_TIMESTAMP',
            [id, email]
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Newsletter API Error:", error);
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
