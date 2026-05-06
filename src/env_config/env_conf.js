const node_environment = process.env.NODE_ENV;
const prod_databaseUrl = process.env.PROD_DATABASE_URL;
const tokenSecret = process.env.TOKEN_SECRET;
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const senderEmail = process.env.SENDER_EMAIL;
const ApiBaseUrl = process.env.NEXT_PUBLIC_API_URL;


export {
	node_environment,
	prod_databaseUrl,
	tokenSecret,
	smtpHost,
	smtpPass,
	smtpPort,
	smtpUser,
	senderEmail,
	ApiBaseUrl
};
