"use client";
import { SiteHeader } from "@/components/site-header";
import { useState, useRef } from "react";
import { create_users_api } from "@/api/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	UserPlusIcon,
	FileJsonIcon,
	FileSpreadsheetIcon,
	CheckCircleIcon,
	XCircleIcon,
	UploadIcon,
	DownloadIcon,
	Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

// ── Helpers ──────────────────────────────────────────────────────────────────

function ResultsTable({ results }) {
	if (!results) return null;
	const { created = [], failed = [] } = results;

	return (
		<div className="space-y-4 mt-4">
			{created.length > 0 && (
				<div>
					<div className="flex items-center gap-2 mb-2">
						<CheckCircleIcon className="h-4 w-4 text-green-500" />
						<span className="text-sm font-medium text-green-600">{created.length} user{created.length !== 1 ? "s" : ""} created</span>
					</div>
					<div className="rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>Department</TableHead>
									<TableHead>Job Title</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{created.map((u) => (
									<TableRow key={u._id}>
										<TableCell className="font-medium">{u.full_name}</TableCell>
										<TableCell>{u.email}</TableCell>
										<TableCell>{u.department}</TableCell>
										<TableCell>{u.job_title}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</div>
			)}
			{failed.length > 0 && (
				<div>
					<div className="flex items-center gap-2 mb-2">
						<XCircleIcon className="h-4 w-4 text-destructive" />
						<span className="text-sm font-medium text-destructive">{failed.length} failed</span>
					</div>
					<div className="rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Email / Username</TableHead>
									<TableHead>Reason</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{failed.map((f, i) => (
									<TableRow key={i}>
										<TableCell className="font-medium">{f.entry?.email || f.entry?.username || "—"}</TableCell>
										<TableCell className="text-destructive text-sm">{f.error}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</div>
			)}
		</div>
	);
}

// ── Manual Form ──────────────────────────────────────────────────────────────

function ManualForm() {
	const empty = { username: "", name: "", email: "", password: "", company: "", job_title: "", department: "" };
	const [form, setForm] = useState(empty);
	const [submitting, setSubmitting] = useState(false);
	const [results, setResults] = useState(null);

	const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

	const handleSubmit = async (e) => {
		e.preventDefault();
		setSubmitting(true);
		setResults(null);
		try {
			const data = await create_users_api(form);
			setResults(data);
			if (data.created?.length > 0) {
				toast.success("User created successfully");
				setForm(empty);
			} else {
				toast.error(data.failed?.[0]?.error || "Failed to create user");
			}
		} catch (err) {
			toast.error(err.response?.data?.error || "Something went wrong");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div className="space-y-1.5">
					<Label>Full Name <span className="text-destructive">*</span></Label>
					<Input placeholder="John Doe" value={form.name} onChange={set("name")} required />
				</div>
				<div className="space-y-1.5">
					<Label>Username <span className="text-destructive">*</span></Label>
					<Input placeholder="johndoe" value={form.username} onChange={set("username")} required />
				</div>
				<div className="space-y-1.5">
					<Label>Email <span className="text-destructive">*</span></Label>
					<Input type="email" placeholder="john@company.com" value={form.email} onChange={set("email")} required />
				</div>
				<div className="space-y-1.5">
					<Label>Password <span className="text-destructive">*</span></Label>
					<Input type="password" placeholder="Min 6 chars, upper, lower, number, special" value={form.password} onChange={set("password")} required />
				</div>
				<div className="space-y-1.5">
					<Label>Company <span className="text-destructive">*</span></Label>
					<Input placeholder="Acme Inc." value={form.company} onChange={set("company")} required />
				</div>
				<div className="space-y-1.5">
					<Label>Job Title <span className="text-destructive">*</span></Label>
					<Input placeholder="Software Engineer" value={form.job_title} onChange={set("job_title")} required />
				</div>
				<div className="space-y-1.5 sm:col-span-2">
					<Label>Department <span className="text-destructive">*</span></Label>
					<Input placeholder="Engineering" value={form.department} onChange={set("department")} required />
				</div>
			</div>
			<Button type="submit" disabled={submitting} className="w-full sm:w-auto">
				<UserPlusIcon className="h-4 w-4 mr-2" />
				{submitting ? "Creating..." : "Create User"}
			</Button>
			<ResultsTable results={results} />
		</form>
	);
}

// ── JSON Upload ──────────────────────────────────────────────────────────────

const JSON_TEMPLATE = JSON.stringify(
	[
		{
			username: "johndoe",
			name: "John Doe",
			email: "john@company.com",
			password: "Pass@123",
			company: "Acme Inc.",
			job_title: "Engineer",
			department: "Engineering",
		},
	],
	null,
	2,
);

function JsonUpload() {
	const [jsonText, setJsonText] = useState("");
	const [parsed, setParsed] = useState(null);
	const [parseError, setParseError] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [results, setResults] = useState(null);
	const fileRef = useRef(null);

	const handleFileChange = (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (ev) => {
			const text = ev.target.result;
			setJsonText(text);
			tryParse(text);
		};
		reader.readAsText(file);
	};

	const tryParse = (text) => {
		try {
			const data = JSON.parse(text);
			const arr = Array.isArray(data) ? data : [data];
			setParsed(arr);
			setParseError("");
		} catch {
			setParsed(null);
			setParseError("Invalid JSON — check the format and try again.");
		}
	};

	const handleTextChange = (e) => {
		setJsonText(e.target.value);
		tryParse(e.target.value);
	};

	const handleSubmit = async () => {
		if (!parsed?.length) return;
		setSubmitting(true);
		setResults(null);
		try {
			const data = await create_users_api(parsed);
			setResults(data);
			if (data.created?.length > 0) toast.success(`${data.created.length} user(s) created`);
			if (data.failed?.length > 0) toast.error(`${data.failed.length} failed`);
		} catch (err) {
			toast.error(err.response?.data?.error || "Something went wrong");
		} finally {
			setSubmitting(false);
		}
	};

	const downloadTemplate = () => {
		const blob = new Blob([JSON_TEMPLATE], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "users_template.json";
		a.click();
		URL.revokeObjectURL(url);
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2">
				<Button variant="outline" size="sm" onClick={downloadTemplate}>
					<DownloadIcon className="h-4 w-4 mr-1" /> Download Template
				</Button>
				<Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
					<UploadIcon className="h-4 w-4 mr-1" /> Upload JSON File
				</Button>
				<input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFileChange} />
			</div>

			<div className="space-y-1.5">
				<Label>JSON Content</Label>
				<textarea
					className="w-full min-h-[200px] rounded-md border bg-background px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring"
					placeholder={JSON_TEMPLATE}
					value={jsonText}
					onChange={handleTextChange}
				/>
				{parseError && <p className="text-sm text-destructive">{parseError}</p>}
				{parsed && !parseError && (
					<p className="text-sm text-muted-foreground">{parsed.length} user{parsed.length !== 1 ? "s" : ""} ready to import</p>
				)}
			</div>

			<Button onClick={handleSubmit} disabled={!parsed || submitting}>
				<UserPlusIcon className="h-4 w-4 mr-2" />
				{submitting ? "Importing..." : `Import ${parsed?.length || 0} User${parsed?.length !== 1 ? "s" : ""}`}
			</Button>

			<ResultsTable results={results} />
		</div>
	);
}

// ── CSV Upload ───────────────────────────────────────────────────────────────

const CSV_TEMPLATE = `username,name,email,password,company,job_title,department
johndoe,John Doe,john@company.com,Pass@123,Acme Inc.,Engineer,Engineering
janedoe,Jane Doe,jane@company.com,Pass@123,Acme Inc.,Designer,Design`;

function parseCSV(text) {
	const lines = text.trim().split(/\r?\n/);
	if (lines.length < 2) return [];
	const headers = lines[0].split(",").map((h) => h.trim());
	return lines.slice(1).map((line) => {
		const values = line.split(",").map((v) => v.trim());
		return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
	});
}

function CsvUpload() {
	const [preview, setPreview] = useState([]);
	const [parseError, setParseError] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [results, setResults] = useState(null);
	const [fileName, setFileName] = useState("");
	const fileRef = useRef(null);

	const handleFileChange = (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setFileName(file.name);
		const reader = new FileReader();
		reader.onload = (ev) => {
			try {
				const rows = parseCSV(ev.target.result);
				if (rows.length === 0) {
					setParseError("No data rows found in the CSV.");
					setPreview([]);
				} else {
					setPreview(rows);
					setParseError("");
				}
			} catch {
				setParseError("Failed to parse CSV file.");
				setPreview([]);
			}
		};
		reader.readAsText(file);
	};

	const removeRow = (idx) => setPreview((p) => p.filter((_, i) => i !== idx));

	const handleSubmit = async () => {
		if (!preview.length) return;
		setSubmitting(true);
		setResults(null);
		try {
			const data = await create_users_api(preview);
			setResults(data);
			if (data.created?.length > 0) toast.success(`${data.created.length} user(s) created`);
			if (data.failed?.length > 0) toast.error(`${data.failed.length} failed`);
		} catch (err) {
			toast.error(err.response?.data?.error || "Something went wrong");
		} finally {
			setSubmitting(false);
		}
	};

	const downloadTemplate = () => {
		const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "users_template.csv";
		a.click();
		URL.revokeObjectURL(url);
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2">
				<Button variant="outline" size="sm" onClick={downloadTemplate}>
					<DownloadIcon className="h-4 w-4 mr-1" /> Download Template
				</Button>
				<Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
					<UploadIcon className="h-4 w-4 mr-1" /> Upload CSV File
				</Button>
				<input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />
				{fileName && <span className="text-sm text-muted-foreground">{fileName}</span>}
			</div>

			{parseError && <p className="text-sm text-destructive">{parseError}</p>}

			{preview.length > 0 && (
				<div className="space-y-2">
					<p className="text-sm text-muted-foreground">{preview.length} row{preview.length !== 1 ? "s" : ""} ready to import</p>
					<div className="rounded-md border max-h-64 overflow-y-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>Username</TableHead>
									<TableHead>Department</TableHead>
									<TableHead>Job Title</TableHead>
									<TableHead className="w-10" />
								</TableRow>
							</TableHeader>
							<TableBody>
								{preview.map((row, i) => (
									<TableRow key={i}>
										<TableCell>{row.name}</TableCell>
										<TableCell>{row.email}</TableCell>
										<TableCell>{row.username}</TableCell>
										<TableCell>{row.department}</TableCell>
										<TableCell>{row.job_title}</TableCell>
										<TableCell>
											<Button
												variant="ghost"
												size="icon"
												className="h-7 w-7 text-muted-foreground hover:text-destructive"
												onClick={() => removeRow(i)}
											>
												<Trash2Icon className="h-3.5 w-3.5" />
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</div>
			)}

			{preview.length > 0 && (
				<Button onClick={handleSubmit} disabled={submitting}>
					<UserPlusIcon className="h-4 w-4 mr-2" />
					{submitting ? "Importing..." : `Import ${preview.length} User${preview.length !== 1 ? "s" : ""}`}
				</Button>
			)}

			<ResultsTable results={results} />
		</div>
	);
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CreateUserPage() {
	return (
		<>
			<SiteHeader title="Create Users" />
			<div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
				<div className="max-w-3xl w-full">
					<Tabs defaultValue="manual">
						<TabsList className="mb-4">
							<TabsTrigger value="manual">
								<UserPlusIcon className="h-4 w-4 mr-1.5" /> Manual
							</TabsTrigger>
							<TabsTrigger value="json">
								<FileJsonIcon className="h-4 w-4 mr-1.5" /> JSON
							</TabsTrigger>
							<TabsTrigger value="csv">
								<FileSpreadsheetIcon className="h-4 w-4 mr-1.5" /> CSV
							</TabsTrigger>
						</TabsList>

						<TabsContent value="manual">
							<Card>
								<CardHeader>
									<CardTitle>Create a single user</CardTitle>
									<CardDescription>Fill in the form to manually create a new member account.</CardDescription>
								</CardHeader>
								<CardContent>
									<ManualForm />
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent value="json">
							<Card>
								<CardHeader>
									<CardTitle>Import from JSON</CardTitle>
									<CardDescription>
										Upload a JSON file or paste JSON directly. Download the template to see the expected format.
									</CardDescription>
								</CardHeader>
								<CardContent>
									<JsonUpload />
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent value="csv">
							<Card>
								<CardHeader>
									<CardTitle>Import from CSV</CardTitle>
									<CardDescription>
										Upload a CSV file with user data. Download the template to see the required columns.
									</CardDescription>
								</CardHeader>
								<CardContent>
									<CsvUpload />
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</>
	);
}
