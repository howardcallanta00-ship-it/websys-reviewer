// CodeIgniter 4 <-> Laravel side by side. Each side: [file label, lang, source].
const R = String.raw;

export const VERDICTS = {
  same: 'Same idea, same name',
  renamed: 'Renamed',
  syntax: 'Different syntax',
  approach: 'Different approach',
  builtin: 'Built in'
};

export const CONCEPTS = [
  {
    id: 'routes-file', name: 'Where routes live', mods: ['m1', 'm5'], verdict: 'renamed',
    summary: 'Both frameworks keep every URL-to-code mapping in one file. Only the file and the syntax change.',
    ci: ['app/Config/Routes.php', 'php', R`$routes->get('/about', 'Pages::about');`],
    lv: ['routes/web.php', 'php', R`use App\Http\Controllers\PageController;

Route::get('/about', [PageController::class, 'about']);`],
    same: 'One file maps an HTTP method and a URL to a controller method.',
    diff: "CodeIgniter uses a `'Class::method'` string. Laravel uses an array of the class and the method name, and the controller must be imported with `use`."
  },
  {
    id: 'controller-class', name: 'Writing a controller', mods: ['m1', 'm5'], verdict: 'syntax',
    summary: 'A controller is a class whose public methods are actions.',
    ci: ['app/Controllers/Pages.php', 'php', R`namespace App\Controllers;

class Pages extends BaseController
{
    public function about()
    {
        return view('about');
    }
}`],
    lv: ['app/Http/Controllers/PageController.php', 'php', R`namespace App\Http\Controllers;

class PageController extends Controller
{
    public function about()
    {
        return view('about');
    }
}`],
    same: 'A class with public methods that return a view. view() works the same way.',
    diff: 'Laravel controllers live in `app/Http/Controllers`, extend `Controller` instead of `BaseController`, and are usually generated with `php artisan make:controller`.'
  },
  {
    id: 'route-params', name: 'Route parameters', mods: ['m1', 'm5'], verdict: 'syntax',
    summary: 'Capturing part of the URL, like the 15 in /tasks/15, and handing it to the controller method.',
    ci: ['app/Config/Routes.php', 'php', R`$routes->get('/tasks/(:num)', 'Tasks::show/$1');`],
    lv: ['routes/web.php', 'php', R`Route::get('/tasks/{id}', [TaskController::class, 'show']);`],
    same: 'The captured value arrives as the method argument, as in `show($id)`.',
    diff: 'CodeIgniter uses placeholders like `(:num)` and passes them as `$1`. Laravel names the parameter in braces: `{id}`.'
  },
  {
    id: 'print-view', name: 'Printing data in a view', mods: ['m2', 'm5'], verdict: 'syntax',
    summary: 'Both controllers pass a $data array to view(). The template syntax for printing safely is what changes.',
    ci: ['app/Views/about.php', 'blade', R`<h1><?= esc($name) ?></h1>

<?php foreach ($tasks as $task): ?>
    <li><?= esc($task['title']) ?></li>
<?php endforeach; ?>`],
    lv: ['resources/views/about.blade.php', 'blade', R`<h1>{{ $name }}</h1>

@foreach ($tasks as $task)
    <li>{{ $task->title }}</li>
@endforeach`],
    same: "`view('about', $data)` in the controller. Each array key becomes a variable in the view.",
    diff: 'CodeIgniter needs `esc()` to print safely and reads rows as arrays. Blade’s `{{ }}` escapes automatically, and Eloquent rows are objects (`$task->title`). Use `{!! !!}` only for trusted HTML.'
  },
  {
    id: 'cli', name: 'Command-line tool', mods: ['m1', 'm5'], verdict: 'renamed',
    summary: 'Start the development server and list your routes.',
    ci: ['Terminal', 'sh', R`php spark serve
php spark routes`],
    lv: ['Terminal', 'sh', R`php artisan serve
php artisan route:list`],
    same: 'A PHP command-line tool that ships with the framework.',
    diff: 'Spark serves on port 8080 and Artisan on port 8000. Artisan also generates files: `make:controller`, `make:model`, `make:seeder`, `make:request`, `make:mail` and more.'
  },
  {
    id: 'env-db', name: 'Database settings', mods: ['m2', 'm6'], verdict: 'syntax',
    summary: 'Both keep the connection settings in .env, outside the application code.',
    ci: ['.env', 'env', R`database.default.hostname = localhost
database.default.database = your_database_name
database.default.username = root
database.default.password =
database.default.DBDriver = MySQLi`],
    lv: ['.env', 'env', R`DB_CONNECTION=sqlite
# For MySQL, change the connection values,
# for example DB_CONNECTION=mysql and DB_DATABASE=...`],
    same: 'Credentials and connection details stay in `.env`, never hardcoded or committed.',
    diff: 'CodeIgniter uses dotted keys like `database.default.database`. Laravel uses `DB_*` keys, and the classroom setup uses a single SQLite file.'
  },
  {
    id: 'schema', name: 'Creating the table', mods: ['m2', 'm6'], verdict: 'approach',
    summary: 'How the tasks table gets its columns.',
    ci: ['phpMyAdmin › SQL', 'sql', R`CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at DATETIME
);`],
    lv: ['database/migrations/..._create_tasks_table.php', 'php', R`Schema::create('tasks', function (Blueprint $table) {
    $table->id();
    $table->string('title', 150);
    $table->string('status', 20)->default('pending');
    $table->timestamps();
});`],
    same: 'Same columns and types.',
    diff: 'The CodeIgniter modules run SQL by hand in phpMyAdmin. Laravel writes a migration and runs `php artisan migrate`, so every machine can rebuild the same schema. Sample rows come from a seeder.'
  },
  {
    id: 'fillable', name: 'Fields a model may save', mods: ['m2', 'm6'], verdict: 'renamed',
    summary: 'A whitelist of columns that can be saved from user input. Forget a column and saves quietly skip it.',
    ci: ['app/Models/TaskModel.php', 'php', R`class TaskModel extends Model
{
    protected $table = 'tasks';
    protected $allowedFields = ['title', 'status'];
}`],
    lv: ['app/Models/Task.php', 'php', R`class Task extends Model
{
    protected $fillable = ['title', 'status'];
}`],
    same: 'An array of column names on the model class. It protects create and update.',
    diff: '`$allowedFields` in CodeIgniter, `$fillable` in Laravel. Laravel finds the `tasks` table from the model name `Task` by convention, so there is no `$table` here.'
  },
  {
    id: 'get-all', name: 'Get all records', mods: ['m2', 'm6'], verdict: 'renamed',
    summary: 'Read every row of the tasks table through the model.',
    ci: ['Tasks.php', 'php', R`$model = new TaskModel();
$tasks = $model->findAll();`],
    lv: ['TaskController.php', 'php', R`$tasks = Task::all();`],
    same: 'You get back every row, ready to pass to a view.',
    diff: 'CodeIgniter creates a model object and calls `findAll()`. Laravel calls `Task::all()` statically and returns Task objects.'
  },
  {
    id: 'filter-sort', name: 'Filter and sort', mods: ['m2', 'm6'], verdict: 'syntax',
    summary: 'Only pending tasks, newest first.',
    ci: ['Tasks.php', 'php', R`$tasks = $model
    ->where('status', 'pending')
    ->orderBy('created_at', 'DESC')
    ->findAll();`],
    lv: ['TaskController.php', 'php', R`$tasks = Task::where('status', 'pending')
    ->orderBy('created_at', 'desc')
    ->get();`],
    same: '`where()` and `orderBy()` with the same arguments, chained.',
    diff: 'CodeIgniter ends the chain with `findAll()`. Laravel ends it with `get()`.'
  },
  {
    id: 'find-or-404', name: 'One record or a 404', mods: ['m2', 'm6'], verdict: 'approach',
    summary: 'Fetch one task by id and show a not-found page if it does not exist.',
    ci: ['Tasks.php', 'php', R`$task = $model->find($id);

if ($task === null) {
    throw new PageNotFoundException();
}`],
    lv: ['TaskController.php', 'php', R`$task = Task::findOrFail($id);`],
    same: 'Look up by primary key, and a missing record becomes a 404.',
    diff: 'CodeIgniter’s `find()` returns null and you check it yourself. Laravel’s `findOrFail()` does the 404 for you. With route model binding (`show(Task $task)`) you do not even call it.'
  },
  {
    id: 'csrf', name: 'CSRF token in a form', mods: ['m3', 'm7'], verdict: 'renamed',
    summary: 'A hidden token that protects POST forms against cross-site request forgery.',
    ci: ['app/Views/tasks/new.php', 'blade', R`<form method="post" action="<?= site_url('tasks') ?>">
    <?= csrf_field() ?>
</form>`],
    lv: ['resources/views/tasks/create.blade.php', 'blade', R`<form method="POST" action="{{ route('tasks.store') }}">
    @csrf
</form>`],
    same: 'Goes inside the form and adds a hidden token field.',
    diff: "A helper function in CodeIgniter, a Blade directive in Laravel. CodeIgniter builds the URL with `site_url()`, Laravel with a named `route()`."
  },
  {
    id: 'validate', name: 'Validating input', mods: ['m3', 'm7'], verdict: 'approach',
    summary: 'Check the submitted form before anything is saved.',
    ci: ['Tasks.php', 'php', R`$rules = ['title' => 'required|min_length[3]|max_length[150]'];

if (! $this->validate($rules)) {
    return redirect()->back()->withInput();
}`],
    lv: ['TaskController.php', 'php', R`$validated = $request->validate([
    'title' => ['required', 'string', 'max:100'],
]);`],
    same: 'Rules per field, checked in the controller, before saving.',
    diff: 'CodeIgniter uses pipe strings like `max_length[150]` and you write the redirect yourself. Laravel uses arrays like `max:100` and redirects back with errors and old input automatically.'
  },
  {
    id: 'field-error', name: 'Showing a field error', mods: ['m3', 'm7'], verdict: 'syntax',
    summary: 'Print the validation message next to the field that failed.',
    ci: ['tasks/new.php', 'blade', R`<input name="title" value="<?= old('title') ?>">
<?= validation_show_error('title') ?>`],
    lv: ['tasks/create.blade.php', 'blade', R`<input name="title" value="{{ old('title') }}">
@error('title') {{ $message }} @enderror`],
    same: "`old('title')` keeps what the user typed. It is the same helper in both frameworks.",
    diff: "`validation_show_error('title')` in CodeIgniter. `@error('title')` with `{{ $message }}` in Blade."
  },
  {
    id: 'update-delete', name: 'Updating and deleting', mods: ['m3', 'm7', 'm8'], verdict: 'syntax',
    summary: 'Change or remove one existing task.',
    ci: ['Tasks.php', 'php', R`$model = new TaskModel();

$model->update($id, [
    'title' => $this->request->getPost('title'),
]);

$model->delete($id);`],
    lv: ['TaskController.php', 'php', R`public function update(Request $request, Task $task)
{
    $task->update($validated);
}

public function destroy(Task $task)
{
    $task->delete();   // added for clarity
}`],
    same: 'Validate first. Destructive work goes through a form (POST, PATCH or DELETE), never a GET link.',
    diff: "CodeIgniter passes the id to the model: `update($id, ...)`, `delete($id)`. Laravel receives the Task through route model binding and calls methods on it. Forms add `@method('PATCH')` or `@method('DELETE')`."
  },
  {
    id: 'resource-routes', name: 'CRUD routes', mods: ['m3', 'm7', 'm8'], verdict: 'builtin',
    summary: 'All the routes a task manager needs.',
    ci: ['app/Config/Routes.php', 'php', R`$routes->get('/tasks', 'Tasks::index');
$routes->get('/tasks/new', 'Tasks::new');
$routes->post('/tasks', 'Tasks::create');
$routes->get('/tasks/(:num)', 'Tasks::show/$1');
// ...edit, update and delete routes written by hand`],
    lv: ['routes/web.php', 'php', R`Route::resource('tasks', TaskController::class);`],
    same: 'Each CRUD action has a URL, an HTTP method and a controller method.',
    diff: 'In CodeIgniter (as taught) you write each route. Laravel’s `Route::resource` registers all seven (index, create, store, show, edit, update, destroy) with predictable names like `tasks.store`.'
  },
  {
    id: 'store-file', name: 'Storing an uploaded file', mods: ['m3', 'm7'], verdict: 'approach',
    summary: 'Save the uploaded file somewhere public and keep only its name or path in the database.',
    ci: ['Tasks.php', 'php', R`$file = $this->request->getFile('attachment');
$newName = $file->getRandomName();
$file->move(FCPATH . 'uploads', $newName);

$model->update($id, ['attachment' => $newName]);`],
    lv: ['TaskController.php', 'php', R`$path = $request->file('attachment')
    ->store('attachments', 'public');

$task->update(['attachment' => $path]);
# once per project: php artisan storage:link`],
    same: 'Validate first, never trust the original filename, store only the name or path.',
    diff: "CodeIgniter moves the file into `public/uploads` yourself. Laravel's `store()` generates the name and saves to the public disk, served through /storage after `storage:link`."
  },
  {
    id: 'show-file', name: 'Displaying an uploaded image', mods: ['m3', 'm7'], verdict: 'syntax',
    summary: 'Turn the stored name or path into an image URL.',
    ci: ['tasks/show.php', 'blade', R`<?php $url = base_url('uploads/' . $task['attachment']); ?>
<img src="<?= esc($url, 'attr') ?>">`],
    lv: ['tasks/show.blade.php', 'blade', R`@if ($task->attachment)
    <img src="{{ asset('storage/'.$task->attachment) }}" alt="Task attachment">
@endif`],
    same: 'The database holds only a name or path, and the view builds the public URL.',
    diff: "`base_url('uploads/...')` in CodeIgniter, `asset('storage/...')` in Laravel."
  },
  {
    id: 'flash', name: 'One-time message after a redirect', mods: ['m4', 'm8'], verdict: 'syntax',
    summary: 'Show "Task added" or "Status updated" once, on the next page.',
    ci: ['Tasks.php', 'php', R`session()->setFlashdata('message', 'Task added successfully!');
return redirect()->to('/tasks');`],
    lv: ['TaskController.php', 'php', R`return back()->with('status', 'Status updated');`],
    same: 'The message survives exactly one more request, then disappears.',
    diff: "CodeIgniter sets flash data on the session before redirecting. Laravel chains `->with()` onto the redirect."
  },
  {
    id: 'require-login', name: 'Requiring login', mods: ['m4', 'm8'], verdict: 'builtin',
    summary: 'Redirect guests to the login page before a protected controller runs.',
    ci: ['app/Config/Routes.php', 'php', R`// AuthFilter + alias 'auth' in app/Config/Filters.php
$routes->get('/tasks', 'Tasks::index', [
    'filter' => 'auth',
]);`],
    lv: ['routes/web.php', 'php', R`Route::middleware('auth')->group(function () {
    Route::resource('tasks', TaskController::class);
});`],
    same: 'The check runs before the controller, and protection is attached to routes.',
    diff: 'In CodeIgniter you write AuthFilter, register the auth alias and attach it per route. Laravel ships the `auth` middleware, Breeze builds the login pages, and one group protects many routes.'
  },
  {
    id: 'login', name: 'Logging users in', mods: ['m4', 'm8'], verdict: 'builtin',
    summary: 'Checking a username and password and remembering the user.',
    ci: ['app/Controllers/Auth.php', 'php', R`$user = $model->where('username', $username)->first();

if ($user && password_verify($password, $user['password'])) {
    session()->set(['isLoggedIn' => true, 'user_id' => $user['id']]);
}`],
    lv: ['Terminal', 'sh', R`composer require laravel/breeze --dev
php artisan breeze:install blade
php artisan migrate`],
    same: 'Passwords are stored as hashes, and login state lives in the session.',
    diff: 'CodeIgniter (M4) builds the login controller by hand with `password_hash()` and `password_verify()`. Laravel (M8) generates it with Breeze, and `$request->user()` gives you the logged-in user.'
  }
];
