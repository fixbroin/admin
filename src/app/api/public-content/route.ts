
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getGeneralSettings } from '@/app/admin/settings/actions/general-actions';
import { getThemeSettings } from '@/app/admin/settings/actions/theme-actions';
import { getServices } from '@/app/admin/settings/actions/services-actions';
import { getPortfolioItems } from '@/app/admin/settings/actions/portfolio-actions';
import { getPricingPlans } from '@/app/admin/settings/actions/pricing-actions';
import { getFaqs } from '@/app/admin/settings/actions/faq-actions';
import { getTestimonials } from '@/app/admin/testimonials/actions';
import { getAllSeoData } from '@/app/admin/seo-geo-settings/actions';
import { getMarketingSettings } from '@/app/admin/marketing/actions';
import { getHomePageContent } from '@/app/admin/settings/actions/home-actions';
import { getLegalPages } from '@/app/admin/settings/actions/legal-actions';
import { getContactDetails } from '@/app/admin/settings/actions/contact-actions';
import { getPaymentSettings } from '@/app/admin/settings/actions/payment-actions';

export async function GET(request: Request) {
    try {
        // Fetch everything in parallel for maximum speed
        const [
            general, theme, services, portfolio, pricing, faqs, testimonials, seo, marketing, home, legal, contact, payment
        ] = await Promise.all([
            getGeneralSettings(),
            getThemeSettings(),
            getServices(),
            getPortfolioItems(),
            getPricingPlans(),
            getFaqs(),
            getTestimonials(),
            getAllSeoData(),
            getMarketingSettings(),
            getHomePageContent(),
            getLegalPages(),
            getContactDetails(),
            getPaymentSettings()
        ]);

        return NextResponse.json({
            success: true,
            data: {
                general,
                theme,
                services,
                portfolio,
                pricing,
                faqs,
                testimonials,
                seo,
                marketing,
                home,
                legal,
                contact,
                payment
            }
        }, {
            headers: {
                'Access-Control-Allow-Origin': '*', // Allow the main domain to fetch
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
            }
        });
    } catch (error: any) {
        console.error("Public content API error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
