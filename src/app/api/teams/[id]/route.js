import { NextResponse } from "next/server";
import { connectionDb } from "@/config/db_config";
import Team from "@/models/teams.model";
import User from "@/models/users.model";
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
		const team = await Team.findById(id)
			.populate("members", "full_name email job_title department")
			.populate("createdBy", "full_name email");

		if (!team) {
			return NextResponse.json({ error: "Team not found" }, { status: 404 });
		}

		return NextResponse.json({ team }, { status: 200 });
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
		const { name, members } = await request.json();

		const team = await Team.findById(id);
		if (!team) {
			return NextResponse.json({ error: "Team not found" }, { status: 404 });
		}

		const oldMembers = team.members.map((m) => m.toString());

		if (name) team.name = name;
		if (members !== undefined) team.members = members;

		await team.save();

		const removedMembers = oldMembers.filter((m) => !members.includes(m));
		if (removedMembers.length > 0) {
			await User.updateMany(
				{ _id: { $in: removedMembers } },
				{ $unset: { teamId: "" } },
			);
		}

		if (members && members.length > 0) {
			await User.updateMany({ _id: { $in: members } }, { teamId: team._id });
		}

		const updatedTeam = await Team.findById(id)
			.populate("members", "full_name email job_title department")
			.populate("createdBy", "full_name email");

		return NextResponse.json({ team: updatedTeam }, { status: 200 });
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
		const team = await Team.findById(id);

		if (!team) {
			return NextResponse.json({ error: "Team not found" }, { status: 404 });
		}

		await User.updateMany({ teamId: id }, { $unset: { teamId: "" } });

		await Team.findByIdAndDelete(id);

		return NextResponse.json(
			{ message: "Team deleted successfully" },
			{ status: 200 },
		);
	} catch (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}
