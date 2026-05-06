import { connectionDb } from "@/config/db_config";
import { NextResponse } from "next/server";

export async function GET() {
	try {
		await connectionDb();
	} catch (error) {
		NextResponse.json({ error: error.message }, { status: 500 });
	}
}
