export type FieldType = "text" | "email" | "number" | "date" | "checkbox" | "select";
export type ComponentType = "form" | "table" | "dashboard" | "card" | "button" | "modal";

export type RuntimeField = {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  options: string[];
};

export type RuntimeComponent = {
  id: string;
  type: ComponentType | "unsupported";
  title: string;
  resource: string;
  fields: RuntimeField[];
  action?: string;
  rawType?: string;
};

export type RuntimeWorkflow = {
  event: "record.created" | "record.updated";
  resource: string;
  actions: Array<{
    type: "notification" | "createRecord";
    title?: string;
    body?: string;
    resource?: string;
    data?: Record<string, unknown>;
  }>;
};

export type RuntimeConfig = {
  slug: string;
  name: string;
  locale: "en" | "hi";
  components: RuntimeComponent[];
  workflows: RuntimeWorkflow[];
  resources: Array<{
    name: string;
    fields: RuntimeField[];
  }>;
  warnings: string[];
};

export type RuntimeRecord = {
  id: string;
  resource: string;
  data: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};
