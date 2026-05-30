"use client";

import { AlertCircle, CheckCircle2, Code2, LogIn, Save } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RuntimeRenderer } from "@/components/runtime-renderer";
import { Button, FieldLabel, Panel, TextInput } from "@/components/ui";
import { sampleConfig } from "@/runtime/default-config";
import { tryParseRuntimeConfig } from "@/runtime/config-parser";
import { RuntimeRecord } from "@/types/runtime";
import { t } from "@/lib/i18n";

type ApiResult<T> = { success: true; data: T } | { success: false; message: string; details?: unknown };
type User = { id: string; email: string };
type Notification = { id: string; title: string; body: string; read?: boolean };

async function api<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {})
    }
  });
  return response.json() as Promise<ApiResult<T>>;
}

export function AppShell() {
  const [rawConfig, setRawConfig] = useState(JSON.stringify(sampleConfig, null, 2));
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("demo@dynamicai.dev");
  const [password, setPassword] = useState("password123");
  const [records, setRecords] = useState<RuntimeRecord[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [status, setStatus] = useState("");
  const parsed = useMemo(() => tryParseRuntimeConfig(rawConfig), [rawConfig]);
  const config = parsed.config;

  const refreshRuntime = useCallback(async (activeConfig = config) => {
    if (!user || !activeConfig) return;
    const allRecords: RuntimeRecord[] = [];
    for (const resource of activeConfig.resources) {
      const result = await api<RuntimeRecord[]>(`/api/runtime/${activeConfig.slug}/${resource.name}`);
      if (result.success) allRecords.push(...result.data);
    }
    setRecords(allRecords);
    const notificationResult = await api<Notification[]>("/api/notifications");
    if (notificationResult.success) setNotifications(notificationResult.data);
  }, [config, user]);

  useEffect(() => {
    api<User>("/api/auth/me").then((result) => {
      if (result.success) setUser(result.data);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    refreshRuntime();
  }, [refreshRuntime]);

  async function authenticate(mode: "login" | "register") {
    const result = await api<User>(`/api/auth/${mode}`, {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    if (result.success) {
      setUser(result.data);
      setStatus(`${mode === "login" ? "Logged in" : "Registered"} as ${result.data.email}.`);
    } else {
      setStatus(result.message);
    }
  }

  async function saveConfig() {
    if (!config) {
      setStatus(parsed.error || "Invalid configuration.");
      return;
    }
    if (!user) {
      setStatus("Login or register before saving runtime configuration.");
      return;
    }
    const result = await api<{ app: unknown; warnings: string[] }>("/api/apps", {
      method: "POST",
      body: JSON.stringify({ config })
    });
    setStatus(result.success ? `Saved ${config.name}. ${result.data.warnings.length} warning(s).` : result.message);
    await refreshRuntime(config);
  }

  async function createRecord(resource: string, data: Record<string, unknown>) {
    if (!config || !user) {
      setStatus("Login and save the config before creating records.");
      return;
    }
    const result = await api<RuntimeRecord>(`/api/runtime/${config.slug}/${resource}`, {
      method: "POST",
      body: JSON.stringify(data)
    });
    setStatus(result.success ? "Record created and workflows processed." : result.message);
    await refreshRuntime(config);
  }

  async function deleteRecord(resource: string, id: string) {
    if (!config || !user) return;
    const result = await api(`/api/runtime/${config.slug}/${resource}/${id}`, { method: "DELETE" });
    setStatus(result.success ? "Record deleted." : result.message);
    await refreshRuntime(config);
  }

  async function importCsv(resource: string, rows: Record<string, unknown>[]) {
    if (!config || !user) {
      setStatus("Login and save the config before importing CSV data.");
      return;
    }
    const result = await api<{ imported: number; rejected: number }>(`/api/runtime/${config.slug}/${resource}/import`, {
      method: "POST",
      body: JSON.stringify({ rows })
    });
    setStatus(result.success ? `Imported ${result.data.imported} row(s), rejected ${result.data.rejected}.` : result.message);
    await refreshRuntime(config);
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-[#dce4de] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-md bg-mint px-3 py-1 text-sm font-semibold text-leaf">
              <Code2 className="h-4 w-4" />
              Full Stack Engineer - Track A
            </div>
            <h1 className="text-3xl font-bold">DynamicAI Builder</h1>
            <p className="mt-1 max-w-2xl text-sm text-[#65756f]">
              A metadata-driven application runtime that converts JSON into UI, APIs, scoped records, and workflows.
            </p>
          </div>
          <Panel className="w-full max-w-xl">
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto]">
              <div>
                <FieldLabel>Email</FieldLabel>
                <TextInput value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>
              <div>
                <FieldLabel>Password</FieldLabel>
                <TextInput type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
              </div>
              <Button className="self-end" variant="ghost" onClick={() => authenticate("register")}>
                <LogIn className="h-4 w-4" />
                Register
              </Button>
              <Button className="self-end" onClick={() => authenticate("login")}>Login</Button>
            </div>
            {user && <p className="mt-2 text-sm text-leaf">Authenticated: {user.email}</p>}
          </Panel>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 lg:grid-cols-[420px_1fr]">
        <section className="grid content-start gap-4">
          <Panel>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-semibold">{config ? t(config.locale, "config") : "Configuration"}</h2>
              <Button onClick={saveConfig}>
                <Save className="h-4 w-4" />
                Save
              </Button>
            </div>
            <textarea
              className="h-[540px] w-full resize-y rounded-md border border-[#cbd8d0] bg-[#101817] p-3 font-mono text-xs leading-5 text-[#e8f3ed] outline-none focus:border-leaf"
              value={rawConfig}
              spellCheck={false}
              onChange={(event) => setRawConfig(event.target.value)}
            />
          </Panel>
          <Panel>
            <div className="mb-2 flex items-center gap-2">
              {parsed.error ? <AlertCircle className="h-5 w-5 text-coral" /> : <CheckCircle2 className="h-5 w-5 text-leaf" />}
              <h2 className="font-semibold">{config ? t(config.locale, "warnings") : "Runtime status"}</h2>
            </div>
            {parsed.error ? (
              <p className="text-sm text-coral">{parsed.error}</p>
            ) : (
              <div className="grid gap-1 text-sm text-[#65756f]">
                {config?.warnings.map((warning) => <p key={warning}>{warning}</p>)}
                {!config?.warnings.length && <p>No warnings. This config is clean.</p>}
              </div>
            )}
            {status && <p className="mt-3 rounded-md bg-mint p-2 text-sm font-medium text-leaf">{status}</p>}
          </Panel>
        </section>

        <section className="grid content-start gap-4">
          <div>
            <h2 className="text-xl font-semibold">{config ? t(config.locale, "preview") : "Generated app"}</h2>
            <p className="text-sm text-[#65756f]">{config?.name || "Fix JSON to preview the runtime."}</p>
          </div>
          {config ? (
            <RuntimeRenderer
              config={config}
              records={records}
              notifications={notifications}
              onCreate={createRecord}
              onDelete={deleteRecord}
              onCsvImport={importCsv}
            />
          ) : (
            <Panel className="border-coral bg-[#fff8f6]">
              <p className="text-sm text-coral">{parsed.error}</p>
            </Panel>
          )}
        </section>
      </div>
    </main>
  );
}
