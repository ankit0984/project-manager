import { render } from "@react-email/render";
import nodemailer from "nodemailer";
import crypto from "node:crypto";
import UsersModel from "@/models/users.model";
import jwt from "jsonwebtoken";
import VerificationEmail from "@/template/verifyEmail";
import PasswordReset from "@/template/passwordreset";
import {
	tokenSecret,
	smtpHost,
	smtpPort,
	smtpUser,
	smtpPass,
	senderEmail,
} from "@/env_config/env_conf";

const transporter = nodemailer.createTransport({
	host: smtpHost,
	port: smtpPort,
	auth: {
		user: smtpUser,
		pass: smtpPass,
	},
});

const ALLOWED_EMAIL_TYPES = new Set(["VERIFY", "RESET"]);

export const sendEmail = async ({ email, emailType, userId, username }) => {
	if (!ALLOWED_EMAIL_TYPES.has(emailType)) {
		throw new Error("Invalid emailType provided");
	}
	const safeUsername = String(username).replace(/[^a-zA-Z0-9_ -]/g, "");
	try {
		const rawToken = crypto.randomBytes(32).toString("hex");

		const token = jwt.sign({ userId }, tokenSecret, {
			expiresIn: "1h",
		}); //jwt for reset password

		let actionUrl;
		if (emailType === "VERIFY") {
			actionUrl = `${process.env.DOMAIN_URL}/verifyemail?token=${rawToken}`;
			await UsersModel.findByIdAndUpdate(userId, {
				verifytoken: rawToken,
				verifytokenexpiry: Date.now() + 5 * 60 * 1000, // 5 minutes instead of 10
			});
		} else {
			await UsersModel.findByIdAndUpdate(userId, {
				forgotpasswordtoken: token,
				forgotpasswordtokenexpiry: Date.now() + 5 * 60 * 1000,
			});
			actionUrl = `${process.env.DOMAIN_URL}/auth/reset-password?token=${token}`;
		}

		let htmlContent;
		if (emailType === "VERIFY") {
			htmlContent = await render(
				<VerificationEmail username={safeUsername} verificationUrl={actionUrl} />,
			);
		} else {
			htmlContent = await render(
				<PasswordReset username={safeUsername} resetUrl={actionUrl} />,
			);
		}

		const mailoptions = {
			from: senderEmail,
			to: email,
			subject: emailType === "VERIFY" ? "verify email" : "Reset your password",
			html: htmlContent,
		};
		const mailresponse = await transporter.sendMail(mailoptions);
		return mailresponse;
	} catch (error) {
		console.log(error.message);
		throw new Error(error.message);
	}
};
