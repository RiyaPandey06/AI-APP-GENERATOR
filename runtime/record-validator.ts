import { RuntimeConfig } from "@/types/runtime";

export function validateRecord(config: RuntimeConfig, resource: string, input: Record<string, unknown>) {
  const schema = config.resources.find((item) => item.name === resource);
  if (!schema) return { ok: false, errors: [`Unknown resource ${resource}.`] };
  const errors: string[] = [];
  const data: Record<string, unknown> = {};

  for (const field of schema.fields) {
    const value = input[field.name];
    if (field.required && (value === undefined || value === null || value === "")) {
      errors.push(`${field.label} is required.`);
      continue;
    }
    if (value === undefined || value === null || value === "") continue;
    if (field.type === "number") {
      const number = Number(value);
      if (Number.isNaN(number)) errors.push(`${field.label} must be a number.`);
      else data[field.name] = number;
    } else if (field.type === "checkbox") {
      data[field.name] = Boolean(value);
    } else if (field.type === "select") {
      const text = String(value);
      if (field.options.length && !field.options.includes(text)) errors.push(`${field.label} has an invalid option.`);
      else data[field.name] = text;
    } else {
      data[field.name] = String(value);
    }
  }

  return { ok: errors.length === 0, errors, data };
}
