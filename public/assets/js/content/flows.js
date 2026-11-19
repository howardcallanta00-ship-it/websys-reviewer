// Request-path rails shown above lessons. Each stop: [label, sub-label, what happens here].
const CI = {
  browser: ['Browser', 'sends request', 'The browser sends a request and waits for the response. It never talks to your PHP code directly.'],
  routes: ['Routes.php', 'app/Config', 'CodeIgniter checks your routes top to bottom until one matches the URL, then calls that controller method.'],
  filter: ['AuthFilter', 'before()', 'Runs before the controller. If `isLoggedIn` is missing from the session, it returns a redirect to /login.'],
  controller: ['Controller', 'app/Controllers', 'Receives the request, asks the Model for data, and returns a View.'],
  model: ['Model', 'app/Models', 'Talks to one database table and returns records to the controller.'],
  db: ['Database', 'MySQL', 'Stores the records. The connection settings come from `.env`.'],
  view: ['View', 'app/Views', 'HTML with small bits of PHP that displays the data it was given.']
};
const LV = {
  browser: ['Browser', 'sends request', 'The browser sends a request and waits for the response.'],
  routes: ['routes/web.php', 'routes', 'Laravel matches the URL to a route, which either responds directly or calls a controller method.'],
  middleware: ['auth', 'middleware', 'Checks the session for a logged-in user. Guests are redirected to the login page before the controller runs.'],
  controller: ['Controller', 'app/Http/Controllers', 'Prepares the data and returns a Blade view.'],
  model: ['Eloquent model', 'app/Models', 'One model per table. It turns rows into PHP objects.'],
  db: ['Database', 'SQLite / MySQL', 'Tables are created by migrations. The connection settings come from `.env`.'],
  view: ['Blade view', 'resources/views', 'A `.blade.php` template. `{{ }}` prints values safely.']
};

export function flow(track, active, opts = {}) {
  const base = track === 'lv' ? LV : CI;
  const gateKey = track === 'lv' ? 'middleware' : 'filter';
  const keys = opts.keys || (opts.gate
    ? ['browser', 'routes', gateKey, 'controller', 'model', 'view']
    : ['browser', 'routes', 'controller', 'model', 'view']);
  const stops = keys.map((k) => (opts.over && opts.over[k]) || base[k]);
  const act = (Array.isArray(active) ? active : [active]).map((k) => keys.indexOf(k)).filter((i) => i >= 0);
  return { track, stops, active: act, gate: opts.gate ? keys.indexOf(gateKey) : -1, url: opts.url || null };
}
