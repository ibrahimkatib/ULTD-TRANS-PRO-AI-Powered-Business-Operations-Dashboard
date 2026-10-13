import { PageHeader, Panel } from "@/components/Page";

export default function Page() {
  return (
    <>
      <PageHeader
        eyebrow="NEW WORKFLOW"
        title="Create Workflow"
        description="Build a reusable process from triggers, tasks, approvals and verification steps."
      />
      <Panel title="Workflow definition">
        <div className="form-grid">
          <div className="field">
            <label>Name</label>
            <input placeholder="Customer onboarding" />
          </div>
          <div className="field">
            <label>Trigger</label>
            <select>
              <option>Manual</option>
              <option>Event</option>
              <option>Webhook</option>
              <option>Schedule</option>
            </select>
          </div>
          <div className="field full">
            <label>Steps</label>
            <textarea
              defaultValue={`1. classify request\n2. run task\n3. require approval\n4. send email\n5. audit execution`}
            />
          </div>
        </div>
      </Panel>
    </>
  );
}