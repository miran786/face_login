/// <reference types="vite/client" />
import emailjs from '@emailjs/browser';

// Using the same credentials from the fake_login project
// Vite uses import.meta.env instead of process.env, with VITE_ prefix
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_g0wl52i';
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_p4qx7ob';
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'StcPXy5XtG7ae3SbZ';

interface OTPTemplateParams extends Record<string, unknown> {
    to_email: string;
    otp_code: string;
}

export const sendOTP = async (email: string, otp: string): Promise<boolean> => {
    const templateParams = {
        to_email: email,
        email: email,
        user_email: email,
        recipient: email,
        reply_to: 'support@example.com',
        passcode: otp,
        otp_code: otp,
        code: otp,
        message: `Your verification code is: ${otp}`,
    };

    try {
        const response = await emailjs.send(
            SERVICE_ID,
            TEMPLATE_ID,
            templateParams,
            PUBLIC_KEY
        );
        return true;
    } catch (error) {
        console.error('Failed to send email:', error);
        return true; // continue in mock mode
    }
};

interface SuspiciousLoginMetadata {
    ip: string;
    device: string;
    location: string;
    timestamp: string;
}

// Dedicated template for suspicious login alerts
const ALERT_TEMPLATE_ID = 'template_avr2cqo';

export const sendSuspiciousLoginAlert = async (
    email: string,
    metadata: SuspiciousLoginMetadata
): Promise<boolean> => {
    const templateParams = {
        to_email: email,
        email: email,
        ip: metadata.ip,
        device: metadata.device,
        location: metadata.location,
        time: new Date(metadata.timestamp).toLocaleString(),
    };

    try {
        const response = await emailjs.send(
            SERVICE_ID,
            ALERT_TEMPLATE_ID,
            templateParams,
            PUBLIC_KEY
        );
        console.log('Suspicious login alert sent!', response.status, response.text);
        return true;
    } catch (error) {
        console.error('Failed to send suspicious login alert:', error);
        return true;
    }
};
