import emailjs from '@emailjs/browser';

// Service ID provided by user
const SERVICE_ID = 'service_du1h5i1';
// Placeholders - User needs to fill these or provide them
const TEMPLATE_ID = 'template_wg2bduq';
const PUBLIC_KEY = '5KrNj6cWERlaQuo5Z';

export const emailService = {
    // Initialize SDK (optional, but good practice)
    init: () => {
        emailjs.init(PUBLIC_KEY);
    },

    sendOTP: async (email: string, otp: string, purpose: string = 'Verification') => {
        try {
            const time = new Date(Date.now() + 15 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const templateParams = {
                to_email: email,
                to_name: email.split('@')[0],
                passcode: otp, // Matches {{passcode}}
                time: time,    // Matches {{time}}
                purpose: purpose
            };

            const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
            console.log('OTP Email sent!', response.status, response.text);
            return { success: true };
        } catch (error) {
            console.error('Failed to send OTP email:', error);
            return { success: false, error };
        }
    },

    sendPasswordReset: async (email: string, otp: string) => {
        return emailService.sendOTP(email, otp, 'Password Reset');
    },

    sendTransactionNotification: async (toEmail: string, toName: string, amount: number, senderName: string) => {
        try {
            const templateParams = {
                to_email: toEmail,
                to_name: toName,
                message: `You have received ₹${amount} from ${senderName}.`,
                // Re-using the generic message/otp template structure might vary, 
                // but let's assume a generic text field 'message' exists in the template.
            };

            const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
            console.log('Transaction Email sent!', response.status, response.text);
            return { success: true };
        } catch (error) {
            console.error('Failed to send transaction email:', error);
            return { success: false, error };
        }
    }
};
