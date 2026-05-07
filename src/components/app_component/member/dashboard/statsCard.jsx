import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function StatCard({ icon: Icon, label, value, sub, color }) {
    return (
		<Card>
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between">
					<CardDescription>{label}</CardDescription>
					<Icon className={`h-4 w-4 ${color}`} />
				</div>
				<CardTitle className="text-3xl font-bold tabular-nums">{value}</CardTitle>
			</CardHeader>
			{sub && (
				<CardContent>
					<p className="text-xs text-muted-foreground">{sub}</p>
				</CardContent>
			)}
		</Card>
	);
}