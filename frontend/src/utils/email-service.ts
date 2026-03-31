/// <reference types="vite/client" />
import emailjs from '@emailjs/browser';

// EmailJS credentials
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_g0wl52i';
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_p4qx7ob';
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'StcPXy5XtG7ae3SbZ';

// Dedicated template for suspicious login alerts
const ALERT_TEMPLATE_ID = 'template_avr2cqo';

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
        await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
        return true;
    } catch (error) {
        console.error('Failed to send OTP email:', error);
        return false;
    }
};

// Send OTP for password reset — reuses the OTP template
export const sendPasswordResetOTP = async (email: string, otp: string): Promise<boolean> => {
    const templateParams = {
        to_email: email,
        email: email,
        user_email: email,
        recipient: email,
        reply_to: 'support@example.com',
        passcode: otp,
        otp_code: otp,
        code: otp,
        message: `Your password reset code is: ${otp}. It expires in 10 minutes. If you did not request this, please ignore.`,
    };

    try {
        await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
        return true;
    } catch (error) {
        console.error('Failed to send password reset email:', error);
        return false;
    }
};

interface SuspiciousLoginMetadata {
    ip: string;
    device: string;
    location: string;
    timestamp: string;
}

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
        const response = await emailjs.send(SERVICE_ID, ALERT_TEMPLATE_ID, templateParams, PUBLIC_KEY);
        console.log('Suspicious login alert sent!', response.status, response.text);
        return true;
    } catch (error) {
        console.error('Failed to send suspicious login alert:', error);
        return false;
    }
};
