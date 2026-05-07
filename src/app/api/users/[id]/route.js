import { NextResponse } from "next/server";
import { connectionDb } from "@/config/db_config";
import User from "@/models/users.model";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

async function requireAdmin() {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;
	if (!token) return null;
	const decoded = verify(token, process.env.TOKEN_SECRET);
	const user = await User.findById(decoded.id);
	if (!user || user.role !== "admin") return null;
	return user;
}

// ── DELETE /api/users/[id] ───────────────────────────────────────────────────
export async function DELETE(request, { params }) {
	try {
		await connectionDb();
		const admin = await requireAdmin();
		if (!admin) {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		const { id } = await params;

		const user = await User.findById(id);
		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}
		if (user.role === "admin") {
			return NextResponse.json({ error: "Cannot delete an admin account" }, { status: 403 });
		}

		await User.findByIdAndDelete(id);
		return NextResponse.json({ message: "User deleted successfully" }, { status: 200 });
	} catch (error) {
		console.error("Users DELETE Error:", error);
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}

// ── PATCH /api/users/[id]  (reset password by admin) ────────────────────────
export async function PATCH(request, { params }) {
	try {
		await connectionDb();
		const admin = await requireAdmin();
		if (!admin) {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		const { id } = await params;
		const { password } = await request.json();

		if (!password || password.length < 6) {
			return NextResponse.json(
				{ error: "Password must be at least 6 characters" },
				{ status: 400 },
			);
		}

		const user = await User.findById(id);
		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		const hashed = await bcrypt.hash(password, 10);
		await User.findByIdAndUpdate(id, { password: hashed, refreshToken: null });

		return NextResponse.json({ message: "Password updated successfully" }, { status: 200 });
	} catch (error) {
		console.error("Users PATCH Error:", error);
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}
