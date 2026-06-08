import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => c.text('osystem-masters'));

app.get('/api/health', (c) => c.json({ ok: true }));

export default app;
