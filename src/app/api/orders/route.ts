
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { getPaymentSettings } from '@/app/admin/settings/actions/payment-actions';
import { createNotification } from '@/app/admin/notifications/actions';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, payload } = body;

        if (action === 'create-razorpay-order') {
            const paymentSettings = await getPaymentSettings();
            if (!paymentSettings || !paymentSettings.razorpay_key_id || !paymentSettings.razorpay_key_secret) {
                return NextResponse.json({ success: false, error: "Razorpay credentials are not configured." }, { status: 400 });
            }

            const instance = new Razorpay({
                key_id: paymentSettings.razorpay_key_id,
                key_secret: paymentSettings.razorpay_key_secret,
            });

            const order = await instance.orders.create({
                amount: payload.amount * 100,
                currency: "INR",
                receipt: `receipt_order_${Date.now()}`,
                payment_capture: 1,
            });

            return NextResponse.json({ success: true, order });
        }

        if (action === 'save-order') {
            const { customer_name, customer_email, plan_title, amount, razorpay_payment_id, razorpay_order_id, razorpay_signature, status } = payload;
            
            // Signature verification
            if (status === 'completed') {
                const paymentSettings = await getPaymentSettings();
                const generated_signature = crypto
                    .createHmac('sha256', paymentSettings!.razorpay_key_secret!)
                    .update(razorpay_order_id + "|" + razorpay_payment_id)
                    .digest('hex');

                if (generated_signature !== razorpay_signature) {
                     return NextResponse.json({ success: false, error: 'Payment verification failed.' }, { status: 400 });
                }
            }

            const id = uuidv4();
            await db.query(
                'INSERT INTO orders (id, customer_name, customer_email, plan_title, plan_price, payment_method, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [id, customer_name, customer_email, plan_title, amount.toString(), razorpay_payment_id, status]
            );

            if (status === 'completed') {
                await createNotification({
                    type: 'order',
                    message: `${customer_name} purchased ${plan_title} for ₹${amount.toLocaleString()}.`
                });
            }

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error("Orders API Error:", error);
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
