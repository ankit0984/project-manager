import { NextResponse } from "next/server";
import { connectionDb } from "@/config/db_config";
import Task from "@/models/task.model";
import User from "@/models/users.model";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";

export async function GET(request, { params }) {
	try {
		await connectionDb();
		const cookieStore = await cookies();
		const token = cookieStore.get("token")?.value;

		if (!token) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const decoded = verify(token, process.env.TOKEN_SECRET);
		const user = await User.findById(decoded.id);

		if (!user || user.role !== "admin") {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		const { id } = await params;
		const task = await Task.findById(id)
			.populate("assignedTo", "full_name email")
			.populate("projectId", "name");

		if (!task) {
			return NextResponse.json({ error: "Task not found" }, { status: 404 });
		}

		return NextResponse.json({ task }, { status: 200 });
	} catch (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}

export async function PATCH(request, { params }) {
	try {
		await connectionDb();
		const cookieStore = await cookies();
		const token = cookieStore.get("token")?.value;

		if (!token) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const decoded = verify(token, process.env.TOKEN_SECRET);
		const user = await User.findById(decoded.id);

		if (!user || user.role !== "admin") {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		const { id } = await params;
		const { title, description, status, assignedTo, projectId, dueDate } =
			await request.json();

		const task = await Task.findByIdAndUpdate(
			id,
			{ title, description, status, assignedTo, projectId, dueDate },
			{ new: true, runValidators: true },
		)
			.populate("assignedTo", "full_name email")
			.populate("projectId", "name");

		if (!task) {
			return NextResponse.json({ error: "Task not found" }, { status: 404 });
		}

		return NextResponse.json({ task }, { status: 200 });
	} catch (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}

export async function DELETE(request, { params }) {
	try {
		await connectionDb();
		const cookieStore = await cookies();
		const token = cookieStore.get("token")?.value;

		if (!token) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const decoded = verify(token, process.env.TOKEN_SECRET);
		const user = await User.findById(decoded.id);

		if (!user || user.role !== "admin") {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		const { id } = await params;
		const task = await Task.findByIdAndDelete(id);

		if (!task) {
			return NextResponse.json({ error: "Task not found" }, { status: 404 });
		}

		return NextResponse.json(
			{ message: "Task deleted successfully" },
			{ status: 200 },
		);
	} catch (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}
