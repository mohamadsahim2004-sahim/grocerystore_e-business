// Diagnoses MongoDB Atlas connectivity step by step. Read-only: it changes no settings and prints no password.
// Usage:  npm run db:check            (DNS + TCP + real connection test)
//         npm run db:check -- --dns-only
require('dotenv').config();
const dns = require('dns').promises;
const net = require('net');
const { getMongoUri, getMongoConnectOptions, parseMongoUri, formatDbFailure, redactMongoUri } = require('../utils/dbDiagnostics');

const dnsOnly = process.argv.includes('--dns-only');
const ok = (m) => console.log(`  [ OK ] ${m}`);
const bad = (m) => console.log(`  [FAIL] ${m}`);
const info = (m) => console.log(`  [ .. ] ${m}`);
const errText = (e) => `${e.code || e.name}${e.syscall ? ' (' + e.syscall + ')' : ''}: ${redactMongoUri(e.message)}`;

function tcpCheck(host, port, ms = 6000) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const done = (result) => { socket.destroy(); resolve(result); };
    socket.setTimeout(ms, () => done({ ok: false, reason: `timed out after ${ms / 1000}s` }));
    socket.once('connect', () => done({ ok: true }));
    socket.once('error', (e) => done({ ok: false, reason: e.code || e.message }));
  });
}

async function main() {
  console.log('\n1) Configuration');
  let uri;
  try { uri = getMongoUri(); } catch (e) { bad(e.message); process.exit(1); }
  const parsed = parseMongoUri(uri);
  if (!parsed.valid) { parsed.problems.forEach(bad); process.exit(1); }
  ok(`scheme=${parsed.scheme} host=${parsed.host} user=${parsed.user || '(none)'} password=${parsed.hasPassword ? 'present (hidden)' : 'MISSING'} database=${parsed.dbName || '(none -> "test")'}`);
  parsed.problems.forEach((p) => info(`Note: ${p}`));
  info(`Node's DNS servers: ${dns.getServers().join(', ') || '(none)'}`);

  let targets = parsed.hosts.map((h) => { const [host, port] = h.split(':'); return { host, port: Number(port) || 27017 }; });

  if (parsed.scheme === 'mongodb+srv') {
    console.log('\n2) DNS (SRV + TXT lookups - the step that fails with querySrv errors)');
    const srvName = `_mongodb._tcp.${parsed.host}`;
    let srv;
    try {
      srv = await dns.resolveSrv(srvName);
      ok(`SRV ${srvName} -> ${srv.length} server(s): ${srv.map((r) => `${r.name}:${r.port}`).join(', ')}`);
      targets = srv.map((r) => ({ host: r.name, port: r.port }));
    } catch (e) {
      bad(`SRV ${srvName}: ${errText(e)}`);
      info('Retrying through public resolvers for comparison only (nothing is changed on your machine):');
      let publicWorks = false;
      for (const server of ['8.8.8.8', '1.1.1.1']) {
        const r = new dns.Resolver({ timeout: 4000, tries: 1 });
        r.setServers([server]);
        try {
          const res = await r.resolveSrv(srvName);
          ok(`via ${server}: SRV works (${res.length} server(s))`);
          publicWorks = true;
        } catch (e2) { bad(`via ${server}: ${errText(e2)}`); }
      }
      if (publicWorks) console.log('\n  => DIAGNOSIS: the hostname is valid, but YOUR default DNS resolver mishandles SRV lookups.\n     Fix: set Windows DNS to 8.8.8.8 / 1.1.1.1 (then ipconfig /flushdns), or use the non-SRV connection string from Atlas.');
      else if (['ENOTFOUND', 'ENODATA'].includes(e.code)) console.log('\n  => DIAGNOSIS: DNS answered but has no records for that name - check the hostname against Atlas.');
      else console.log('\n  => DIAGNOSIS: no resolver could answer. Check internet access, VPN/firewall/antivirus DNS filtering, and the hostname.');
      process.exit(1);
    }
    try { const txt = await dns.resolveTxt(parsed.host); ok(`TXT ${parsed.host} -> ${txt.map((t) => t.join('')).join(' ')}`); }
    catch (e) { bad(`TXT ${parsed.host}: ${errText(e)}`); }
  }

  console.log('\n3) TCP reachability (port 27017 must not be blocked)');
  let reachable = 0;
  for (const t of targets) {
    const r = await tcpCheck(t.host, t.port);
    if (r.ok) { reachable += 1; ok(`${t.host}:${t.port}`); } else bad(`${t.host}:${t.port} - ${r.reason}`);
  }
  if (!reachable) { console.log('\n  => DIAGNOSIS: DNS works but no server is reachable. Check Atlas Network Access (your IP), cluster paused, firewall/VPN.'); process.exit(1); }
  if (dnsOnly) { console.log('\nDNS/TCP checks passed (--dns-only: not testing login).'); return; }

  console.log('\n4) Real login + ping (uses the database user and password from MONGO_URI)');
  const mongoose = require('mongoose');
  try {
    const conn = await mongoose.connect(uri, getMongoConnectOptions());
    await conn.connection.db.admin().ping();
    ok(`connected, ping succeeded. database in use: "${conn.connection.name}"`);
    const cols = await conn.connection.db.listCollections().toArray();
    info(cols.length ? `collections here: ${cols.map((c) => c.name).join(', ')}` : 'this database has NO collections yet - if you expected existing data, you are probably on the wrong database name.');
    await mongoose.disconnect();
    console.log('\nAll checks passed.');
  } catch (e) {
    bad('connect failed');
    console.error(formatDbFailure(e, parsed));
    process.exit(1);
  }
}

main().catch((e) => { console.error(redactMongoUri(e.stack || e.message)); process.exit(1); });