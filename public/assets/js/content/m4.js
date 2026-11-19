import { flow } from './flows.js';
const R = String.raw;

const guarded = (active) => flow('ci', active, {
  gate: true, url: 'GET /tasks',
  over: {
    routes: ['Routes.php', "'filter' => 'auth'", "Matches /tasks to Tasks::index and sees that the route carries the 'auth' filter."],
    filter: ['AuthFilter', 'before()', "Checks `session()->get('isLoggedIn')`. Guests get `redirect()->to('/login')`, which ends the request."],
    controller: ['Tasks::index', 'controller', 'Runs only if the filter let the request through.'],
    model: ['TaskModel', 'findAll()', 'Fetches the rows from the tasks table.'],
    view: ['tasks/index.php', 'view', 'Prints the list and the "Welcome, admin" line.']
  }
});

export default {
  id: 'm4', code: 'M4', track: 'ci',
  title: 'Authentication and Sessions',
  summary: 'Give HTTP a memory with sessions and flash data, hash and verify passwords, build login and logout, and protect routes with a Filter.',
  objectives: [
    'Store, retrieve and remove small session values',
    'Use flash data for one-time redirect messages',
    'Hash and verify passwords correctly',
    'Create a basic login and logout workflow',
    'Protect routes with a CodeIgniter Filter'
  ],
  layers: { routes: "'filter' => 'auth'", controller: 'Auth login and logout', model: 'users table, password_hash', view: 'flash messages', security: 'AuthFilter, sessions' },
  lessons: [
    {
      id: 'sessions', title: 'Sessions give HTTP a memory', sub: 'set(), get(), remove(), destroy()',
      lead: 'HTTP treats each page request as separate. A session ties small pieces of data to one visitor across requests, like a logged-in user id, a username or a one-time message.',
      plain: 'A session is a coat-check ticket. The browser keeps the ticket (a session cookie), and the server keeps the coat (the session data) until the visitor comes back for it.',
      body: [
        ['steps', ['Request 1: set a session value.', 'Request 2: read the same value.', 'Request 3: remove it, or destroy the whole session.'], 'Session data lives across requests'],
        ['p', 'CodeIgniter starts the session as soon as any session-related action is made, so you never call `session_start()` yourself. The browser keeps a session cookie, and the app reads the matching session data.'],
        ['note', 'Do not store passwords or large records in session data.', 'Rule']
      ],
      code: [{
        name: 'Tasks.php', path: 'app/Controllers/Tasks.php', lang: 'php',
        src: R`session()->set('username', 'admin');

$name = session()->get('username');
// or
$name = session('username');

echo $name; // admin

session()->remove('username');
session()->destroy();`,
        notes: [
          ["session()->set(", 'Remember a value', 'set() stores a value under a key for later requests.'],
          ["session()->get(", 'Read it later', 'get() reads the value back on any later request.'],
          ["$name = session('username')", 'Shorter form', 'The session() helper with a key does the same as ->get().'],
          ['->remove(', 'Clear one value', 'remove() deletes just that key.'],
          ['->destroy()', 'Clear everything', 'destroy() clears the whole session. Use it during logout, because all login state should end at once.']
        ]
      }],
      check: { q: 'Which call should logout use so every login value ends at once?', o: ['session()->destroy()', "session()->remove('username')", "session()->set('isLoggedIn', false)", 'session_start()'], a: 0, why: 'destroy() clears the whole session. remove() only clears one key.' }
    },
    {
      id: 'flash', title: 'Flash data for one-time messages', sub: 'setFlashdata() and getFlashdata()',
      lead: 'Flash data survives one more request, so it is ideal right before a redirect. After it is read on the next page, it is removed automatically.',
      code: [{
        name: 'Tasks.php', path: 'app/Controllers/Tasks.php', lang: 'php',
        src: R`session()->setFlashdata(
    'message',
    'Task added successfully!'
);

return redirect()->to('/tasks');`,
        notes: [
          ['setFlashdata(', 'Set it before the redirect', 'The message is stored for exactly one more request. Setting it after the redirect is a listed mistake: the code never runs.'],
          ["redirect()->to('/tasks')", 'The next request', 'The list page is the one request that will see the message.']
        ]
      }, {
        name: 'index.php', path: 'app/Views/tasks/index.php', lang: 'blade',
        src: R`<?php if (session()->getFlashdata('message')): ?>
    <p class="success">
        <?= session()->getFlashdata('message') ?>
    </p>
<?php endif ?>`,
        notes: [
          ["getFlashdata('message')", 'Read it on the destination page', 'Use the same key you set. Checking the wrong key is a listed mistake.'],
          ['endif', 'Shown once', 'Refresh the page and the message is gone.']
        ]
      }],
      body: [
        ['steps', ['The task is saved first.', 'The controller sets flash data.', 'The redirect returns to the list page.', 'The list page shows the message once.'], 'Practical example: a confirmation message'],
        ['note', 'Session data lasts the visit. Flash data lasts exactly one request past the one that set it.', 'Remember']
      ],
      check: { q: 'How long does flash data last?', o: ['Exactly one more request after the one that set it', 'Until you call remove()', 'Until the browser closes', 'Forever, until logout'], a: 0, why: 'Flash data survives one more request and is then removed automatically.' },
      twin: 'flash'
    },
    {
      id: 'session-safety', title: 'Session safety habits', sub: 'What belongs in a session',
      lead: 'A session should hold only the small values the next requests need.',
      body: [
        ['compare', ['Bad', ['Session password', 'The entire user table', 'Large arrays that belong in the database']], ['Good', ['Session user_id', 'Session username', 'A one-time flash message']]],
        ['list', ['Store only small values needed for the next requests.', 'Store a user id, not the user’s password.', 'Clear login session data on logout.', 'Use flash data for messages that should disappear.'], 'Habits'],
        ['table', ['Error', 'What went wrong'], [
          ['The flash message never shows', 'It was set after the redirect.'],
          ['The flash message never shows', 'The view checks a different key from the one that was set.'],
          ['The user still looks logged in', 'Logout removed one key but left other login values.'],
          ['Sessions get slow or bloated', 'Large arrays are stored in the session instead of the database.']
        ], 'Common session errors']
      ],
      check: { q: 'Which value is safe to keep in the session after login?', o: ['The user id', 'The plain-text password', 'The whole users table', 'The password hash'], a: 0, why: 'Keep only small identifying values like user_id and username. Never the password.' }
    },
    {
      id: 'hashing', title: 'Hashing passwords', sub: 'password_hash() and a users table',
      lead: 'Never save a plain-text password. Hash it first, then store only the hash.',
      plain: 'A hash is like a fingerprint of the password. You can check whether a typed password matches the fingerprint, but you cannot turn the fingerprint back into the password.',
      body: [
        ['table', ['Column', 'Type'], [
          ['`id`', 'INT AUTO_INCREMENT PRIMARY KEY'],
          ['`username`', 'VARCHAR(100) UNIQUE'],
          ['`password`', 'VARCHAR(255), stores a hash, not plain text']
        ], 'A minimal users table']
      ],
      code: [{
        name: 'User setup', path: 'example', lang: 'php',
        src: R`$hash = password_hash(
    $plainPassword,
    PASSWORD_DEFAULT
);
// Save $hash in the password column.`,
        notes: [
          ['password_hash(', 'Create the stored hash', 'The plain password is never saved. Only the result of password_hash().'],
          ['PASSWORD_DEFAULT', 'Let PHP pick the algorithm', 'PASSWORD_DEFAULT lets PHP choose a strong default.']
        ]
      }, {
        name: 'UserModel.php', path: 'app/Models/UserModel.php', lang: 'php',
        src: R`use CodeIgniter\Model;

class UserModel extends Model
{
    protected $table = 'users';
    protected $allowedFields = ['username', 'password'];
}

$model = new UserModel();
$model->insert([
    'username' => 'admin',
    'password' => password_hash('secret123', PASSWORD_DEFAULT),
]);`,
        notes: [
          ["$table = 'users'", 'A model for the users table', 'Same pattern as TaskModel.'],
          ["password_hash('secret123'", 'One demo account', 'Username admin, typed password secret123. The database stores the hash only.']
        ]
      }],
      check: { q: 'What should the password column in the users table store?', o: ['The result of password_hash()', 'The plain-text password', 'The password encrypted with base64', 'The username again'], a: 0, why: 'Store only the hash. The plain password is never saved.' }
    },
    {
      id: 'login', title: 'The login flow', sub: 'Find the user, verify, remember',
      lead: 'Authentication checks who the user is. A login form collects a username and password. The app finds the user record, verifies the typed password against the stored hash, and stores login state in the session.',
      code: [{
        name: 'login.php', path: 'app/Views/auth/login.php', lang: 'blade',
        src: R`<form method="post" action="<?= site_url('login') ?>">
    <?= csrf_field() ?>
    <input name="username">
    <input type="password" name="password">
    <button type="submit">Log In</button>
</form>`,
        notes: [
          ["site_url('login')", 'Post the credentials', 'The controller reads username and password from the request.'],
          ['type="password"', 'Masked input', 'The browser hides what is typed.']
        ]
      }, {
        name: 'Auth.php', path: 'app/Controllers/Auth.php', lang: 'php',
        src: R`use App\Models\UserModel;

$model = new UserModel();
$username = $this->request->getPost('username');
$password = $this->request->getPost('password');
$user = $model->where('username', $username)->first();

if (! $user || ! password_verify($password, $user['password'])) {
    session()->setFlashdata('error', 'Invalid login.');
    return redirect()->back()->withInput();
}

session()->set([
    'isLoggedIn' => true,
    'user_id'    => $user['id'],
    'username'   => $user['username'],
]);

return redirect()->to('/tasks');`,
        notes: [
          ["->where('username', $username)->first()", 'Find the user record', 'Same pattern as TaskModel: import the class, create the object, call a query method. first() returns one row or null.'],
          ['password_verify(', 'Compare against the hash', 'password_verify() checks the typed password against the stored hash. Never compare with == or ===.'],
          ["setFlashdata('error'", 'One-time error', 'Shown once on the login page after the redirect.'],
          ["'isLoggedIn' => true", 'Remember the login', 'Keep only small login values in the session. The password is not stored in the session.'],
          ["redirect()->to('/tasks')", 'Into the app', 'A successful login goes to the protected task list.']
        ]
      }],
      check: { q: 'How should the controller check the typed password?', o: ["password_verify($password, $user['password'])", "$password == $user['password']", "$password === $user['password']", "password_hash($password) === $user['password']"], a: 0, why: 'password_verify() is the pair of password_hash(). Comparing with == or === does not work with hashes.' },
      watch: ['Using == instead of password_verify()', 'Saving plain-text passwords']
    },
    {
      id: 'logout', title: 'Logging out', sub: 'destroy() and redirect',
      lead: 'Logout destroys the session, then redirects to the login page.',
      code: [{
        name: 'Auth.php', path: 'app/Controllers/Auth.php', lang: 'php',
        src: R`public function logout()
{
    session()->destroy();
    return redirect()->to('/login');
}`,
        notes: [['session()->destroy()', 'End all login state', 'The same destroy() call from the sessions lesson. Removing only one key would leave other login values behind.']]
      }, {
        name: 'Routes.php', path: 'app/Config/Routes.php', lang: 'php',
        src: R`$routes->get('/logout', 'Auth::logout');`,
        notes: [["'/logout'", 'The logout route', 'Visiting /logout runs Auth::logout.']]
      }],
      check: { q: 'What is wrong with a logout method that only calls session()->remove(\'isLoggedIn\')?', o: ['Other login values such as user_id stay in the session', 'remove() deletes the users table', 'It logs out every user on the server', 'Nothing. That is the recommended way.'], a: 0, why: 'Logout should destroy the whole session so all login state ends at once.' },
      watch: ['Leaving login data after logout']
    },
    {
      id: 'filter', title: 'A Filter checks the visitor before the controller runs', sub: 'AuthFilter, alias and route',
      lead: 'Instead of repeating a login check in every controller method, one class owns the check. Any route that needs login points to it, and guests are redirected before the page code even starts.',
      plain: 'A Filter is a guard at the door. Logging in gives the visitor a wristband (isLoggedIn in the session). No wristband, no entry: they get sent to /login.',
      flow: guarded('filter'),
      body: [
        ['compare', ['Manual checks in every method', ['Repeated in every method', 'Easy to forget', 'Harder to update later', 'Login logic scattered everywhere']], ['One Filter', ['One class owns the check', 'Routes declare which pages are protected', 'Redirects happen before controller logic', 'Easier to reuse']]],
        ['list', ['`before()` checks session state before the controller runs.', 'If `isLoggedIn` is missing, it returns a redirect response to /login.', '`after()` runs after the controller, right before the response is sent to the browser.'], 'How the filter behaves'],
        ['note', 'This is authentication-based access control. Role-based permissions (admins vs. regular users) need additional role checks.', 'Scope']
      ],
      code: [{
        name: 'AuthFilter.php', path: 'app/Filters/AuthFilter.php', lang: 'php',
        src: R`<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

class AuthFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        if (! session()->get('isLoggedIn')) {
            return redirect()->to('/login');
        }
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null) {}
}`,
        notes: [
          ['namespace App\\Filters', 'Filters live in app/Filters', 'The namespace matches the folder. That is how CodeIgniter finds the class when the alias points to it.'],
          ['FilterInterface;', 'The contract every filter signs', 'FilterInterface says any filter must have two methods: before() and after().'],
          ['implements FilterInterface', 'implements = a promise', 'AuthFilter promises to provide before() and after(). PHP will error if one is missing.'],
          ['function before', 'before() runs first', 'CodeIgniter calls before() after the route matches but before Tasks::index runs. If it returns a redirect, the controller never runs.'],
          ["session()->get('isLoggedIn')", 'Reads the login flag', "Your login method saved isLoggedIn with session()->set([...]). The ! flips it, so this block runs when the visitor is NOT logged in."],
          ["redirect()->to('/login')", 'Returning stops the request', 'Returning a response from before() ends the request and sends the guest to /login. Nothing after this point runs.'],
          ['function after', 'after() runs last', 'Runs once the controller is done, right before the response goes to the browser. Empty here because the login check only needs before().']
        ]
      }, {
        name: 'Filters.php', path: 'app/Config/Filters.php', lang: 'php',
        src: R`public array $aliases = [
    'auth' => \App\Filters\AuthFilter::class,
];`,
        notes: [
          ['$aliases', 'Aliases give filters short names', 'Routes refer to filters by alias, not by class name. Register them in this array.'],
          ["'auth' =>", "'auth' now means AuthFilter", "Forgetting this alias is a listed mistake: the route says 'auth' but CodeIgniter does not know what that is."]
        ]
      }, {
        name: 'Routes.php', path: 'app/Config/Routes.php', lang: 'php',
        src: R`$routes->get('/tasks', 'Tasks::index', [
    'filter' => 'auth',
]);`,
        notes: [
          ["'Tasks::index', [", 'The route being protected', 'A normal GET route with a third argument: an options array.'],
          ["'filter' => 'auth'", 'Attach the filter', 'Protection lives on the route. Protecting the page but not the route is a listed mistake. Attach the alias to every route that requires login.']
        ]
      }],
      check: { q: 'A guest (not logged in) opens /tasks. What happens?', o: ['AuthFilter::before() redirects to /login, and Tasks::index never runs', 'Tasks::index runs, then the filter redirects to /login', 'AuthFilter::after() redirects to /login once the page has loaded', 'Routes.php shows a 404 because the route is protected'], a: 0, why: "before() sees isLoggedIn is missing and returns redirect()->to('/login'), which ends the request before the controller." },
      watch: ['Forgetting the filter alias', 'Protecting the page but not the route'],
      twin: 'require-login'
    },
    {
      id: 'checklist', title: 'Testing access control', sub: 'The safe authentication checklist',
      lead: 'Try the protected route before and after logging in. Even the simplest app must follow proper authentication and access-control habits.',
      flow: guarded(['filter', 'controller']),
      body: [
        ['steps', ['Log out.', 'Visit /tasks.', 'Confirm you are redirected to /login.', 'Log in.', 'Visit /tasks again. You should see My Tasks and "Welcome, admin".'], 'Manual test'],
        ['steps', ['Validate login fields.', 'Look up the username.', 'Verify with `password_verify()`.', 'Store only small session values.', 'Protect routes with a filter.', 'Destroy the session on logout.'], 'Safe authentication checklist'],
        ['note', 'Sessions give HTTP memory. Flash data is one-time. Hash and verify are a pair. A Filter centralizes access checks. Logout destroys login state.', 'Key takeaways']
      ],
      check: { q: 'Which step is NOT on the safe authentication checklist?', o: ['Store the password in the session for later checks', 'Verify with password_verify()', 'Protect routes with a filter', 'Destroy the session on logout'], a: 0, why: 'The password never goes in the session. Store only small values like user_id and username.' }
    }
  ],
  mistakes: [
    'Saving plain-text passwords',
    'Using == instead of password_verify()',
    'Forgetting the filter alias',
    'Protecting the page but not the route',
    'Leaving login data after logout'
  ],
  takeaways: [
    'Sessions give HTTP memory',
    'Flash data is one-time',
    'Hash and verify are a pair',
    'A Filter centralizes access checks',
    'Logout destroys login state'
  ],
  quiz: [
    { t: 'mcq', q: 'Why do web apps need sessions?', o: ['HTTP treats each request as separate, so sessions tie data to one visitor across requests', 'Sessions make pages load faster', 'Sessions replace the database', 'Sessions are required for routing'], a: 0, why: 'A session gives HTTP a memory.', l: 'sessions' },
    { t: 'tf', q: 'In CodeIgniter 4 you must call session_start() before using session().', a: false, why: 'False. CodeIgniter starts the session as soon as any session-related action is made.', l: 'sessions' },
    { t: 'fill', q: 'Remember the username in the session.', code: "session()->___('username', 'admin');", a: 'set', why: 'session()->set(key, value) stores a value.', l: 'sessions' },
    { t: 'mcq', q: 'What is the difference between remove() and destroy()?', o: ['remove() clears one value; destroy() clears the whole session', 'remove() clears everything; destroy() clears one value', 'They are the same', 'destroy() deletes the users table'], a: 0, why: 'Use destroy() for logout so all login state ends at once.', l: 'sessions' },
    { t: 'id', q: 'Type the method that stores a one-time message for the next request.', a: 'setFlashdata()', alt: ['setFlashdata', 'session()->setFlashdata()'], why: "session()->setFlashdata('message', '...').", l: 'flash' },
    { t: 'mcq', q: 'Which method reads a flash message on the destination page?', o: ['getFlashdata()', 'get()', 'flash()', 'old()'], a: 0, why: "session()->getFlashdata('message').", l: 'flash' },
    { t: 'order', q: 'Put the confirmation-message workflow in order.', o: ['The task is saved', 'The controller sets flash data', 'The redirect returns to the list page', 'The list page shows the message once'], why: 'Save, set flash data, redirect, show once.', l: 'flash' },
    { t: 'mcq', q: 'A flash message never appears. Which cause is listed in the module?', o: ['It was set after the redirect', 'It was set before the redirect', 'The view used getFlashdata()', 'The session cookie exists'], a: 0, why: 'Code after return redirect() never runs, so the message is never set.', l: 'session-safety' },
    { t: 'tf', q: 'It is fine to store the entire users table in the session for quick access.', a: false, why: 'False. Store only small values. Large arrays belong in the database.', l: 'session-safety' },
    { t: 'mcq', q: 'What length does the module use for the password column?', o: ['VARCHAR(255)', 'VARCHAR(20)', 'INT', 'VARCHAR(8)'], a: 0, why: 'VARCHAR(255) leaves room for the hash.', l: 'hashing' },
    { t: 'id', q: 'Type the PHP function that creates a password hash.', a: 'password_hash()', alt: ['password_hash'], why: 'password_hash($plainPassword, PASSWORD_DEFAULT).', l: 'hashing' },
    { t: 'fill', q: 'Let PHP choose a strong default algorithm.', code: '$hash = password_hash($plainPassword, ______________);', a: 'PASSWORD_DEFAULT', why: 'PASSWORD_DEFAULT lets PHP choose a strong default.', l: 'hashing' },
    { t: 'mcq', q: 'Why is the username column UNIQUE?', o: ['So one username matches exactly one user record during login', 'So passwords can be shorter', 'So the table needs no id', 'So sessions are faster'], a: 0, why: 'Login looks up the user by username, so it must be unique.', l: 'hashing' },
    { t: 'mcq', q: 'How does the login controller find the user?', o: ["$model->where('username', $username)->first()", '$model->findAll()', "$model->find($username)", 'session()->get($username)'], a: 0, why: 'where() filters by username and first() returns one row or null.', l: 'login' },
    { t: 'id', q: 'Type the PHP function that checks a typed password against a stored hash.', a: 'password_verify()', alt: ['password_verify'], why: 'password_verify($password, $user[\'password\']).', l: 'login' },
    { t: 'tf', q: 'After a successful login, the app should store the password in the session.', a: false, why: 'False. Store isLoggedIn, user_id and username only.', l: 'login' },
    { t: 'mcq', q: 'Which session key does AuthFilter check?', o: ['isLoggedIn', 'password', 'user_table', 'csrf'], a: 0, why: "if (! session()->get('isLoggedIn')) redirect to /login.", l: 'filter' },
    { t: 'mcq', q: 'When does a filter’s before() method run?', o: ['Before the controller runs', 'After the view renders', 'Only on POST requests', 'When the session is destroyed'], a: 0, why: 'before() runs after the route matches but before the controller.', l: 'filter' },
    { t: 'mcq', q: 'When does a filter’s after() method run?', o: ['After the controller, right before the response is sent', 'Before the route matches', 'Only when login fails', 'Never; it is optional'], a: 0, why: 'after() runs after the controller, before the response reaches the browser.', l: 'filter' },
    { t: 'mcq', q: 'Where do you register the filter alias?', o: ['app/Config/Filters.php', 'app/Config/Routes.php', 'app/Filters/AuthFilter.php', '.env'], a: 0, why: "public array $aliases = ['auth' => \\App\\Filters\\AuthFilter::class];", l: 'filter' },
    { t: 'fill', q: 'Protect the task list route.', code: "$routes->get('/tasks', 'Tasks::index', [\n    '______' => 'auth',\n]);", a: 'filter', why: "The options array uses 'filter' => 'auth'.", l: 'filter' },
    { t: 'mcq', q: 'Which interface must AuthFilter implement?', o: ['FilterInterface', 'RequestInterface', 'ResponseInterface', 'ModelInterface'], a: 0, why: 'class AuthFilter implements FilterInterface.', l: 'filter' },
    { t: 'tf', q: 'A Filter with an isLoggedIn check also gives you role-based permissions for admins.', a: false, why: 'False. This is authentication-based access control. Roles need additional checks.', l: 'filter' },
    { t: 'order', q: 'Put the manual access-control test in order.', o: ['Log out', 'Visit /tasks', 'Confirm the redirect to /login', 'Log in', 'Visit /tasks again'], why: 'Test the protected route before and after login.', l: 'checklist' }
  ]
};
