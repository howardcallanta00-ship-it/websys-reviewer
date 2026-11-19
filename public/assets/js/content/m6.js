import { flow } from './flows.js';
const R = String.raw;

export default {
  id: 'm6', code: 'M6', track: 'lv',
  title: 'Laravel Data Layer',
  summary: 'Configure the database in .env, create tables with migrations, fill them with seeders, and read records with Eloquent models into Blade views.',
  objectives: [
    'Configure Laravel database settings in .env',
    'Create tables using migrations',
    'Populate sample records using seeders',
    'Retrieve records with Eloquent models',
    'Display database records through controllers and Blade views'
  ],
  layers: { routes: '/tasks, /tasks/{id}', controller: 'Task::all(), findOrFail()', model: 'migrations, seeders, Eloquent', view: '@foreach, @if', security: '$fillable, Tinker checks' },
  lessons: [
    {
      id: 'db-setup', title: 'The data layer turns pages into applications', sub: '.env and the files you touch',
      lead: 'Laravel keeps database settings in .env, table structure in migrations, sample data in seeders, and record logic in Eloquent models. Eloquent is the counterpart of CodeIgniter Models.',
      flow: flow('lv', 'db', { keys: ['controller', 'model', 'db'] }),
      body: [
        ['p', 'For a simple classroom setup, **SQLite** keeps everything inside one file. For MySQL, the same Laravel code works after changing the connection values in `.env`.'],
        ['table', ['File or folder', 'Its job'], [
          ['`.env`', 'Connection settings'],
          ['`database/migrations/`', 'Table structure (schema)'],
          ['`database/seeders/`', 'Sample data'],
          ['`app/Models/`', 'Record logic (Eloquent models)'],
          ['`app/Http/Controllers/`', 'Fetch records and pass them on'],
          ['`resources/views/`', 'Display the records'],
          ['`routes/web.php`', 'Connect URLs to controllers']
        ], 'Database files you touch'],
        ['note', 'Laravel database work is easiest when you can say which file owns each job: settings, schema, sample data, model, controller or view. Knowing this prevents database code from ending up inside views.', 'Key idea']
      ],
      code: [{
        name: 'Terminal (Windows)', lang: 'sh',
        src: R`type nul > database\database.sqlite
php artisan migrate
# INFO Preparing database.
# INFO Running migrations.`,
        notes: [
          ['type nul >', 'Create an empty SQLite file', 'On Windows this creates database\\database.sqlite. With DB_CONNECTION=sqlite, Laravel stores every table in that one file.'],
          ['php artisan migrate', 'Build the tables', 'Runs the pending migrations.']
        ]
      }],
      check: { q: 'Which file holds Laravel’s database connection settings?', o: ['.env', 'routes/web.php', 'database/seeders/TaskSeeder.php', 'resources/views/tasks/index.blade.php'], a: 0, why: '.env configures the connection, just like in CodeIgniter.' },
      watch: ['Wrong DB_DATABASE path'],
      twin: 'env-db'
    },
    {
      id: 'migrations', title: 'Migrations version your tables', sub: 'Schema::create and migrate commands',
      lead: 'A migration describes how a table should be created or changed. Laravel records which migrations already ran, so every developer or server can rebuild the same schema.',
      code: [{
        name: 'create_tasks_table.php', path: 'database/migrations/..._create_tasks_table.php', lang: 'php',
        src: R`Schema::create('tasks', function (Blueprint $table) {
    $table->id();
    $table->string('title', 150);
    $table->string('status', 20)->default('pending');
    $table->timestamps();
});`,
        notes: [
          ["Schema::create('tasks'", 'Create the tasks table', 'The first custom migration for the task manager.'],
          ['$table->id()', 'Auto-increment primary key', 'Same job as INT AUTO_INCREMENT PRIMARY KEY in the CodeIgniter SQL.'],
          ["string('title', 150)", 'VARCHAR(150)', 'string() makes a VARCHAR column with a length.'],
          ["->default('pending')", 'Default value', "New tasks start as 'pending'."],
          ['timestamps()', 'created_at and updated_at', 'Adds both columns. Eloquent fills them automatically.']
        ]
      }, {
        name: 'Column choices', path: 'examples', lang: 'php',
        src: R`$table->id();
$table->string('title', 100);
$table->text('notes')->nullable();
$table->boolean('is_active')->default(false);
$table->timestamps();`,
        notes: [
          ['text(', 'Long text that may be empty', 'text() holds notes or descriptions. ->nullable() lets the column be NULL.'],
          ['boolean(', 'True or false', 'With a default of false.']
        ]
      }, {
        name: 'Terminal', lang: 'sh',
        src: R`php artisan migrate
php artisan migrate:rollback
php artisan migrate:fresh`,
        notes: [
          [1, 'Run pending migrations', 'Creates any tables that do not exist yet.'],
          ['rollback', 'Undo the last batch', 'Reverses the most recent group of migrations.'],
          ['fresh', 'Rebuild from zero', 'Drops every table and runs all migrations again. Use only in local development, never on real production data.']
        ]
      }],
      body: [
        ['steps', ['Generate the migration file.', 'Define each column the task app needs.', 'Run `php artisan migrate` and confirm the table exists.'], 'Steps'],
        ['p', 'Choose columns based on what the application needs to display, search or update.'],
        ['added', 'One common way to generate the file is `php artisan make:migration create_tasks_table`.'],
        ['note', 'Use destructive reset commands like migrate:fresh only in local development, never on real production data.', 'Warning']
      ],
      check: { q: 'Which command drops every table and rebuilds them from zero?', o: ['php artisan migrate:fresh', 'php artisan migrate', 'php artisan migrate:rollback', 'php artisan db:seed'], a: 0, why: 'migrate:fresh rebuilds all tables. rollback only undoes the last batch.' },
      watch: ['Migration not yet run'],
      twin: 'schema'
    },
    {
      id: 'seeders', title: 'Seeders create predictable sample records', sub: 'make:seeder and db:seed',
      lead: 'A seeder inserts sample records so the application has data to display. Good seed data makes demonstrations repeatable and easier to debug.',
      code: [{
        name: 'Terminal', lang: 'sh',
        src: R`php artisan make:seeder TaskSeeder
php artisan db:seed --class=TaskSeeder
# INFO Database seeding completed successfully.`,
        notes: [
          ['make:seeder', 'Create the seeder', 'Generates database/seeders/TaskSeeder.php.'],
          ['db:seed --class=TaskSeeder', 'Run one seeder', 'Inserts its records.']
        ]
      }, {
        name: 'TaskSeeder.php', path: 'database/seeders/TaskSeeder.php', lang: 'php',
        src: R`use App\Models\Task;

public function run(): void
{
    Task::create([
        'title' => 'Buy groceries',
        'status' => 'pending',
    ]);
    Task::create([
        'title' => 'Submit report',
        'status' => 'pending',
    ]);
    Task::create([
        'title' => 'Fix login bug',
        'status' => 'done',
    ]);
}`,
        notes: [
          ['public function run()', 'run() does the inserting', 'Laravel calls run() when you seed.'],
          ['Task::create([', 'Insert with the model', 'create() only fills columns listed in $fillable on the Task model.'],
          ["'Fix login bug'", 'Same three tasks', 'The slide is cut off here. The third record matches the CodeIgniter sample data (status done).']
        ]
      }],
      check: { q: 'What is the job of a seeder?', o: ['Insert predictable sample records', 'Create the table structure', 'Connect to the database', 'Render the task list'], a: 0, why: 'Migrations create tables. Seeders fill them with sample rows.' }
    },
    {
      id: 'eloquent-model', title: 'Eloquent models and $fillable', sub: 'Rows become PHP objects',
      lead: 'A model represents one database table, and a model object represents one record. Eloquent lets controllers retrieve and update records without writing raw SQL for every page.',
      flow: flow('lv', 'model', { over: { model: ['Task', 'app/Models', 'An Eloquent model for the tasks table.'] } }),
      code: [{
        name: 'Terminal', lang: 'sh',
        src: R`php artisan make:model Task
# Created: app/Models/Task.php`,
        notes: [['make:model Task', 'Generate the model', 'Creates app/Models/Task.php.']]
      }, {
        name: 'Task.php', path: 'app/Models/Task.php', lang: 'php',
        src: R`class Task extends Model
{
    protected $fillable = [
        'title',
        'status',
    ];
}`,
        notes: [
          ['class Task extends Model', 'One model per table', 'Task (singular) manages the tasks table (plural) by Laravel convention.'],
          ['$fillable', 'Safe mass assignment', 'Tells Laravel which columns create() and update() may fill. Same job as $allowedFields in CodeIgniter.']
        ]
      }],
      body: [
        ['table', ['Job', 'CodeIgniter', 'Laravel'], [
          ['Connection settings', '`.env`', '`.env`'],
          ['Table structure', 'SQL in phpMyAdmin', '`database/migrations`'],
          ['Model', '`app/Models/TaskModel.php`', '`app/Models/Task.php`'],
          ['Queries', 'Query Builder / model methods', 'Eloquent model queries']
        ], 'CI vs. Laravel data layer map']
      ],
      check: { q: 'Which Laravel property has the same job as CodeIgniter’s $allowedFields?', o: ['$fillable', '$table', '$hidden', '$primaryKey'], a: 0, why: '$fillable lists the columns create() and update() may fill.' },
      watch: ['$fillable not set for create()', 'Model namespace missing'],
      twin: 'fillable'
    },
    {
      id: 'retrieve', title: 'Retrieving records into Blade', sub: 'Task::all(), compact() and @foreach',
      lead: 'Read all rows in the controller, then pass them to Blade, where @foreach loops over each model object.',
      flow: flow('lv', ['controller', 'view'], { url: 'GET /tasks', over: { controller: ['TaskController', 'index()', 'Task::all() then view(\'tasks.index\', compact(\'tasks\')).'], model: ['Task', 'all()', 'Returns every row as Task objects.'], view: ['tasks/index.blade.php', '@foreach', 'Prints {{ $task->title }} for each task.'] } }),
      code: [{
        name: 'TaskController.php', path: 'app/Http/Controllers/TaskController.php', lang: 'php',
        src: R`public function index()
{
    $tasks = Task::all();

    return view('tasks.index', compact('tasks'));
    // same as: return view('tasks.index', ['tasks' => $tasks]);
}`,
        notes: [
          ['Task::all()', 'Every record', 'Returns many Task rows. Same job as findAll() in CodeIgniter.'],
          ["compact('tasks')", 'Build the array from variables', "compact() is a PHP function that creates ['tasks' => $tasks] from the existing variable."],
          ["'tasks.index'", 'Dot notation', "'tasks.index' means resources/views/tasks/index.blade.php."]
        ]
      }, {
        name: 'index.blade.php', path: 'resources/views/tasks/index.blade.php', lang: 'blade',
        src: R`<h1>My Tasks</h1>
<ul>
    @foreach ($tasks as $task)
        <li>{{ $task->title }} -- {{ $task->status }}</li>
    @endforeach
</ul>`,
        notes: [
          ['@foreach', 'Loop in Blade', 'Blade’s version of foreach. Close it with @endforeach.'],
          ['$task->title', 'Object syntax', 'Eloquent returns objects, so use ->title (CodeIgniter rows used [\'title\']). {{ }} escapes it safely.']
        ]
      }],
      check: { q: 'In a Blade view, how do you print an Eloquent task’s title safely?', o: ['{{ $task->title }}', "<?= $task['title'] ?>", '{!! $task->title !!}', '@print($task.title)'], a: 0, why: 'Eloquent returns objects (->title), and {{ }} escapes the output.' },
      watch: ['Writing queries inside Blade'],
      twin: 'get-all'
    },
    {
      id: 'query-show', title: 'Filtering and showing one record', sub: 'where()->get(), findOrFail(), @if',
      lead: 'Eloquent queries can add conditions before retrieving records, and findOrFail() turns a missing record into a 404 page.',
      flow: flow('lv', ['routes', 'controller'], { url: 'GET /tasks/3', over: { routes: ['routes/web.php', '{id}', "Route::get('/tasks/{id}', [TaskController::class, 'show'])."], controller: ['TaskController', 'show($id)', 'Task::findOrFail($id) returns the task or shows a 404.'], model: ['Task', 'findOrFail()', 'One record, or a 404 page if it does not exist.'], view: ['tasks/show.blade.php', 'details', 'Prints one $task.'] } }),
      code: [{
        name: 'TaskController.php', path: 'app/Http/Controllers/TaskController.php', lang: 'php',
        src: R`$tasks = Task::where('status', 'pending')
    ->orderBy('created_at', 'desc')
    ->get();

return view('tasks.index', [
    'tasks' => $tasks,
]);

public function show($id)
{
    $task = Task::findOrFail($id);

    return view('tasks.show', compact('task'));
}`,
        notes: [
          ["Task::where('status', 'pending')", 'Filter rows', 'where() filters the rows.'],
          ['->orderBy(', 'Sort', 'orderBy() controls the display order.'],
          ['->get();', 'Run the query', 'get() runs the query and returns the matching records. Without it you only have a query, not results.'],
          ['findOrFail($id)', 'One record or a 404', 'Use findOrFail() when a missing record should become a 404 page.']
        ]
      }, {
        name: 'web.php', path: 'routes/web.php', lang: 'php',
        src: R`use App\Http\Controllers\TaskController;

Route::get('/tasks', [TaskController::class, 'index']);
Route::get('/tasks/{id}', [TaskController::class, 'show']);`,
        notes: [['{id}', 'The id parameter', 'Visiting /tasks/3 passes 3 to show($id).']]
      }, {
        name: 'index.blade.php', path: 'resources/views/tasks/index.blade.php', lang: 'blade',
        src: R`@foreach ($tasks as $task)
    <li>
        {{ $task->title }}
        @if ($task->status === 'done')
            <span>Done</span>
        @else
            <span>Pending</span>
        @endif
    </li>
@endforeach`,
        notes: [['@if', 'A Blade condition', 'Displays different text based on the database value. Close it with @endif.']]
      }, {
        name: 'show.blade.php', path: 'resources/views/tasks/show.blade.php', lang: 'blade',
        src: R`<h1>{{ $task->title }}</h1>
<p>Status: {{ $task->status }}</p>`,
        notes: [['$task->title', 'One Task object', 'Visiting /tasks/3 shows Fix login bug, Status: done.']]
      }],
      body: [
        ['table', ['Eloquent call', 'What it does'], [
          ['`Task::all()`', 'Retrieve all records'],
          ['`Task::where(...)->get()`', 'Retrieve matching records'],
          ['`Task::findOrFail($id)`', 'Retrieve one record or show a 404'],
          ['`Task::create([...])`', 'Insert a new record using fillable fields']
        ], 'Eloquent commands']
      ],
      check: { q: 'What does `->get()` do at the end of `Task::where(...)->orderBy(...)`?', o: ['Runs the query and returns the matching records', 'Returns only the first record', 'Deletes the records', 'Counts the records'], a: 0, why: 'where() and orderBy() build the query. get() runs it.' },
      twin: 'find-or-404'
    },
    {
      id: 'tinker', title: 'Checking data with Tinker', sub: 'php artisan tinker',
      lead: 'Tinker lets you run small Laravel commands from the terminal. Use it to confirm the database has records before you start debugging a view.',
      code: [{
        name: 'Terminal', lang: 'sh',
        src: R`php artisan tinker
>>> App\Models\Task::count();
3
>>> App\Models\Task::first()->title;
"Buy groceries"`,
        notes: [
          ['php artisan tinker', 'Open Tinker', 'An interactive prompt that runs inside your Laravel app.'],
          ['::count()', 'How many rows?', '3 means the seeder worked.'],
          ['::first()->title', 'Peek at a record', 'The first task’s title.']
        ]
      }],
      check: { q: 'Your task list view is empty. What is a quick way to check whether the tasks table has records?', o: ['Run App\\Models\\Task::count() in php artisan tinker', 'Edit the Blade view', 'Run migrate:fresh', 'Restart the browser'], a: 0, why: 'Tinker confirms the data exists before you debug the view.' }
    }
  ],
  mistakes: [
    'Wrong DB_DATABASE path',
    'Migration not yet run',
    'Model namespace missing',
    '$fillable not set for create()',
    'Query written inside Blade'
  ],
  takeaways: [
    '.env configures the connection',
    'Migrations create tables',
    'Seeders create sample rows',
    'Eloquent retrieves model objects',
    'Controllers pass records to Blade'
  ],
  quiz: [
    { t: 'mcq', q: 'Which Laravel feature is the counterpart of CodeIgniter Models?', o: ['Eloquent models', 'Blade', 'Artisan', 'Seeders'], a: 0, why: 'Eloquent models play the Model role.', l: 'db-setup' },
    { t: 'mcq', q: 'Why is SQLite convenient for a classroom setup?', o: ['It keeps the whole database inside one file', 'It needs no migrations', 'It is faster than every other database', 'It stores data in .env'], a: 0, why: 'SQLite keeps everything in database/database.sqlite.', l: 'db-setup' },
    { t: 'mcq', q: 'Where does Laravel keep table structure?', o: ['database/migrations', 'database/seeders', 'app/Models', '.env'], a: 0, why: 'Migrations describe the schema.', l: 'db-setup' },
    { t: 'tf', q: 'Laravel records which migrations already ran.', a: true, why: 'True, so every developer or server can rebuild the same schema.', l: 'migrations' },
    { t: 'fill', q: 'Create the tasks table.', code: "Schema::______('tasks', function (Blueprint $table) { ... });", a: 'create', why: 'Schema::create defines a new table.', l: 'migrations' },
    { t: 'mcq', q: 'Which migration line adds created_at and updated_at?', o: ['$table->timestamps();', '$table->dates();', '$table->id();', "$table->datetime('created');"], a: 0, why: 'timestamps() adds both columns.', l: 'migrations' },
    { t: 'mcq', q: "What does `$table->text('notes')->nullable();` allow?", o: ['The notes column may be empty (NULL)', 'Notes must be unique', 'Notes default to false', 'Notes are limited to 100 characters'], a: 0, why: 'nullable() allows NULL.', l: 'migrations' },
    { t: 'id', q: 'Type the command that undoes the last batch of migrations.', a: 'php artisan migrate:rollback', alt: ['migrate:rollback'], why: '`php artisan migrate:rollback`.', l: 'migrations' },
    { t: 'tf', q: 'migrate:fresh is safe to run on production data.', a: false, why: 'False. It drops every table. Use it only in local development.', l: 'migrations' },
    { t: 'id', q: 'Type the command that runs only the TaskSeeder.', a: 'php artisan db:seed --class=TaskSeeder', why: '`php artisan db:seed --class=TaskSeeder`.', l: 'seeders' },
    { t: 'mcq', q: 'Which method inside a seeder inserts the records?', o: ['run()', 'seed()', 'up()', 'handle()'], a: 0, why: 'Laravel calls the seeder’s run() method.', l: 'seeders' },
    { t: 'id', q: 'Type the Artisan command that creates the Task model.', a: 'php artisan make:model Task', why: 'Creates app/Models/Task.php.', l: 'eloquent-model' },
    { t: 'mcq', q: 'Task::create([...]) silently ignores the title. What is the likely cause?', o: ["'title' is missing from $fillable", 'The migration used timestamps()', 'The view uses {{ }}', 'Tinker is closed'], a: 0, why: '$fillable not set for create() is a listed mistake.', l: 'eloquent-model' },
    { t: 'tf', q: 'An Eloquent model object represents one record from its table.', a: true, why: 'True. The model represents the table; an object represents one row.', l: 'eloquent-model' },
    { t: 'mcq', q: 'Which Eloquent call is the same as findAll() in CodeIgniter?', o: ['Task::all()', 'Task::find()', 'Task::get()', 'Task::first()'], a: 0, why: 'Task::all() returns every record.', l: 'retrieve' },
    { t: 'mcq', q: "What does compact('tasks') return?", o: ["['tasks' => $tasks]", "'tasks'", 'The number of tasks', 'A Blade view'], a: 0, why: 'compact() builds an array from existing variables.', l: 'retrieve' },
    { t: 'mcq', q: "What does view('tasks.index') load?", o: ['resources/views/tasks/index.blade.php', 'resources/views/tasks.index.php', 'app/Views/tasks/index.php', 'routes/tasks/index.php'], a: 0, why: 'Dots become folders.', l: 'retrieve' },
    { t: 'fill', q: 'Close the Blade loop.', code: '@foreach ($tasks as $task)\n    <li>{{ $task->title }}</li>\n___________', a: '@endforeach', why: 'Every @foreach needs @endforeach.', l: 'retrieve' },
    { t: 'fill', q: 'Run the query and get the matching records.', code: "$tasks = Task::where('status', 'pending')->orderBy('created_at', 'desc')->_____();", a: 'get', why: 'get() runs the query.', l: 'query-show' },
    { t: 'mcq', q: 'Why use findOrFail($id) instead of find($id)?', o: ['A missing record becomes a 404 page automatically', 'It is the only way to read one record', 'It also deletes the record', 'It returns every record'], a: 0, why: 'findOrFail() shows a 404 when the record does not exist.', l: 'query-show' },
    { t: 'mcq', q: 'Which Blade directive shows different text depending on a value?', o: ['@if / @else / @endif', '@foreach', '@csrf', '@error'], a: 0, why: "@if ($task->status === 'done') ... @else ... @endif.", l: 'query-show' },
    { t: 'id', q: 'Type the Artisan command that opens the interactive Tinker prompt.', a: 'php artisan tinker', why: '`php artisan tinker`.', l: 'tinker' },
    { t: 'order', q: 'Put the Laravel data-layer steps in order for a new tasks feature.', o: ['Set the database in .env', 'Write and run the tasks migration', 'Create the Task model with $fillable', 'Seed sample tasks', 'Read Task::all() in the controller and loop in Blade'], why: 'Settings, schema, model, sample data, then display. (The seeder uses the model, so the model comes first.)', l: 'db-setup' }
  ]
};
