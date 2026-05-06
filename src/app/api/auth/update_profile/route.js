import { NextResponse } from "next/server";
import { connectionDb } from "@/config/db_config";
import UsersModel from "@/models/users.model";
import { JwtTokenData } from "@/utils/token_data";

export async function PATCH(request) {
	try {
		await connectionDb();

		const decoded = JwtTokenData(request);
		const body = await request.json();

		const allowedFields = ["full_name", "job_title", "department"];
		const updateData = {};

		for (const field of allowedFields) {
			if (body[field] !== undefined) {
				updateData[field] = body[field];
			}
		}

		if (Object.keys(updateData).length === 0) {
			return NextResponse.json(
				{ success: false, message: "No valid fields to update" },
				{ status: 400 },
			);
		}

		const updatedUser = await UsersModel.findByIdAndUpdate(
			decoded.id,
			updateData,
			{ new: true, select: "-password -refreshToken -__v" },
		);

		if (!updatedUser) {
			return NextResponse.json(
				{ success: false, message: "User not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json({
			success: true,
			message: "Profile updated successfully",
			data: updatedUser,
		});
	} catch (error) {
		console.error("Update profile error:", error);
		return NextResponse.json(
			{ success: false, message: "Failed to update profile" },
			{ status: 500 },
		);
	}
}
