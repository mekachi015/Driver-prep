const api = async (url, data) => {
  const opts = data
    ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }
    : undefined;
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error(await r.text());
  return data ? undefined : r.json();
};

export const getTickets  = async () => { try { return await api('/api/tickets');        } catch { return {}; } };
export const saveTickets = async (t)  => { await api('/api/tickets', t); };
export const getResults  = async () => { try { return await api('/api/results');        } catch { return []; } };
export const saveResults = async (r)  => { await api('/api/results', r); };
