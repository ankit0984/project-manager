import { NextResponse } from "next/server";
import { connectionDb } from "@/config/db_config";
import Task from "@/models/task.model";
import User from "@/models/users.model";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";

async function getMember() {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;
	if (!token) return null;
	try {
		const decoded = verify(token, process.env.TOKEN_SECRET);
		return await User.findById(decoded.id);
	} catch {
		return null;
	}
}

// GET /api/member/tasks
export async function GET(request) {
	try {
		await connectionDb(); // must be before getMember() so models are registered
		const user = await getMember();
		if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

		const { searchParams } = new URL(request.url);
		const status = searchParams.get("status");

		const query = { assignedTo: user._id };
		if (status && ["todo", "in-progress", "done"].includes(status)) {
			query.status = status;
		}

		const tasks = await Task.find(query)
			.populate("projectId", "name description")
			.populate({ path: "updates.postedBy", select: "full_name", strictPopulate: false })
			.sort({ createdAt: -1 });

		return NextResponse.json({ tasks });
	} catch (error) {
		console.error("GET /api/member/tasks error:", error.message);
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}
