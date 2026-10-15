// Pure helpers (no mongoose, no network) for reading the MongoDB configuration and explaining connection failures.
// Nothing here ever prints the database password.

class DbConfigError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'DbConfigError';
    this.code = code;
  }
}

// mongodb+srv://user:secret@host/db  ->  mongodb+srv://user:****@host/db
function redactMongoUri(text) {
  return String(text == null ? '' : text).replace(/(mongodb(?:\+srv)?:\/\/[^:/\s@]*:)[^@\s]*@/gi, '$1****@');
}

// Reads MONGO_URI. There is deliberately NO silent fallback to localhost: pointing at a local database must be an
// explicit choice (MONGO_URI=mongodb://localhost:27017/exotic_store).
function getMongoUri(env = process.env) {
  const uri = (env.MONGO_URI || '').trim();
  if (!uri) {
    throw new DbConfigError(
      'MONGO_URI is not set. Add your connection string from the MongoDB Atlas dashboard to backend/.env ' +
        '(Atlas > Database > Connect > Drivers). For a local database set it explicitly, e.g. ' +
        'MONGO_URI=mongodb://localhost:27017/exotic_store',
      'MONGO_URI_MISSING'
    );
  }
  return uri;
}

// Options shared by the server, the seed script and the PayHere simulator so they all use the SAME database.
function getMongoConnectOptions(env = process.env) {
  const options = { serverSelectionTimeoutMS: 15000 };
  const dbName = (env.MONGO_DB_NAME || '').trim();
  if (dbName) options.dbName = dbName;
  return options;
}

