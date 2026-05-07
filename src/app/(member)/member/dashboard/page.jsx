"use client";
import { useEffect, useState } from "react";
import { get_member_dashboard_api } from "@/api/api";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	ChartLegend,
	ChartLegendContent,
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
	CheckCircle2Icon,
	ClockIcon,
	ListTodoIcon,
	AlertTriangleIcon,
	LayersIcon,
} from "lucide-react";
import Link from "next/link";
import StatCard from "@/components/app_component/member/dashboard/statsCard";

const chartConfig = {
	done: { label: "Done", color: "var(--chart-1)" },
	inProgress: { label: "In Progress", color: "var(--chart-2)" },
	todo: { label: "To Do", color: "var(--chart-3)" },
};

const STATUS_META = {
	todo: { label: "To Do", variant: "secondary", icon: ListTodoIcon },
	"in-progress": { label: "In Progress", variant: "default", icon: ClockIcon },
	done: { label: "Done", variant: "outline", icon: CheckCircle2Icon },
};

export default function MemberDashboardPage() {
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		get_member_dashboard_api()
			.then(setData)
			.catch(console.error)
			.finally(() => setLoading(false));
	}, []);

	const stats = data?.stats || {};
	const chartData = data?.taskProgress || [];
	const recentTasks = data?.recentTasks || [];
	const user = data?.user;

	const completionRate =
		stats.totalTasks > 0 ? Math.round((stats.doneTasks / stats.totalTasks) * 100) : 0;

	return (
		<>
			<SiteHeader title="Dashboard" />
			<div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">

				{/* Welcome banner */}
				<div className="rounded-xl border bg-gradient-to-r from-primary/10 to-card p-5">
					{loading ? (
						<div className="h-6 w-48 animate-pulse rounded bg-muted" />
					) : (
						<>
							<h2 className="text-xl font-semibold">
								Welcome back, {user?.full_name?.split(" ")[0]} 👋
							</h2>
							<p className="text-sm text-muted-foreground mt-1">
								{user?.job_title} · {user?.department}
								{user?.team && <> · Team: <span className="font-medium">{user.team.name}</span></>}
							</p>
						</>
					)}
				</div>

				{/* Stat cards */}
				<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
					{loading ? (
						Array.from({ length: 4 }).map((_, i) => (
							<Card key={i} className="animate-pulse">
								<CardHeader><div className="h-8 bg-muted rounded" /></CardHeader>
							</Card>
						))
					) : (
						<>
							<StatCard icon={LayersIcon} label="Total Tasks" value={stats.totalTasks || 0} color="text-muted-foreground" />
							<StatCard icon={ListTodoIcon} label="To Do" value={stats.todoTasks || 0} color="text-blue-500" />
							<StatCard icon={ClockIcon} label="In Progress" value={stats.inProgressTasks || 0} color="text-yellow-500" />
							<StatCard
								icon={CheckCircle2Icon}
								label="Completed"
								value={stats.doneTasks || 0}
								sub={`${completionRate}% completion rate`}
								color="text-green-500"
							/>
						</>
					)}
				</div>

				{/* Overdue alert */}
				{!loading && stats.overdueTasks > 0 && (
					<div className="flex items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3">
						<AlertTriangleIcon className="h-5 w-5 text-destructive shrink-0" />
						<p className="text-sm text-destructive font-medium">
							You have {stats.overdueTasks} overdue task{stats.overdueTasks !== 1 ? "s" : ""}.{" "}
							<Link href="/member/tasks?status=overdue" className="underline underline-offset-2">
								View now
							</Link>
						</p>
					</div>
				)}

				{/* Chart + recent tasks */}
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
					{/* Task progress chart */}
					<Card className="lg:col-span-2">
						<CardHeader>
							<CardTitle>Task Progress</CardTitle>
							<CardDescription>Your task activity over the last 6 months</CardDescription>
						</CardHeader>
						<CardContent className="px-2 sm:px-6">
							{loading ? (
								<div className="h-[240px] animate-pulse rounded bg-muted" />
							) : chartData.every((d) => d.todo === 0 && d.inProgress === 0 && d.done === 0) ? (
								<div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">
									No task data yet
								</div>
							) : (
								<ChartContainer config={chartConfig} className="h-[240px] w-full">
									<AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
										<defs>
											{["done", "inProgress", "todo"].map((key) => (
												<linearGradient key={key} id={`fill-${key}`} x1="0" y1="0" x2="0" y2="1">
													<stop offset="5%" stopColor={`var(--color-${key})`} stopOpacity={0.8} />
													<stop offset="95%" stopColor={`var(--color-${key})`} stopOpacity={0.1} />
												</linearGradient>
											))}
										</defs>
										<CartesianGrid vertical={false} strokeDasharray="3 3" />
										<XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 12 }} />
										<YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} allowDecimals={false} />
										<ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
										<ChartLegend content={<ChartLegendContent />} />
										{["done", "inProgress", "todo"].map((key) => (
											<Area key={key} dataKey={key} type="monotone" fill={`url(#fill-${key})`} stroke={`var(--color-${key})`} strokeWidth={2} />
										))}
									</AreaChart>
								</ChartContainer>
							)}
						</CardContent>
					</Card>

					{/* Recent tasks */}
					<Card>
						<CardHeader>
							<CardTitle>Recent Tasks</CardTitle>
							<CardDescription>Your latest assigned tasks</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							{loading ? (
								Array.from({ length: 4 }).map((_, i) => (
									<div key={i} className="h-12 animate-pulse rounded bg-muted" />
								))
							) : recentTasks.length === 0 ? (
								<p className="text-sm text-muted-foreground text-center py-4">No tasks yet</p>
							) : (
								recentTasks.map((task) => {
									const meta = STATUS_META[task.status] || STATUS_META.todo;
									const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";
									return (
										<Link key={task._id} href="/member/tasks" className="block">
											<div className="flex items-start justify-between gap-2 rounded-lg border p-3 hover:bg-accent transition-colors">
												<div className="min-w-0">
													<p className="text-sm font-medium truncate">{task.title}</p>
													<p className="text-xs text-muted-foreground truncate">{task.projectId?.name}</p>
												</div>
												<div className="flex flex-col items-end gap-1 shrink-0">
													<Badge variant={meta.variant} className="text-xs">{meta.label}</Badge>
													{isOverdue && <span className="text-xs text-destructive">Overdue</span>}
												</div>
											</div>
										</Link>
									);
								})
							)}
							{!loading && recentTasks.length > 0 && (
								<Link href="/member/tasks" className="block text-center text-xs text-primary hover:underline pt-1">
									View all tasks →
								</Link>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</>
	);
}
