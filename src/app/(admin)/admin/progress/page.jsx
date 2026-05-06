"use client";
import { useEffect, useState, useCallback } from "react";
import { get_admin_progress_api } from "@/api/api";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	ChevronRightIcon,
	ChevronLeftIcon,
	SearchIcon,
	FolderKanbanIcon,
	UserIcon,
	CheckCircle2Icon,
	ClockIcon,
	ListTodoIcon,
	AlertTriangleIcon,
	CalendarIcon,
	MessageSquareIcon,
} from "lucide-react";
import { toast } from "sonner";

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_BADGE = { todo: "secondary", "in-progress": "default", done: "outline" };
const STATUS_LABEL = { todo: "To Do", "in-progress": "In Progress", done: "Done" };

function fmtDate(d) {
	if (!d) return null;
	return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function fmtTime(d) {
	if (!d) return "";
	return new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}
function isOverdue(task) {
	return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";
}

// ── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value, className = "" }) {
	return (
		<div className={`h-2 w-full rounded-full bg-muted overflow-hidden ${className}`}>
			<div
				className="h-full rounded-full bg-primary transition-all duration-500"
				style={{ width: `${Math.min(100, value)}%` }}
			/>
		</div>
	);
}

// ── Stat pill ─────────────────────────────────────────────────────────────────
function StatPill({ icon: Icon, label, value, color }) {
	return (
		<div className="flex items-center gap-1.5 text-xs">
			<Icon className={`h-3.5 w-3.5 ${color}`} />
			<span className="text-muted-foreground">{label}:</span>
			<span className="font-semibold">{value}</span>
		</div>
	);
}

// ── Daily updates panel ───────────────────────────────────────────────────────
function UpdatesPanel({ updates }) {
	if (!updates?.length) {
		return <p className="text-xs text-muted-foreground italic">No updates posted yet.</p>;
	}
	return (
		<div className="space-y-2 max-h-64 overflow-y-auto pr-1">
			{[...updates].reverse().map((u, i) => (
				<div key={i} className="rounded-md border bg-muted/40 px-3 py-2">
					<div className="flex items-center justify-between mb-0.5">
						<span className="text-xs font-medium">{u.postedBy?.full_name || "Member"}</span>
						<span className="text-xs text-muted-foreground">
							{fmtDate(u.createdAt)} · {fmtTime(u.createdAt)}
						</span>
					</div>
					<p className="text-sm leading-relaxed">{u.note}</p>
				</div>
			))}
		</div>
	);
}

