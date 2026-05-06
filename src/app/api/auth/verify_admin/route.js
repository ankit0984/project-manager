import { NextResponse } from "next/server";
import { verifyEmailSchema } from "@/schema/login.schema";
import { connectionDb } from "@/config/db_config";
import UsersModel from "@/models/users.model";


export async function POST(request) {
	try {
		await connectionDb();

		const reqBody = await request.json();
		const { token } = verifyEmailSchema.parse(reqBody);

		const verifyuser = await UsersModel.findOne({
			verifytoken: token,
			verifytokenexpiry: { $gt: Date.now() },
		});
		if (!verifyuser) {
			return NextResponse.json(
				{
					error: "Invalid token.",
				},
				{ status: 400 },
			);
		}
		verifyuser.isverified = true;
		verifyuser.isAdmin = true;
		verifyuser.verifytoken = null;
		verifyuser.verifytokenexpiry = null;
		await verifyuser.save();
		return NextResponse.json(
			{
				message: "Email Verified Successfully",
				success: true,
			},
			{ status: 200 },
		);
	} catch (error) {
		return NextResponse.json(
			{ error: "Token verification failed", message: error.message },
			{ status: 500 },
		);
	}
}
