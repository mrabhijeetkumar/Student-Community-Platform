import { OAuth2Client } from "google-auth-library";

let googleClient;

const getClient = () => {
    if (!googleClient) {
        googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    }

    return googleClient;
};

export const verifyGoogleToken = async (idToken) => {
    if (!process.env.GOOGLE_CLIENT_ID) {
        throw new Error("Google OAuth is not configured");
    }

    const ticket = await getClient().verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID
    });

    return ticket.getPayload();
};