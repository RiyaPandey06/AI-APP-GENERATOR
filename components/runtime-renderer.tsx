"use client";

import { AlertTriangle, Bell, Database, FileUp, Plus, Trash2 } from "lucide-react";
import Papa from "papaparse";
import { useMemo, useState } from "react";
import { RuntimeComponent, RuntimeConfig, RuntimeField, RuntimeRecord } from "@/types/runtime";
import { Button, FieldLabel, Panel, SelectInput, TextInput } from "@/components/ui";
import { t } from "@/lib/i18n";

type Props = {
  config: RuntimeConfig;
  records: RuntimeRecord[];
  onCreate: (resource: string, data: Record<string, unknown>) => Promise<void>;
  onDelete: (resource: string, id: string) => Promise<void>;
  onCsvImport: (resource: string, rows: Record<string, unknown>[]) => Promise<void>;
  notifications: Array<{ id: string; title: string; body: string; read?: boolean }>;
};

function defaultValue(field: RuntimeField) {
  if (field.type === "checkbox") return false;
  if (field.type === "number") return 0;
  return "";
}

function RuntimeForm({ component, onCreate }: { component: RuntimeComponent; onCreate: Props["onCreate"] }) {
  const initial = useMemo(() => Object.fromEntries(component.fields.map((field) => [field.name, defaultValue(field)])), [component.fields]);
  const [form, setForm] = useState<Record<string, unknown>>(initial);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const missing = component.fields.find((field) => field.required && !form[field.name]);
    if (missing) {
      setError(`${missing.label} is required.`);
      return;
    }
    setError("");
    await onCreate(component.resource, form);
    setForm(initial);
  }

  return (
    <Panel>
      <div className="mb-4 flex items-center gap-2">
        <Plus className="h-5 w-5 text-leaf" />
        <h2 className="text-lg font-semibold">{component.title}</h2>
      </div>
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={submit}>
        {component.fields.map((field) => (
          <div className="grid gap-1" key={field.name}>
            <FieldLabel>{field.label}</FieldLabel>
            {field.type === "select" ? (
              <SelectInput value={String(form[field.name] ?? "")} onChange={(event) => setForm({ ...form, [field.name]: event.target.value })}>
                <option value="">Select</option>
                {field.options.map((option) => <option key={option}>{option}</option>)}
              </SelectInput>
            ) : field.type === "checkbox" ? (
              <input
                className="h-5 w-5 accent-leaf"
                checked={Boolean(form[field.name])}
                type="checkbox"
                onChange={(event) => setForm({ ...form, [field.name]: event.target.checked })}
              />
            ) : (
              <TextInput
                type={field.type}
                value={String(form[field.name] ?? "")}
                onChange={(event) => setForm({ ...form, [field.name]: field.type === "number" ? Number(event.target.value) : event.target.value })}
              />
            )}
          </div>
        ))}
        <div className="flex items-end gap-3 sm:col-span-2">
          <Button type="submit">Create record</Button>
          {error && <p className="text-sm font-medium text-coral">{error}</p>}
        </div>
      </form>
    </Panel>
  );
}

function RuntimeTable({ component, records, onDelete }: { component: RuntimeComponent; records: RuntimeRecord[]; onDelete: Props["onDelete"] }) {
  const rows = records.filter((record) => record.resource === component.resource);
  return (
    <Panel className="overflow-hidden">
      <div className="mb-4 flex items-center gap-2">
        <Database className="h-5 w-5 text-leaf" />
        <h2 className="text-lg font-semibold">{component.title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#dce4de]">
              {component.fields.map((field) => <th className="py-2 pr-3 font-semibold" key={field.name}>{field.label}</th>)}
              <th className="w-12 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((record) => (
              <tr className="border-b border-[#edf1ee]" key={record.id}>
                {component.fields.map((field) => <td className="py-2 pr-3" key={field.name}>{String(record.data[field.name] ?? "-")}</td>)}
                <td className="py-2">
                  <button aria-label="Delete record" className="rounded p-2 text-coral hover:bg-[#fff0ed]" onClick={() => onDelete(component.resource, record.id)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && <p className="mt-3 text-sm text-[#65756f]">No records yet.</p>}
    </Panel>
  );
}

function RuntimeDashboard({ component, records }: { component: RuntimeComponent; records: RuntimeRecord[] }) {
  const rows = records.filter((record) => record.resource === component.resource);
  const numericFields = component.fields.filter((field) => field.type === "number");
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Panel>
        <p className="text-sm text-[#65756f]">Records</p>
        <strong className="text-3xl">{rows.length}</strong>
      </Panel>
      {numericFields.slice(0, 2).map((field) => (
        <Panel key={field.name}>
          <p className="text-sm text-[#65756f]">{field.label}</p>
          <strong className="text-3xl">
            {rows.reduce((sum, row) => sum + Number(row.data[field.name] || 0), 0)}
          </strong>
        </Panel>
      ))}
    </div>
  );
}

function CsvImport({ config, onCsvImport }: { config: RuntimeConfig; onCsvImport: Props["onCsvImport"] }) {
  const [resource, setResource] = useState(config.resources[0]?.name || "records");
  return (
    <Panel>
      <div className="mb-3 flex items-center gap-2">
        <FileUp className="h-5 w-5 text-leaf" />
        <h2 className="font-semibold">{t(config.locale, "importCsv")}</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
        <SelectInput value={resource} onChange={(event) => setResource(event.target.value)}>
          {config.resources.map((item) => <option key={item.name}>{item.name}</option>)}
        </SelectInput>
        <input
          className="text-sm"
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            Papa.parse<Record<string, unknown>>(file, {
              header: true,
              skipEmptyLines: true,
              complete: (result) => onCsvImport(resource, result.data)
            });
          }}
        />
      </div>
    </Panel>
  );
}

export function RuntimeRenderer(props: Props) {
  const { config, records, onCreate, onDelete, onCsvImport, notifications } = props;
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-4">
          {config.components.map((component) => {
            if (component.type === "form") return <RuntimeForm component={component} key={component.id} onCreate={onCreate} />;
            if (component.type === "table") return <RuntimeTable component={component} key={component.id} records={records} onDelete={onDelete} />;
            if (component.type === "dashboard") return <RuntimeDashboard component={component} key={component.id} records={records} />;
            if (component.type === "unsupported") {
              return (
                <Panel className="border-coral bg-[#fff8f6]" key={component.id}>
                  <div className="flex items-center gap-2 text-coral">
                    <AlertTriangle className="h-5 w-5" />
                    <strong>Unsupported component: {component.rawType}</strong>
                  </div>
                </Panel>
              );
            }
            return <Panel key={component.id}><h2 className="font-semibold">{component.title}</h2></Panel>;
          })}
        </div>
        <aside className="grid content-start gap-4">
          <CsvImport config={config} onCsvImport={onCsvImport} />
          <Panel>
            <div className="mb-3 flex items-center gap-2">
              <Bell className="h-5 w-5 text-leaf" />
              <h2 className="font-semibold">{t(config.locale, "notifications")}</h2>
            </div>
            <div className="grid gap-2">
              {notifications.map((item) => (
                <div className="rounded-md border border-[#dce4de] p-3" key={item.id}>
                  <strong className="block text-sm">{item.title}</strong>
                  <p className="text-sm text-[#65756f]">{item.body}</p>
                </div>
              ))}
              {!notifications.length && <p className="text-sm text-[#65756f]">No notifications yet.</p>}
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