// Splits a connection string into safe-to-print parts and flags structural problems.
function parseMongoUri(uri) {
  const problems = [];
  const match = /^(mongodb(?:\+srv)?):\/\/(.*)$/i.exec(String(uri || '').trim());
  if (!match) {
    return { valid: false, problems: ['The connection string must start with "mongodb+srv://" or "mongodb://".'] };
  }
  const scheme = match[1].toLowerCase();
  const rest = match[2];
  const authorityEnd = rest.search(/[/?]/);
  const authority = authorityEnd === -1 ? rest : rest.slice(0, authorityEnd);
  const afterAuthority = authorityEnd === -1 ? '' : rest.slice(authorityEnd);
  const at = authority.lastIndexOf('@');
  const userInfo = at === -1 ? '' : authority.slice(0, at);
  const hostPart = at === -1 ? authority : authority.slice(at + 1);
  const colon = userInfo.indexOf(':');
  const user = colon === -1 ? userInfo : userInfo.slice(0, colon);
  const password = colon === -1 ? '' : userInfo.slice(colon + 1);

  const hosts = hostPart.split(',').map((h) => h.trim()).filter(Boolean);
  const dbName = decodeURIComponentSafe((afterAuthority.split('?')[0] || '').replace(/^\//, ''));
  const query = afterAuthority.includes('?') ? afterAuthority.slice(afterAuthority.indexOf('?') + 1) : '';

  if (!hosts.length) problems.push('No hostname found in the connection string.');
  if (scheme === 'mongodb+srv' && hosts.length > 1) problems.push('mongodb+srv:// takes exactly one hostname (no commas, no port).');
  if (scheme === 'mongodb+srv' && hosts.some((h) => h.includes(':'))) problems.push('mongodb+srv:// hostnames must not include a port.');
  if (!user || !password) problems.push('Username or password is missing from the connection string.');
  if (/<[^>]*>/.test(userInfo)) problems.push('The username/password still contains a <placeholder>; replace it with the real value (without the angle brackets).');
  if (/[@:/?#[\]]/.test(password)) problems.push('The password contains a reserved character (@ : / ? # [ ]) that must be percent-encoded.');
  if (!dbName) problems.push('No database name in the connection string, so MongoDB will use its default database "test". Add it after the host (…mongodb.net/YOUR_DB?…) or set MONGO_DB_NAME.');

  return { valid: true, scheme, user, hasPassword: Boolean(password), hosts, host: hosts[0] || '', dbName, query, problems };
}

function decodeURIComponentSafe(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

const RESOLVER_CODES = ['EBADRESP', 'ECONNREFUSED', 'ETIMEOUT', 'ETIMEDOUT', 'ESERVFAIL', 'EREFUSED', 'EBADQUERY', 'EBADNAME', 'EBADFAMILY', 'ECANCELLED', 'EAI_AGAIN'];
const NAME_CODES = ['ENOTFOUND', 'ENODATA'];

// Turns a connection error into { category, title, causes[], steps[] }. Order matters: most specific first.
function classifyDbError(err, uriInfo = {}) {
  const e = err || {};
  const message = redactMongoUri(e.message || String(e));
  const code = e.code || e.errno;
  const syscall = e.syscall || '';
  const host = uriInfo.host || '';

  if (e instanceof DbConfigError || e.name === 'DbConfigError') {
    return { category: 'CONFIG', title: 'Database configuration problem', causes: [e.message], steps: ['Fix backend/.env, then run npm start again.'] };
  }

  const isSrv = syscall === 'querySrv' || /\bquerySrv\b/.test(message);
  const isTxt = syscall === 'queryTxt' || /\bqueryTxt\b/.test(message);
  if (isSrv || isTxt) {
    const record = isSrv ? 'SRV' : 'TXT';
    if (NAME_CODES.includes(code) || /ENOTFOUND|ENODATA/.test(message)) {
      return {
        category: 'DNS_NAME_NOT_FOUND',
        title: `DNS says the Atlas hostname has no ${record} records`,
        causes: [
          `The hostname "${host}" is wrong, mistyped, or belongs to a cluster that was deleted.`,
          'You are using an old connection string after the cluster was recreated (the random part of the hostname changes).'
        ],
        steps: [
          'Open Atlas > Database > your cluster > Connect > Drivers and copy the connection string again.',
          `Compare the hostname character by character with "${host}".`,
          'Confirm the cluster still exists and is not deleted.'
        ]
      };
    }
    if (RESOLVER_CODES.includes(code) || /EBADRESP|ECONNREFUSED|ETIMEOUT|ESERVFAIL|EREFUSED/.test(message)) {
      return {
        category: 'DNS_RESOLVER',
        title: `This computer's DNS resolver failed the ${record} lookup (the hostname itself may be fine)`,
        causes: [
          `"${code || 'resolver error'}" means the DNS server answered badly or not at all. It is NOT a wrong-password or IP-allowlist problem: no connection to MongoDB was attempted yet.`,
          'Typical culprits: router/ISP DNS that mishandles SRV queries, a VPN or DNS filter, antivirus "web protection", a captive/corporate network, or no internet.'
        ],
        steps: [
          'Run: npm run db:check   (tests the same DNS path Node uses, and tries public resolvers for comparison).',
          `PowerShell: Resolve-DnsName -Type SRV -Name _mongodb._tcp.${host || '<your-cluster-host>'}`,
          'If public DNS (8.8.8.8 / 1.1.1.1) works but your default does not: set Windows DNS to 8.8.8.8 and 1.1.1.1, run ipconfig /flushdns, and retry.',
          'Alternative that avoids SRV lookups: in Atlas > Connect > Drivers choose the "standard" (non-SRV) connection string and use it as MONGO_URI.',
          'Temporarily disable VPN / DNS-filtering software to see whether it is the cause.'
        ]
      };
    }
    return { category: 'DNS_OTHER', title: `DNS ${record} lookup failed`, causes: [message], steps: ['Run: npm run db:check'] };
  }

  if (e.name === 'MongoParseError' || /Invalid (scheme|connection string)|Invalid URL|URI malformed|must be URL.?encoded|Unescaped|Invalid namespace/i.test(message)) {
    return {
      category: 'URI_INVALID',
      title: 'The connection string is malformed',
      causes: [message],
      steps: [
        'Re-copy the string from Atlas (Connect > Drivers). Passwords with special characters must be percent-encoded (@ becomes %40, : becomes %3A, / becomes %2F).',
        'Make sure there are no spaces, quotes or <placeholders> around the value in .env.'
      ]
    };
  }

  if (e.codeName === 'AuthenticationFailed' || code === 18 || /bad auth|authentication failed/i.test(message)) {
    return {
      category: 'AUTH',
      title: 'MongoDB rejected the username or password',
      causes: ['DNS and the network worked, but the database user/password is wrong, the user was deleted, or it has no access to this database.'],
      steps: [
        'Atlas > Security > Database Access: confirm the user exists and has a role (e.g. readWriteAnyDatabase / Atlas admin).',
        'Reset the password there, then update MONGO_URI (percent-encode special characters).',
        'The username is the Database User, not your Atlas login email.'
      ]
    };
  }

  if (e.name === 'MongoServerSelectionError' || /Server selection timed out|Could not connect to any servers|ReplicaSetNoPrimary/i.test(message)) {
    const serverError = firstServerError(e);
    const whitelist = /whitelist|allowlist|isn't whitelisted|IP that/i.test(message);
    return {
      category: whitelist ? 'NETWORK_ACCESS' : 'SERVER_SELECTION',
      title: whitelist ? 'Atlas refused the connection: this IP address is probably not allowed' : 'DNS worked, but no MongoDB server could be reached',
      causes: [
        'Your current public IP is not in Atlas > Security > Network Access (most common).',
        'Port 27017 is blocked by a firewall, VPN, school/office network, or antivirus.',
        'The cluster is paused (free clusters pause after inactivity) or still starting.',
        ...(serverError ? [`Underlying error from the driver: ${serverError}`] : [])
      ],
      steps: [
        'Atlas > Security > Network Access: add your current IP (or "Add Current IP Address"). Changes take ~1 minute.',
        'Atlas > Database: confirm the cluster is not paused; click Resume if it is.',
        'PowerShell: Test-NetConnection <shard-host> -Port 27017  (see npm run db:check for the host list).'
      ]
    };
  }

  if (/ssl|tls|certificate|alert number/i.test(message)) {
    return {
      category: 'TLS',
      title: 'TLS/SSL handshake failed',
      causes: ['Often caused by an IP not allowed in Atlas, antivirus/proxy intercepting TLS, or a wrong system clock.', message],
      steps: ['Check Atlas Network Access, disable HTTPS-scanning antivirus/proxy, and verify the Windows clock is correct.']
    };
  }

  if (['ECONNREFUSED', 'ETIMEDOUT', 'ENETUNREACH', 'EHOSTUNREACH', 'ECONNRESET'].includes(code)) {
    return { category: 'NETWORK', title: `Network error (${code})`, causes: ['Nothing is accepting connections at the target address, or the network blocks it.', message], steps: ['If using local MongoDB, make sure mongod is running. For Atlas, check Network Access and firewalls.'] };
  }

  return { category: 'UNKNOWN', title: 'Unrecognised database error', causes: [message], steps: ['Run: npm run db:check'] };
}

function firstServerError(err) {
  try {
    const servers = err.reason && err.reason.servers;
    if (!servers) return '';
    for (const server of servers.values ? servers.values() : Object.values(servers)) {
      if (server && server.error && server.error.message) return redactMongoUri(server.error.message);
    }
  } catch {
    /* ignore */
  }
  return '';
}

// Multi-line, human-readable failure report. Always includes the raw error code/message (password redacted).
function formatDbFailure(err, uriInfo = {}) {
  const c = classifyDbError(err, uriInfo);
  const e = err || {};
  const raw = [e.name, e.code ? `code=${e.code}` : '', e.syscall ? `syscall=${e.syscall}` : ''].filter(Boolean).join(' ');
  const lines = [
    '',
    '============================================================',
    ' DATABASE CONNECTION FAILED - the API is NOT running',
    '============================================================',
    ` Problem : ${c.title}`,
    ` Raw     : ${raw ? raw + ' | ' : ''}${redactMongoUri(e.message || String(e))}`
  ];
  if (uriInfo.host) lines.push(` Target  : ${uriInfo.scheme || ''}://${uriInfo.host}${uriInfo.dbName ? '/' + uriInfo.dbName : ''}`);
  lines.push('', ' Likely causes:', ...c.causes.map((x) => `   - ${x}`), '', ' What to do:', ...c.steps.map((x, i) => `   ${i + 1}. ${x}`), '============================================================', '');
  return lines.join('\n');
}

module.exports = { DbConfigError, redactMongoUri, getMongoUri, getMongoConnectOptions, parseMongoUri, classifyDbError, formatDbFailure };