import { flow } from './flows.js';
const R = String.raw;

const guarded = (active) => flow('lv', active, {
  gate: true, url: 'GET /tasks',
  over: {
    routes: ['routes/web.php', "middleware('auth')", "Route::resource('tasks', ...) inside the auth group maps GET /tasks to TaskController's index()."],
    middleware: ['auth', 'middleware', 'Checks the session for a logged-in user. Guests are redirected to the login page before the controller runs.'],
    controller: ['TaskController', 'index()', '$request->user()->tasks()->latest()->get() returns only this user’s tasks.'],
    model: ['Task', 'tasks() relation', 'The hasMany relationship on User filters records by user_id.'],
    view: ['tasks/index.blade.php', 'view', '@foreach over $tasks, printed safely with {{ }}.']
  }
});

export default {
  id: 'm8', code: 'M8', track: 'lv',
  title: 'Full CRUD, Auth and Email Notifications',
  summary: 'Build the complete CRUD workflow with resource routes and controllers, protect it with auth scaffolding and middleware, and send an email when a task is completed.',
  objectives: [
    'Develop a complete Laravel CRUD workflow using resource routes',
    'Organize controller methods with a resource controller',
    'Apply guided authentication scaffolding and protected routes',
    'Configure email settings for local testing',
    'Send an email notification from a Laravel application event'
  ],
  layers: { routes: 'Route::resource', controller: 'resource methods', model: 'hasMany user tasks', view: 'mail Blade view', security: 'auth middleware, Mailable' },
  lessons: [
    {
      id: 'resource', title: 'Resource routes and controllers', sub: 'One line, seven routes',
      lead: 'Full CRUD is a complete record workflow. Laravel resource routes give the create, read, update and delete actions a standard URL and method pattern.',
      plain: 'Route::resource is a set menu: order it once and you get all seven CRUD routes, each with a predictable name.',
      code: [{
        name: 'Terminal', lang: 'sh',
        src: R`php artisan make:controller TaskController --resource --model=Task
# INFO Controller created successfully.

php artisan route:list --name=tasks`,
        notes: [
          ['--resource --model=Task', 'Generate the CRUD methods', 'Creates TaskController with the standard method names, already type-hinted with the Task model.'],
          ['route:list --name=tasks', 'Check the route table', 'Register the resource route first, then list the routes named tasks.*.']
        ]
      }, {
        name: 'web.php', path: 'routes/web.php', lang: 'php',
        src: R`use App\Http\Controllers\TaskController;

Route::resource('tasks', TaskController::class);`,
        notes: [["Route::resource('tasks'", 'One line registers seven routes', 'Writing manual routes that duplicate these is a listed mistake.']]
      }],
      body: [
        ['table', ['Method', 'URI', 'Route name', 'Controller method'], [
          ['GET', '`/tasks`', '`tasks.index`', '`index`: list records'],
          ['GET', '`/tasks/create`', '`tasks.create`', '`create`: show the add form'],
          ['POST', '`/tasks`', '`tasks.store`', '`store`: validate and save'],
          ['GET', '`/tasks/{task}`', '`tasks.show`', '`show`: one record'],
          ['GET', '`/tasks/{task}/edit`', '`tasks.edit`', '`edit`: show the edit form'],
          ['PUT/PATCH', '`/tasks/{task}`', '`tasks.update`', '`update`: save changes'],
          ['DELETE', '`/tasks/{task}`', '`tasks.destroy`', '`destroy`: remove the record']
        ], 'The resource route table'],
        ['note', 'Resource controllers make CRUD easier because every action has a predictable URL, route name and method. Teams can read each other’s controllers faster.', 'Key idea']
      ],
      check: { q: 'Which route name does `DELETE /tasks/{task}` get from Route::resource?', o: ['tasks.destroy', 'tasks.delete', 'tasks.remove', 'tasks.update'], a: 0, why: 'The seventh resource route is tasks.destroy, handled by destroy().' },
      watch: ['Manual routes duplicating resource routes'],
      twin: 'resource-routes'
    },
    {
      id: 'resource-methods', title: 'Resource controller methods', sub: 'index, create/store, show/edit, update, destroy',
      lead: 'Laravel expects resource controllers to use standard method names, so every CRUD action lives in a predictable place.',
      code: [{
        name: 'TaskController.php', path: 'app/Http/Controllers/TaskController.php', lang: 'php',
        src: R`public function index()
{
    $tasks = Task::latest()->get();

    return view('tasks.index', [
        'tasks' => $tasks,
    ]);
}

public function store(Request $request)
{
    $validated = $request->validate([
        'title' => ['required', 'string', 'max:100'],
    ]);

    Task::create($validated);

    return redirect()->route('tasks.index');
}

public function show(Task $task)
{
    return view('tasks.show', compact('task'));
}

public function edit(Task $task)
{
    return view('tasks.edit', compact('task'));
}`,
        notes: [
          ['Task::latest()->get()', 'index: read many', 'latest() sorts newest first, and get() runs the query.'],
          ['public function store', 'create shows, store saves', 'create() returns the form view. store() validates, creates and redirects.'],
          ['public function show(Task $task)', 'show: one record', 'Commonly returns tasks.show. Receives the Task from the route.'],
          ['public function edit(Task $task)', 'edit: the form for one record', 'Commonly returns tasks.edit. Both show and edit prepare one $task variable for Blade.']
        ]
      }, {
        name: 'destroy()', path: 'app/Http/Controllers/TaskController.php', lang: 'php', added: true,
        src: R`public function destroy(Task $task)
{
    $task->delete();

    return redirect()->route('tasks.index');
}`,
        notes: [['$task->delete()', 'destroy: remove the record', 'The slides list destroy in the route table without showing its code. This is the usual body.']]
      }, {
        name: 'Delete button', path: 'resources/views/tasks/index.blade.php', lang: 'blade', added: true,
        src: R`<form method="POST" action="{{ route('tasks.destroy', $task) }}">
    @csrf
    @method('DELETE')
    <button type="submit">Delete</button>
</form>`,
        notes: [["@method('DELETE')", 'Delete with a form, not a link', 'Same rule as CodeIgniter: destructive work never goes through a GET link.']]
      }],
      check: { q: 'Which resource method shows the form for editing one existing record?', o: ['edit', 'update', 'show', 'create'], a: 0, why: 'edit shows the form, update saves it.' },
      twin: 'update-delete'
    },
    {
      id: 'breeze', title: 'Guided auth scaffolding', sub: 'Laravel Breeze',
      lead: 'Authentication checks who the user is. After login, Laravel stores the user’s authenticated state in the session. The classroom scaffold builds the login pages for you.',
      code: [{
        name: 'Terminal', lang: 'sh',
        src: R`composer require laravel/breeze --dev
php artisan breeze:install blade
php artisan migrate
npm install
npm run dev`,
        notes: [
          ['laravel/breeze', 'Install the scaffold package', 'A development dependency that generates auth pages.'],
          ['breeze:install blade', 'Generate Blade auth pages', 'Login, register and the auth routes.'],
          ['php artisan migrate', 'Create the users table', 'Breeze needs the users and session tables.'],
          ['npm install', 'Frontend assets', 'Installs and builds the CSS and JS the auth pages use.']
        ]
      }],
      body: [
        ['table', ['Job', 'CodeIgniter (M4)', 'Laravel (M8)'], [
          ['Login code', 'Manual login controller', 'Auth scaffolding routes'],
          ['Login state', 'Session stores user data', 'Session-backed web auth'],
          ['Checking access', 'Filter checks the session', '`auth` middleware'],
          ['Guests', 'Redirect guests away', 'Protected route groups']
        ], 'CI vs. Laravel auth map']
      ],
      check: { q: 'Which command generates Breeze’s Blade auth pages?', o: ['php artisan breeze:install blade', 'php artisan make:auth', 'composer require laravel/blade', 'php artisan auth:install'], a: 0, why: 'After composer require laravel/breeze --dev, run php artisan breeze:install blade.' }
    },
    {
      id: 'protect', title: 'Protecting routes with auth middleware', sub: "Route::middleware('auth')",
      lead: 'Protected routes require the user to be logged in before the page loads. The task manager should not let guests manage private records.',
      plain: 'Same guard at the same door as the CodeIgniter Filter, but Laravel hires the guard for you. You only say which routes it stands in front of.',
      flow: guarded('middleware'),
      code: [{
        name: 'web.php', path: 'routes/web.php', lang: 'php',
        src: R`Route::middleware('auth')->group(function () {
    Route::resource('tasks', TaskController::class);
});

Route::get('/dashboard', function () {
    return view('dashboard');
})->middleware('auth')->name('dashboard');`,
        notes: [
          ["Route::middleware('auth')->group", 'Protect a group of routes', "Laravel's built-in version of your CodeIgniter AuthFilter. Every route inside the group requires login."],
          ["Route::resource('tasks'", 'All seven CRUD routes', 'index, create, store, show, edit, update and destroy are all inside the auth group.'],
          ["->middleware('auth')->name", 'Protect a single route', 'Without a group, add ->middleware(\'auth\') to one route.']
        ]
      }],
      body: [['p', 'Guests are redirected before protected pages load. The same CRUD feature now has login protection.']],
      check: { q: 'Which line protects all seven task routes at once?', o: ["Route::middleware('auth')->group(function () { ... });", "Route::resource('tasks', TaskController::class);", "->name('dashboard')", 'php artisan route:list'], a: 0, why: 'Every route registered inside the auth group requires login. Route::resource alone does not.' },
      watch: ['Missing auth middleware'],
      twin: 'require-login'
    },
    {
      id: 'ownership', title: 'Connecting tasks to the logged-in user', sub: 'hasMany and $request->user()',
      lead: 'After auth, save tasks through the user’s tasks() relationship, and show only the current user’s records.',
      flow: guarded(['controller', 'model']),
      code: [{
        name: 'Relationship', path: 'migration + app/Models/User.php', lang: 'php',
        src: R`// In the tasks migration:
$table->foreignId('user_id')->constrained();

// In User.php:
public function tasks()
{
    return $this->hasMany(Task::class);
}`,
        notes: [
          ["foreignId('user_id')", 'Link each task to a user', 'Adds a user_id column that references the users table.'],
          ['hasMany(Task::class)', 'One user, many tasks', 'Defines $user->tasks().']
        ]
      }, {
        name: 'TaskController.php', path: 'app/Http/Controllers/TaskController.php', lang: 'php',
        src: R`public function store(Request $request)
{
    $validated = $request->validate([
        'title' => ['required', 'string', 'max:100'],
    ]);

    $request->user()->tasks()->create($validated);

    return redirect()->route('tasks.index');
}

public function index(Request $request)
{
    $tasks = $request->user()
        ->tasks()
        ->latest()
        ->get();

    return view('tasks.index', compact('tasks'));
}`,
        notes: [
          ['$request->user()->tasks()->create', 'Save through the relationship', 'Laravel fills user_id automatically with the logged-in user’s id.'],
          ['$tasks = $request->user()', 'The logged-in user', '$request->user() is the user the auth middleware already confirmed.'],
          ['->tasks()', 'Only this user’s records', 'Because tasks() is defined on User, Laravel automatically filters by user_id. Showing all users’ records is a listed mistake.']
        ]
      }],
      check: { q: "Why does `$request->user()->tasks()->get()` show only the current user's tasks?", o: ['tasks() is a hasMany relationship, so Laravel filters by user_id', 'The auth middleware deletes other users’ tasks', 'get() always filters by session', 'Blade hides other tasks'], a: 0, why: 'The relationship adds WHERE user_id = the current user automatically.' },
      watch: ['Showing all users’ records']
    },
    {
      id: 'mail-setup', title: 'Configuring mail and a Mailable', sub: '.env SMTP and make:mail',
      lead: 'Configure mail in .env before sending messages, then generate a mailable class that describes the email Laravel will send.',
      code: [{
        name: '.env', lang: 'env',
        src: 'MAIL_MAILER=smtp\nMAIL_HOST=smtp.example.test\nMAIL_PORT=587\nMAIL_USERNAME=your_username\nMAIL_PASSWORD=your_password\nMAIL_FROM_ADDRESS="noreply@example.test"\nMAIL_FROM_NAME="${APP_NAME}"',
        notes: [
          ['MAIL_MAILER=smtp', 'Mail transport', 'Choose SMTP as the way mail is sent.'],
          ['MAIL_PASSWORD', 'Test credentials only', 'Use test SMTP credentials. Real SMTP secrets in screenshots is a listed mistake.'],
          ['MAIL_FROM_NAME', 'Sender name', 'Reuses APP_NAME.']
        ]
      }, {
        name: 'Terminal', lang: 'sh',
        src: R`php artisan make:mail TaskCompletedMail --markdown=mail.tasks.completed
# Created files:
# app/Mail/TaskCompletedMail.php
# resources/views/mail/tasks/completed.blade.php`,
        notes: [['make:mail', 'Generate the mailable', 'Creates the class and its markdown Blade view.']]
      }, {
        name: 'TaskCompletedMail.php', path: 'app/Mail/TaskCompletedMail.php', lang: 'php',
        src: R`use App\Models\Task;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;

class TaskCompletedMail extends Mailable
{
    public function __construct(public Task $task) {}

    public function content(): Content
    {
        return new Content(markdown: 'mail.tasks.completed');
    }
}`,
        notes: [
          ['public Task $task', 'The mailable receives the task', 'A public property is available inside the email view as $task.'],
          ["markdown: 'mail.tasks.completed'", 'Choose the email view', 'Points to resources/views/mail/tasks/completed.blade.php.']
        ]
      }],
      body: [
        ['table', ['Command or setting', 'What it does'], [
          ['`php artisan make:mail TaskCompletedMail`', 'Create a mailable class'],
          ['`MAIL_MAILER=smtp`', 'Choose the mail transport'],
          ['`Mail::to(...)->send(...)`', 'Send a mailable to one recipient'],
          ['`php artisan vendor:publish --tag=laravel-mail`', 'Customize mail views when needed']
        ], 'Email commands']
      ],
      check: { q: 'Which class does TaskCompletedMail extend?', o: ['Mailable', 'Controller', 'Model', 'Notification'], a: 0, why: 'class TaskCompletedMail extends Mailable.' }
    },
    {
      id: 'mail-send', title: 'Sending the completion email', sub: 'Mail::to()->send() and wasChanged()',
      lead: 'The email body is still a Blade file, but it uses mail components. Send it after the update succeeds, and only when the status actually changed.',
      code: [{
        name: 'completed.blade.php', path: 'resources/views/mail/tasks/completed.blade.php', lang: 'blade',
        src: R`<x-mail::message>
# Task Completed

The task **{{ $task->title }}** was marked complete.

<x-mail::button :url="route('tasks.show', $task)">
View Task
</x-mail::button>
</x-mail::message>`,
        notes: [
          ['<x-mail::message>', 'Mail components', 'Laravel’s mail layout.'],
          ['{{ $task->title }}', 'Data from the mailable', '$task comes from the public property on TaskCompletedMail.'],
          ['<x-mail::button', 'A button link', 'Links back to the task page.']
        ]
      }, {
        name: 'TaskController.php', path: 'app/Http/Controllers/TaskController.php', lang: 'php',
        src: R`use App\Mail\TaskCompletedMail;
use Illuminate\Support\Facades\Mail;

$task->update($validated);

if ($task->wasChanged('status') && $task->status === 'done') {
    Mail::to($request->user()->email)
        ->send(new TaskCompletedMail($task));
}

return back()->with('status', 'Status updated');`,
        notes: [
          ['$task->update($validated)', 'Update first', 'Send after the update succeeds. Emails sent before the update succeeds is a listed mistake.'],
          ["wasChanged('status')", 'Send important emails once', 'True only if this update really changed the status, so refreshing the page does not send a second email.'],
          ['Mail::to(', 'Send to the logged-in user', 'Mail::to(...)->send(new TaskCompletedMail($task)).'],
          ["back()->with('status'", 'A one-time message', 'Flashes "Status updated" for the next page, like setFlashdata in CodeIgniter.']
        ]
      }],
      body: [['note', 'Send important emails once, keep sensitive data out of them, and test with safe mail settings.', 'Notification design']],
      check: { q: 'Why check `$task->wasChanged(\'status\')` before sending?', o: ['So the email is sent once, only when the status actually changed', 'To validate the title', 'To make the update faster', 'Because Mail::to() requires it'], a: 0, why: 'Without it, saving an already-done task again (or a page refresh) would send another email.' },
      twin: 'flash'
    }
  ],
  mistakes: [
    'Manual routes duplicating resource routes',
    'Missing auth middleware',
    'Showing all users’ records',
    'Real SMTP secrets in screenshots',
    'Emails sent before the update succeeds'
  ],
  takeaways: [
    'Route::resource maps CRUD',
    'Resource methods are predictable',
    'auth protects pages',
    '.env stores mail settings',
    'Trigger emails responsibly'
  ],
  quiz: [
    { t: 'id', q: 'Type the Artisan command that creates a resource controller for the Task model.', a: 'php artisan make:controller TaskController --resource --model=Task', alt: ['php artisan make:controller TaskController --model=Task --resource'], why: '`php artisan make:controller TaskController --resource --model=Task`.', l: 'resource' },
    { t: 'fill', q: 'Register all CRUD routes for tasks.', code: "Route::________('tasks', TaskController::class);", a: 'resource', why: 'Route::resource registers seven routes.', l: 'resource' },
    { t: 'mcq', q: 'How many routes does Route::resource register?', o: ['7', '4', '5', '9'], a: 0, why: 'index, create, store, show, edit, update, destroy.', l: 'resource' },
    { t: 'mcq', q: 'Which method and URI does tasks.store use?', o: ['POST /tasks', 'GET /tasks/create', 'PUT /tasks/{task}', 'POST /tasks/store'], a: 0, why: 'store receives POST /tasks.', l: 'resource' },
    { t: 'mcq', q: 'Which route shows the add-task form?', o: ['GET /tasks/create (tasks.create)', 'POST /tasks (tasks.store)', 'GET /tasks/{task}/edit (tasks.edit)', 'GET /tasks (tasks.index)'], a: 0, why: 'create shows the form; store saves it.', l: 'resource' },
    { t: 'mcq', q: 'Which HTTP methods does tasks.update accept?', o: ['PUT/PATCH', 'POST only', 'GET', 'DELETE'], a: 0, why: 'PUT/PATCH /tasks/{task}.', l: 'resource' },
    { t: 'order', q: 'Match the resource flow for adding a task in order.', o: ['GET /tasks/create shows the form', 'POST /tasks runs store()', 'store() validates the input', 'Task::create() saves it', "redirect()->route('tasks.index')"], why: 'create shows, store validates, saves and redirects.', l: 'resource-methods' },
    { t: 'mcq', q: 'What does `Task::latest()->get()` return?', o: ['All tasks, newest first', 'Only the newest task', 'Tasks from today only', 'The number of tasks'], a: 0, why: 'latest() orders by created_at descending; get() runs it.', l: 'resource-methods' },
    { t: 'tf', q: 'show() and edit() can both receive the Task model from the route.', a: true, why: 'True: show(Task $task) and edit(Task $task).', l: 'resource-methods' },
    { t: 'id', q: 'Type the Composer command that installs Laravel Breeze as a dev dependency.', a: 'composer require laravel/breeze --dev', why: '`composer require laravel/breeze --dev`.', l: 'breeze' },
    { t: 'mcq', q: 'After a user logs in with Breeze, where does Laravel keep the authenticated state?', o: ['In the session', 'In .env', 'In the routes file', 'In the users table password column'], a: 0, why: 'Laravel web auth is session-backed.', l: 'breeze' },
    { t: 'mcq', q: 'What is Laravel’s equivalent of CodeIgniter’s AuthFilter?', o: ['The auth middleware', 'Blade', 'Breeze’s npm run dev', 'The Task model'], a: 0, why: "Route::middleware('auth') does the Filter's job.", l: 'protect' },
    { t: 'fill', q: 'Protect every task route.', code: "Route::__________('auth')->group(function () {\n    Route::resource('tasks', TaskController::class);\n});", a: 'middleware', why: "Route::middleware('auth')->group(...).", l: 'protect' },
    { t: 'mcq', q: 'What happens when a guest opens a route inside the auth middleware group?', o: ['They are redirected before the protected page loads', 'They see an empty page', 'The controller runs without a user', 'Laravel creates an account'], a: 0, why: 'Guests are redirected to log in before the controller runs.', l: 'protect' },
    { t: 'mcq', q: 'Which migration line links each task to a user?', o: ["$table->foreignId('user_id')->constrained();", "$table->string('user');", "$table->belongsTo('users');", "$table->id('user_id');"], a: 0, why: 'foreignId()->constrained() references the users table.', l: 'ownership' },
    { t: 'id', q: 'Type the relationship method User::tasks() returns (for example, $this->...(Task::class)).', a: 'hasMany', alt: ['hasMany()', '$this->hasMany(Task::class)', 'hasMany(Task::class)'], why: 'return $this->hasMany(Task::class);', l: 'ownership' },
    { t: 'mcq', q: 'Which store() line saves a task for the logged-in user?', o: ['$request->user()->tasks()->create($validated);', 'Task::create($validated);', 'Task::all()->create($validated);', 'session()->set(\'task\', $validated);'], a: 0, why: 'Saving through the relationship fills user_id automatically.', l: 'ownership' },
    { t: 'id', q: 'Type the .env key that chooses the mail transport.', a: 'MAIL_MAILER', why: 'MAIL_MAILER=smtp.', l: 'mail-setup' },
    { t: 'id', q: 'Type the Artisan command that creates TaskCompletedMail with a markdown view at mail.tasks.completed.', a: 'php artisan make:mail TaskCompletedMail --markdown=mail.tasks.completed', why: 'make:mail with --markdown creates the class and its view.', l: 'mail-setup' },
    { t: 'mcq', q: 'Which command lets you customize Laravel’s mail views?', o: ['php artisan vendor:publish --tag=laravel-mail', 'php artisan mail:views', 'npm run mail', 'php artisan make:mail --publish'], a: 0, why: 'vendor:publish copies the mail views into your project.', l: 'mail-setup' },
    { t: 'mcq', q: 'Which call sends the mailable to the logged-in user?', o: ['Mail::to($request->user()->email)->send(new TaskCompletedMail($task));', 'TaskCompletedMail::send($task);', 'mail($task);', "Mail::send('tasks.completed');"], a: 0, why: 'Mail::to(...)->send(new Mailable(...)).', l: 'mail-send' },
    { t: 'tf', q: 'The completion email should be sent before $task->update() runs.', a: false, why: 'False. Send after the update succeeds, or users get emails for changes that failed.', l: 'mail-send' },
    { t: 'mcq', q: "What does `back()->with('status', 'Status updated')` do?", o: ['Redirects back and flashes a one-time status message', 'Saves status in .env', 'Sends an email', 'Updates the task status'], a: 0, why: 'with() flashes data for the next request, like setFlashdata.', l: 'mail-send' },
    { t: 'mcq', q: 'Which Blade component wraps a markdown email?', o: ['<x-mail::message>', '<mail>', '@mail', '<x-email>'], a: 0, why: '<x-mail::message> ... </x-mail::message>.', l: 'mail-send' }
  ]
};
