import { NextResponse } from "next/server";
import { connectionDb } from "@/config/db_config";
import Project from "@/models/projects.model";
import User from "@/models/users.model";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import { tokenSecret } from "@/env_config/env_conf";

export async function GET(request) {
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

		const projects = await Project.find()
			.populate("teamId", "name")
			.populate("createdBy", "full_name email")
			.sort({ createdAt: -1 });

		return NextResponse.json({ projects }, { status: 200 });
	} catch (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}

export async function POST(request) {
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

		const { name, description, teamId } = await request.json();

		if (!name || !teamId) {
			return NextResponse.json(
				{ error: "Name and teamId are required" },
				{ status: 400 },
			);
		}

		const project = await Project.create({
			name,
			description,
			teamId,
			createdBy: user._id,
		});

		const populatedProject = await Project.findById(project._id)
			.populate("teamId", "name")
			.populate("createdBy", "full_name email");

		return NextResponse.json({ project: populatedProject }, { status: 201 });
	} catch (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}
