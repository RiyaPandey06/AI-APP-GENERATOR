export const sampleConfig = {
  slug: "lead-manager",
  name: "Lead Manager",
  locale: "en",
  resources: [
    {
      name: "leads",
      fields: [
        { name: "name", label: "Name", type: "text", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "stage", label: "Stage", type: "select", options: ["New", "Qualified", "Won"] },
        { name: "value", label: "Value", type: "number" }
      ]
    }
  ],
  components: [
    { id: "lead-form", type: "form", title: "Add lead", resource: "leads" },
    { id: "lead-dashboard", type: "dashboard", title: "Pipeline", resource: "leads" },
    { id: "lead-table", type: "table", title: "Leads", resource: "leads" },
    { id: "broken-demo", type: "kanban", title: "Unsupported demo", resource: "leads" }
  ],
  workflows: [
    {
      event: "record.created",
      resource: "leads",
      actions: [
        {
          type: "notification",
          title: "Lead captured",
          body: "A new lead was created from the dynamic runtime."
        }
      ]
    }
  ]
};
