import { NextResponse } from "next/server";
import { connectionDb } from "@/config/db_config";
import Project from "@/models/projects.model";
import User from "@/models/users.model";
import Task from "@/models/task.model";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import { tokenSecret } from "@/env_config/env_conf";

export async function GET(request, { params }) {
	try {
		await connectionDb();
		const cookieStore = await cookies();
		const token = cookieStore.get("token")?.value;

		if (!token) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const decoded = verify(token, tokenSecret);
		const user = await User.findById(decoded.id);

		if (!user || user.role !== "admin") {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		const { id } = await params;
		const project = await Project.findById(id)
			.populate("teamId", "name")
			.populate("createdBy", "full_name email");

		if (!project) {
			return NextResponse.json({ error: "Project not found" }, { status: 404 });
		}

		return NextResponse.json({ project }, { status: 200 });
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

		const decoded = verify(token, tokenSecret);
		const user = await User.findById(decoded.id);

		if (!user || user.role !== "admin") {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		const { id } = await params;
		const { name, description, teamId } = await request.json();

		const project = await Project.findByIdAndUpdate(
			id,
			{ name, description, teamId },
			{ new: true, runValidators: true },
		)
			.populate("teamId", "name")
			.populate("createdBy", "full_name email");

		if (!project) {
			return NextResponse.json({ error: "Project not found" }, { status: 404 });
		}

		return NextResponse.json({ project }, { status: 200 });
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

		const decoded = verify(token, tokenSecret);
		const user = await User.findById(decoded.id);

		if (!user || user.role !== "admin") {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		const { id } = await params;
		const project = await Project.findById(id);

		if (!project) {
			return NextResponse.json({ error: "Project not found" }, { status: 404 });
		}

		await Task.deleteMany({ projectId: id });
		await Project.findByIdAndDelete(id);

		return NextResponse.json(
			{ message: "Project deleted successfully" },
			{ status: 200 },
		);
	} catch (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}
