import { RuntimeComponent, RuntimeConfig, RuntimeField, RuntimeWorkflow } from "@/types/runtime";

const fieldTypes = new Set(["text", "email", "number", "date", "checkbox", "select"]);
const componentTypes = new Set(["form", "table", "dashboard", "card", "button", "modal"]);

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function slugify(value: unknown) {
  const base = String(value || "generated-app").toLowerCase();
  return base.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "generated-app";
}

function parseField(value: unknown, index: number, warnings: string[]): RuntimeField {
  const item = asObject(value);
  const rawName = typeof item.name === "string" && item.name.trim() ? item.name.trim() : `field_${index + 1}`;
  if (!item.name) warnings.push(`Field ${index + 1} was missing a name and received ${rawName}.`);

  const rawType = typeof item.type === "string" ? item.type : "text";
  const type = fieldTypes.has(rawType) ? rawType as RuntimeField["type"] : "text";
  if (rawType !== type) warnings.push(`${rawName} used unsupported field type ${rawType}; text was used.`);

  return {
    name: rawName,
    label: typeof item.label === "string" ? item.label : rawName.replace(/_/g, " "),
    type,
    required: Boolean(item.required),
    options: Array.isArray(item.options) ? item.options.map(String) : []
  };
}

function parseResource(value: unknown, index: number, warnings: string[]) {
  const item = asObject(value);
  const name = slugify(item.name || item.resource || `resource-${index + 1}`);
  const fields = Array.isArray(item.fields) ? item.fields.map((field, fieldIndex) => parseField(field, fieldIndex, warnings)) : [];
  if (!fields.length) warnings.push(`${name} has no fields; records will still be accepted as JSON.`);
  return { name, fields };
}

function parseComponent(value: unknown, index: number, resources: RuntimeConfig["resources"], warnings: string[]): RuntimeComponent {
  const item = asObject(value);
  const rawType = typeof item.type === "string" ? item.type : "card";
  const resource = slugify(item.resource || resources[0]?.name || "records");
  const resourceFields = resources.find((candidate) => candidate.name === resource)?.fields || resources[0]?.fields || [];

  if (!componentTypes.has(rawType)) {
    warnings.push(`Component ${item.id || index + 1} used unsupported type ${rawType}.`);
    return {
      id: String(item.id || `component-${index + 1}`),
      type: "unsupported",
      rawType,
      title: String(item.title || "Unsupported component"),
      resource,
      fields: resourceFields
    };
  }

  return {
    id: String(item.id || `component-${index + 1}`),
    type: rawType as RuntimeComponent["type"],
    title: String(item.title || rawType),
    resource,
    fields: Array.isArray(item.fields) ? item.fields.map((field, fieldIndex) => parseField(field, fieldIndex, warnings)) : resourceFields,
    action: typeof item.action === "string" ? item.action : undefined
  };
}

function parseWorkflow(value: unknown, warnings: string[]): RuntimeWorkflow | null {
  const item = asObject(value);
  const event = item.event === "record.updated" ? "record.updated" : "record.created";
  const resource = slugify(item.resource || "records");
  const rawActions = Array.isArray(item.actions) ? item.actions : [];
  const actions = rawActions.map((action) => asObject(action)).map((action) => ({
    type: action.type === "createRecord" ? "createRecord" as const : "notification" as const,
    title: typeof action.title === "string" ? action.title : undefined,
    body: typeof action.body === "string" ? action.body : undefined,
    resource: typeof action.resource === "string" ? slugify(action.resource) : undefined,
    data: asObject(action.data)
  }));
  if (!actions.length) {
    warnings.push(`Workflow for ${resource} had no actions and was ignored.`);
    return null;
  }
  return { event, resource, actions };
}

export function parseRuntimeConfig(input: unknown): RuntimeConfig {
  const warnings: string[] = [];
  const root = typeof input === "string" ? JSON.parse(input) : input;
  const config = asObject(root);
  const resources = Array.isArray(config.resources)
    ? config.resources.map((resource, index) => parseResource(resource, index, warnings))
    : [{ name: "records", fields: [] }];

  if (!Array.isArray(config.resources)) warnings.push("No resources array found; default records resource was created.");

  const components = Array.isArray(config.components)
    ? config.components.map((component, index) => parseComponent(component, index, resources, warnings))
    : [{ id: "empty", type: "card" as const, title: "No components configured", resource: resources[0].name, fields: resources[0].fields }];

  const workflows = Array.isArray(config.workflows)
    ? config.workflows.map((workflow) => parseWorkflow(workflow, warnings)).filter(Boolean) as RuntimeWorkflow[]
    : [];

  return {
    slug: slugify(config.slug || config.name),
    name: String(config.name || "Generated App"),
    locale: config.locale === "hi" ? "hi" : "en",
    components,
    resources,
    workflows,
    warnings
  };
}

export function tryParseRuntimeConfig(raw: string) {
  try {
    return { config: parseRuntimeConfig(raw), error: null };
  } catch {
    return { config: null, error: "Malformed JSON. The runtime stayed online and rejected the configuration safely." };
  }
}
