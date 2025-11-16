import { FormEvent, useState } from 'react';
import { CodeBlock } from './components/CodeBlock';

const DEFAULT_FORM = {
  serviceName: 'payment-service',
  otelEndpoint: 'http://panopticon-agent:4318',
  collectTraces: true,
  collectLogs: true,
};

type InstallResponse = {
  tracingJs: string;
  envFile: string;
  dockerCompose: string;
};

const backendBaseUrl =
  import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3000';

export default function App() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InstallResponse | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${backendBaseUrl}/api/install/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error('Failed to generate installation guide');
      }

      const data = (await response.json()) as InstallResponse;
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unexpected error occurred',
      );
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="app-container">
      <h1>Panopticon Installer Playground</h1>
      <p style={{ color: '#b3b7d6' }}>
        Local-only UI for generating Docker + Node.js collector templates.
      </p>

      <form className="card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            Service Name
            <input
              type="text"
              value={form.serviceName}
              onChange={(e) => updateField('serviceName', e.target.value)}
              placeholder="payment-service"
              required
            />
          </label>

          <label>
            OTEL Endpoint
            <input
              type="text"
              value={form.otelEndpoint}
              onChange={(e) => updateField('otelEndpoint', e.target.value)}
              placeholder="http://panopticon-agent:4318"
            />
          </label>
        </div>

        <div className="form-grid" style={{ marginTop: 20 }}>
          <div className="checkbox-group">
            <input
              type="checkbox"
              checked={form.collectTraces}
              onChange={(e) => updateField('collectTraces', e.target.checked)}
              id="collectTraces"
            />
            <label htmlFor="collectTraces">Collect Traces</label>
          </div>

          <div className="checkbox-group">
            <input
              type="checkbox"
              checked={form.collectLogs}
              onChange={(e) => updateField('collectLogs', e.target.checked)}
              id="collectLogs"
            />
            <label htmlFor="collectLogs">Collect Logs</label>
          </div>
        </div>

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? 'Generating...' : 'Generate Installation Guide'}
        </button>

        {error && <div className="error">{error}</div>}
      </form>

      {result && (
        <div className="card">
          <h2>Installation Files</h2>
          <div className="result-grid">
            <CodeBlock title="tracing.js" content={result.tracingJs} />
            <CodeBlock title=".env" content={result.envFile} />
            <CodeBlock
              title="docker-compose snippet"
              content={result.dockerCompose}
            />
          </div>
        </div>
      )}
    </div>
  );
}