// ── Member detail dialog ──────────────────────────────────────────────────────
function MemberDetailDialog({ memberId, open, onClose }) {
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(false);
	const [expandedTask, setExpandedTask] = useState(null);

	useEffect(() => {
		if (!open || !memberId) return;
		setLoading(true);
		setExpandedTask(null);
		get_admin_progress_api({ memberId })
			.then(setData)
			.catch(() => toast.error("Failed to load member progress"))
			.finally(() => setLoading(false));
	}, [open, memberId]);

	const member = data?.member;
	const stats = data?.stats || {};
	const tasks = data?.tasks || [];

	return (
		<Dialog open={open} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{member?.full_name || "Member Progress"}</DialogTitle>
					<DialogDescription>
						{member?.job_title} · {member?.department}
						{member?.teamId && <> · Team: <strong>{member.teamId.name}</strong></>}
					</DialogDescription>
				</DialogHeader>

				{loading ? (
					<div className="space-y-3">
						{Array.from({ length: 3 }).map((_, i) => (
							<div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
						))}
					</div>
				) : (
					<div className="space-y-5">
						{/* Stats row */}
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
							{[
								{ icon: ListTodoIcon, label: "To Do", value: stats.todo || 0, color: "text-blue-500" },
								{ icon: ClockIcon, label: "In Progress", value: stats.inProgress || 0, color: "text-yellow-500" },
								{ icon: CheckCircle2Icon, label: "Done", value: stats.done || 0, color: "text-green-500" },
								{ icon: AlertTriangleIcon, label: "Overdue", value: stats.overdue || 0, color: "text-destructive" },
							].map(({ icon, label, value, color }) => (
								<div key={label} className="rounded-lg border p-3 text-center">
									<p className="text-xs text-muted-foreground">{label}</p>
									<p className={`text-2xl font-bold ${color}`}>{value}</p>
								</div>
							))}
						</div>

						{/* Completion bar */}
						{stats.total > 0 && (
							<div className="space-y-1">
								<div className="flex justify-between text-xs text-muted-foreground">
									<span>Overall completion</span>
									<span className="font-medium text-foreground">
										{Math.round((stats.done / stats.total) * 100)}%
									</span>
								</div>
								<ProgressBar value={Math.round((stats.done / stats.total) * 100)} />
							</div>
						)}

						{/* Task list */}
						<div>
							<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
								Tasks ({tasks.length})
							</p>
							<div className="space-y-2">
								{tasks.length === 0 ? (
									<p className="text-sm text-muted-foreground">No tasks assigned.</p>
								) : (
									tasks.map((task) => {
										const overdue = isOverdue(task);
										const expanded = expandedTask === task._id;
										return (
											<div key={task._id} className="rounded-lg border overflow-hidden">
												<button
													type="button"
													className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-accent text-left transition-colors"
													onClick={() => setExpandedTask(expanded ? null : task._id)}
												>
													<div className="flex items-center gap-2 min-w-0">
														{overdue && <AlertTriangleIcon className="h-3.5 w-3.5 text-destructive shrink-0" />}
														<span className="text-sm font-medium truncate">{task.title}</span>
														{task.projectId && (
															<span className="text-xs text-muted-foreground shrink-0">
																· {task.projectId.name}
															</span>
														)}
													</div>
													<div className="flex items-center gap-2 shrink-0">
														{task.updates?.length > 0 && (
															<span className="flex items-center gap-1 text-xs text-muted-foreground">
																<MessageSquareIcon className="h-3 w-3" />
																{task.updates.length}
															</span>
														)}
														<Badge variant={STATUS_BADGE[task.status]} className="text-xs">
															{STATUS_LABEL[task.status]}
														</Badge>
														<ChevronRightIcon className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`} />
													</div>
												</button>

												{expanded && (
													<div className="border-t px-4 py-3 bg-muted/20 space-y-3">
														{task.description && (
															<p className="text-sm text-muted-foreground">{task.description}</p>
														)}
														{task.dueDate && (
															<div className={`flex items-center gap-1.5 text-xs ${overdue ? "text-destructive" : "text-muted-foreground"}`}>
																<CalendarIcon className="h-3.5 w-3.5" />
																{overdue ? "Overdue · " : "Due: "}{fmtDate(task.dueDate)}
															</div>
														)}
														<div>
															<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
																Daily Updates
															</p>
															<UpdatesPanel updates={task.updates} />
														</div>
													</div>
												)}
											</div>
										);
									})
								)}
							</div>
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}

// ── Project detail view ───────────────────────────────────────────────────────
function ProjectDetailView({ projectId, onBack }) {
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [selectedMemberId, setSelectedMemberId] = useState(null);
	const [expandedTask, setExpandedTask] = useState(null);
	const [activeMember, setActiveMember] = useState(null); // for member dialog

	useEffect(() => {
		setLoading(true);
		get_admin_progress_api({ projectId })
			.then(setData)
			.catch(() => toast.error("Failed to load project progress"))
			.finally(() => setLoading(false));
	}, [projectId]);

	const project = data?.project;
	const projectStats = data?.projectStats || {};
	const memberProgress = data?.memberProgress || [];

	const selectedMemberData = selectedMemberId
		? memberProgress.find((m) => m.member._id === selectedMemberId)
		: null;

	return (
		<div className="space-y-5">
			{/* Back + header */}
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
					<ChevronLeftIcon className="h-4 w-4" /> All Projects
				</Button>
				<div className="h-4 w-px bg-border" />
				{loading ? (
					<div className="h-5 w-40 animate-pulse rounded bg-muted" />
				) : (
					<div>
						<h2 className="text-lg font-semibold leading-none">{project?.name}</h2>
						{project?.team && (
							<p className="text-xs text-muted-foreground mt-0.5">Team: {project.team.name}</p>
						)}
					</div>
				)}
			</div>

			{loading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
					))}
				</div>
			) : (
				<>
					{/* Project stats */}
					<div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
						{[
							{ label: "Total", value: projectStats.total || 0, color: "text-foreground" },
							{ label: "To Do", value: projectStats.todo || 0, color: "text-blue-500" },
							{ label: "In Progress", value: projectStats.inProgress || 0, color: "text-yellow-500" },
							{ label: "Done", value: projectStats.done || 0, color: "text-green-500" },
							{ label: "Overdue", value: projectStats.overdue || 0, color: "text-destructive" },
						].map(({ label, value, color }) => (
							<div key={label} className="rounded-lg border p-3 text-center">
								<p className="text-xs text-muted-foreground">{label}</p>
								<p className={`text-2xl font-bold ${color}`}>{value}</p>
							</div>
						))}
					</div>

					{/* Completion bar */}
					<div className="space-y-1.5">
						<div className="flex justify-between text-sm">
							<span className="text-muted-foreground">Project completion</span>
							<span className="font-semibold">{projectStats.completionRate || 0}%</span>
						</div>
						<ProgressBar value={projectStats.completionRate || 0} />
					</div>

					{/* Member list + task detail split */}
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
						{/* Member list */}
						<div className="space-y-2">
							<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
								Members ({memberProgress.length})
							</p>
							{memberProgress.length === 0 ? (
								<p className="text-sm text-muted-foreground">No tasks assigned yet.</p>
							) : (
								memberProgress.map(({ member, stats }) => {
									const rate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
									const active = selectedMemberId === member._id;
									return (
										<button
											key={member._id}
											type="button"
											onClick={() => setSelectedMemberId(active ? null : member._id)}
											className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent ${active ? "border-primary bg-accent" : ""}`}
										>
											<div className="flex items-center justify-between mb-2">
												<div className="min-w-0">
													<p className="text-sm font-medium truncate">{member.full_name}</p>
													<p className="text-xs text-muted-foreground truncate">{member.job_title}</p>
												</div>
												<div className="flex flex-col items-end gap-1 shrink-0 ml-2">
													<span className="text-xs font-semibold">{rate}%</span>
													{stats.overdue > 0 && (
														<span className="flex items-center gap-0.5 text-xs text-destructive">
															<AlertTriangleIcon className="h-3 w-3" />{stats.overdue}
														</span>
													)}
												</div>
											</div>
											<ProgressBar value={rate} />
											<div className="flex gap-3 mt-2">
												<StatPill icon={ListTodoIcon} label="Todo" value={stats.todo} color="text-blue-500" />
												<StatPill icon={ClockIcon} label="WIP" value={stats.inProgress} color="text-yellow-500" />
												<StatPill icon={CheckCircle2Icon} label="Done" value={stats.done} color="text-green-500" />
											</div>
										</button>
									);
								})
							)}
						</div>

						{/* Task detail for selected member */}
						<div className="lg:col-span-2">
							{!selectedMemberId ? (
								<div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground h-full flex items-center justify-center">
									Select a member to see their tasks and daily updates
								</div>
							) : (
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
											{selectedMemberData?.member.full_name}'s Tasks
										</p>
										<Button
											variant="outline"
											size="sm"
											className="h-7 text-xs"
											onClick={() => setActiveMember(selectedMemberId)}
										>
											Full Profile
										</Button>
									</div>
									{selectedMemberData?.tasks.map((task) => {
										const overdue = isOverdue(task);
										const expanded = expandedTask === task._id;
										return (
											<div key={task._id} className="rounded-lg border overflow-hidden">
												<button
													type="button"
													className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-accent text-left transition-colors"
													onClick={() => setExpandedTask(expanded ? null : task._id)}
												>
													<div className="flex items-center gap-2 min-w-0">
														{overdue && <AlertTriangleIcon className="h-3.5 w-3.5 text-destructive shrink-0" />}
														<span className="text-sm font-medium truncate">{task.title}</span>
													</div>
													<div className="flex items-center gap-2 shrink-0">
														{task.updates?.length > 0 && (
															<span className="flex items-center gap-1 text-xs text-muted-foreground">
																<MessageSquareIcon className="h-3 w-3" />
																{task.updates.length}
															</span>
														)}
														<Badge variant={STATUS_BADGE[task.status]} className="text-xs">
															{STATUS_LABEL[task.status]}
														</Badge>
														<ChevronRightIcon className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`} />
													</div>
												</button>
												{expanded && (
													<div className="border-t px-4 py-3 bg-muted/20 space-y-3">
														{task.description && (
															<p className="text-sm text-muted-foreground">{task.description}</p>
														)}
														{task.dueDate && (
															<div className={`flex items-center gap-1.5 text-xs ${overdue ? "text-destructive" : "text-muted-foreground"}`}>
																<CalendarIcon className="h-3.5 w-3.5" />
																{overdue ? "Overdue · " : "Due: "}{fmtDate(task.dueDate)}
															</div>
														)}
														<div>
															<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
																Daily Updates
															</p>
															<UpdatesPanel updates={task.updates} />
														</div>
													</div>
												)}
											</div>
										);
									})}
								</div>
							)}
						</div>
					</div>
				</>
			)}

			{/* Full member profile dialog */}
			<MemberDetailDialog
				memberId={activeMember}
				open={!!activeMember}
				onClose={() => setActiveMember(null)}
			/>
		</div>
	);
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ProgressPage() {
	const [projects, setProjects] = useState([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [activeProjectId, setActiveProjectId] = useState(null);
	const [memberDialogId, setMemberDialogId] = useState(null);

	useEffect(() => {
		get_admin_progress_api()
			.then((d) => setProjects(d.projects))
			.catch(() => toast.error("Failed to load projects"))
			.finally(() => setLoading(false));
	}, []);

	const filtered = projects.filter(
		(p) =>
			p.name.toLowerCase().includes(search.toLowerCase()) ||
			p.team?.name?.toLowerCase().includes(search.toLowerCase()),
	);

	if (activeProjectId) {
		return (
			<>
				<SiteHeader title="Progress Tracker" />
				<div className="flex flex-1 flex-col p-4 lg:p-6">
					<ProjectDetailView
						projectId={activeProjectId}
						onBack={() => setActiveProjectId(null)}
					/>
				</div>
			</>
		);
	}

	return (
		<>
			<SiteHeader title="Progress Tracker" />
			<div className="flex flex-1 flex-col gap-5 p-4 lg:p-6">

				{/* Search */}
				<div className="relative max-w-sm">
					<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search projects or teams..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="pl-9"
					/>
				</div>

				{/* Project cards grid */}
				{loading ? (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{Array.from({ length: 6 }).map((_, i) => (
							<div key={i} className="h-44 animate-pulse rounded-xl bg-muted" />
						))}
					</div>
				) : filtered.length === 0 ? (
					<div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
						No projects found
					</div>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{filtered.map((proj) => {
							const { stats } = proj;
							return (
								<Card
									key={proj._id}
									className="cursor-pointer hover:shadow-md transition-shadow hover:border-primary/40"
									onClick={() => setActiveProjectId(proj._id)}
								>
									<CardHeader className="pb-3">
										<div className="flex items-start justify-between gap-2">
											<div className="min-w-0">
												<CardTitle className="text-base truncate">{proj.name}</CardTitle>
												{proj.team && (
													<CardDescription className="mt-0.5">
														Team: {proj.team.name}
													</CardDescription>
												)}
											</div>
											<FolderKanbanIcon className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
										</div>
									</CardHeader>
									<CardContent className="space-y-3">
										{/* Completion */}
										<div className="space-y-1">
											<div className="flex justify-between text-xs">
												<span className="text-muted-foreground">Completion</span>
												<span className="font-semibold">{stats.completionRate}%</span>
											</div>
											<ProgressBar value={stats.completionRate} />
										</div>

										{/* Mini stats */}
										<div className="flex flex-wrap gap-x-4 gap-y-1">
											<StatPill icon={ListTodoIcon} label="Todo" value={stats.todo} color="text-blue-500" />
											<StatPill icon={ClockIcon} label="WIP" value={stats.inProgress} color="text-yellow-500" />
											<StatPill icon={CheckCircle2Icon} label="Done" value={stats.done} color="text-green-500" />
											{stats.overdue > 0 && (
												<StatPill icon={AlertTriangleIcon} label="Overdue" value={stats.overdue} color="text-destructive" />
											)}
										</div>

										<div className="flex items-center justify-between pt-1">
											<span className="text-xs text-muted-foreground">{stats.total} task{stats.total !== 1 ? "s" : ""} total</span>
											<Button variant="ghost" size="sm" className="h-7 text-xs gap-1 -mr-2">
												View Progress <ChevronRightIcon className="h-3.5 w-3.5" />
											</Button>
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>
				)}
			</div>

			<MemberDetailDialog
				memberId={memberDialogId}
				open={!!memberDialogId}
				onClose={() => setMemberDialogId(null)}
			/>
		</>
	);
}
