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

// PATCH /api/member/tasks/[id]
export async function PATCH(request, { params }) {
	try {
		await connectionDb();
		const user = await getMember();
		if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

		const { id } = await params;
		const task = await Task.findById(id);

		if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
		if (task.assignedTo.toString() !== user._id.toString()) {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		const body = await request.json();

		if (body.status) {
			const allowed = ["todo", "in-progress", "done"];
			if (!allowed.includes(body.status)) {
				return NextResponse.json({ error: "Invalid status" }, { status: 400 });
			}
			task.status = body.status;
		}

		if (body.note && body.note.trim()) {
			task.updates.push({ note: body.note.trim(), postedBy: user._id });
		}

		await task.save();

		const updated = await Task.findById(id)
			.populate("projectId", "name description")
			.populate({ path: "updates.postedBy", select: "full_name", strictPopulate: false });

		return NextResponse.json({ task: updated });
	} catch (error) {
		console.error("PATCH /api/member/tasks/[id] error:", error.message);
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}

// GET /api/member/tasks/[id]
export async function GET(request, { params }) {
	try {
		await connectionDb();
		const user = await getMember();
		if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

		const { id } = await params;
		const task = await Task.findById(id)
			.populate("projectId", "name description")
			.populate({ path: "updates.postedBy", select: "full_name", strictPopulate: false });

		if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
		if (task.assignedTo.toString() !== user._id.toString()) {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		return NextResponse.json({ task });
	} catch (error) {
		console.error("GET /api/member/tasks/[id] error:", error.message);
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}
