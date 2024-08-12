import { google } from "googleapis";

const { GOOGLE_SERVICE_ACCOUNT } = process.env;

if (!GOOGLE_SERVICE_ACCOUNT) {
	throw new Error("GOOGLE_SERVICE_ACCOUNT is required");
}

const credential = JSON.parse(
	Buffer.from(GOOGLE_SERVICE_ACCOUNT, "base64").toString(),
) as {
	client_email: string;
	private_key: string;
};

const auth = new google.auth.GoogleAuth({
	credentials: credential,
	scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});

google.options({ auth });

export { auth, google };
