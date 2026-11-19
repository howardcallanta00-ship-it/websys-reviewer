import { flow } from './flows.js';
const R = String.raw;

export default {
  id: 'm2', code: 'M2', track: 'ci',
  title: 'CodeIgniter Data Layer',
  summary: 'Connect CodeIgniter to MySQL, create a Model for the tasks table, and use Query Builder to read, filter and sort records for a view.',
  objectives: [
    'Configure a CodeIgniter project to connect to a MySQL database',
    'Explain what a Model is and create one for a database table',
    'Use Query Builder to retrieve, filter and sort records',
    'Pass database records from a controller to a view and display them'
  ],
  layers: { routes: '/tasks and /tasks/(:num)', controller: 'Tasks::index, show($id)', model: 'TaskModel, Query Builder', view: 'foreach + esc()', security: '.env credentials, auto-escaped queries' },
  lessons: [
    {
      id: 'tables', title: 'Why apps need a database', sub: 'The tasks table and sample rows',
      lead: 'Simple pages can show fixed text or arrays, but those are not real records. A database stores records that survive restarts, can be shared across requests and can grow safely.',
      plain: 'An array in your controller is a sticky note that disappears when PHP finishes. A database table is a filing cabinet that is still there tomorrow.',
      flow: flow('ci', 'db', { keys: ['controller', 'model', 'db'] }),
      body: [
        ['p', 'From here on, every example uses one small TODO **tasks** table, so the Model → Controller → View flow stays the same from module to module.'],
        ['steps', ['Open phpMyAdmin from the XAMPP control panel.', 'Create a new database.', 'Run the SQL below to create the `tasks` table.', 'Insert sample rows so there is something to read.'], 'Steps'],
        ['table', ['Column', 'Type', 'Notes'], [
          ['`id`', 'INT (auto)', 'AUTO_INCREMENT primary key'],
          ['`title`', 'VARCHAR(150)', 'Required (NOT NULL)'],
          ['`status`', 'VARCHAR(20)', "Defaults to 'pending'"],
          ['`created_at`', 'DATETIME', 'When the task was created']
        ], 'The tasks table']
      ],
      code: [{
        name: 'create_tasks.sql', path: 'phpMyAdmin › SQL', lang: 'sql',
        src: R`CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at DATETIME
);

INSERT INTO tasks (title, status, created_at) VALUES
    ('Buy groceries', 'pending', NOW()),
    ('Submit report', 'pending', NOW()),
    ('Fix login bug', 'done', NOW());`,
        notes: [
          ['AUTO_INCREMENT PRIMARY KEY', 'The id column', 'MySQL fills in the next number automatically. The primary key is what `find($id)` looks up.'],
          ["DEFAULT 'pending'", 'A default value', 'A new task is pending unless you say otherwise.'],
          ['INSERT INTO', 'Sample rows', 'After CREATE TABLE the table is empty. These three rows are used in every later example.']
        ]
      }],
      check: { q: 'Why store tasks in a database instead of a PHP array?', o: ['Records survive restarts and can be shared across requests', 'Arrays cannot hold strings', 'Views cannot loop over arrays', 'Databases do not need a Model'], a: 0, why: 'An array disappears when the request ends. A database keeps records across restarts and requests.' }
    },
    {
      id: 'db-config', title: 'Connecting CodeIgniter to the database', sub: '.env vs. Database.php',
      lead: 'You connect CodeIgniter to the database in the .env file. app/Config/Database.php describes the defaults CodeIgniter falls back on.',
      body: [
        ['p', 'Any matching key in `.env` automatically overrides the value in `Database.php`, so you rarely need to edit Database.php directly. It is the same pattern as `app.baseURL` in Module 1: **.env always wins**.'],
        ['list', [
          'Hardcoded credentials get committed to version control and shared by accident.',
          'Every environment (your laptop, a classmate’s, the live server) needs different values.',
          'CodeIgniter solves this with `.env`: one set of local settings that is never shared or uploaded to version control.'
        ], 'Why not hardcode credentials?'],
        ['note', '.env holds where and how to connect. Config/Database.php just describes the shape CodeIgniter expects those settings to take.', 'Remember']
      ],
      code: [{
        name: '.env', lang: 'env',
        src: R`database.default.hostname = localhost
database.default.database = your_database_name
database.default.username = root
database.default.password =
database.default.DBDriver = MySQLi`,
        notes: [
          ['hostname', 'Where MySQL runs', 'With XAMPP this is your own computer: localhost.'],
          ['database.default.database', 'Database name', 'Must match a database that exists in phpMyAdmin, or you get "Unknown database".'],
          ['username', 'MySQL user', 'XAMPP’s default user is root.'],
          ['password', 'MySQL password', 'Blank by default in XAMPP.'],
          ['DBDriver', 'The driver', 'MySQLi is CodeIgniter’s MySQL driver.']
        ]
      }, {
        name: 'Database.php', path: 'app/Config/Database.php', lang: 'php',
        src: R`'hostname' => 'localhost',
'username' => 'root',
'password' => '',
'database' => 'your_database_name',
'DBDriver' => 'MySQLi',`,
        notes: [
          ["'hostname'", 'The fallback values', 'CodeIgniter uses these only when `.env` does not set the same key.']
        ]
      }],
      check: { q: 'The same database name is set in both .env and Database.php. Which one does CodeIgniter use?', o: ['.env', 'Database.php', 'Whichever was edited last', 'Neither: it shows an error'], a: 0, why: 'Any matching key in .env overrides Database.php. .env always wins.' },
      twin: 'env-db'
    },
    {
      id: 'connection', title: 'Testing the connection', sub: 'Common connection errors',
      lead: 'Start the server and visit any page. If your settings are correct, the page loads normally. If not, CodeIgniter shows a clear database error: your cue to recheck .env.',
      code: [{
        name: 'Terminal', lang: 'sh',
        src: R`php spark serve
# CodeIgniter development server started
# Listening on http://localhost:8080`,
        notes: [['php spark serve', 'Start the app', 'Then open a page that uses the database.']]
      }],
      body: [
        ['table', ['Error', 'Usual cause'], [
          ['**Unknown database**', 'The database name in `.env` (or Database.php) does not exist yet in phpMyAdmin.'],
          ['**Access denied for user**', 'Wrong username or password.'],
          ['**Connection refused**', 'MySQL is not running in the XAMPP control panel.'],
          ['**Settings not taking effect**', 'A stray space or a missing key name in `.env`.']
        ], 'Common connection errors']
      ],
      check: { q: 'You see "Connection refused". What is the most likely cause?', o: ['MySQL is not running in XAMPP', 'The database name is misspelled', 'The password is wrong', 'The table has no rows'], a: 0, why: 'Connection refused means nothing is listening: start MySQL in the XAMPP control panel.' }
    },
    {
      id: 'model', title: 'Creating a Model for a table', sub: '$table, $primaryKey, $allowedFields',
      lead: 'A CodeIgniter Model is a PHP class, one per database table, that already knows how to talk to that table. It extends CodeIgniter’s built-in Model class, which provides ready-made methods.',
      flow: flow('ci', 'model', { over: { model: ['TaskModel', 'app/Models', 'Knows the tasks table and how to query it.'] } }),
      code: [{
        name: 'TaskModel.php', path: 'app/Models/TaskModel.php', lang: 'php',
        src: R`<?php

namespace App\Models;

use CodeIgniter\Model;

class TaskModel extends Model
{
    protected $table = 'tasks';
    protected $primaryKey = 'id';
    protected $allowedFields = ['title', 'status'];
}`,
        notes: [
          ['namespace App\\Models', 'Models namespace', 'Matches the app/Models folder.'],
          ['use CodeIgniter\\Model', 'Import the base Model', 'Your class extends this to get findAll(), find(), insert() and the rest.'],
          ['$table', 'Which table', 'The table this Model manages. It must match the real table name exactly.'],
          ['$primaryKey', 'How to find one row', 'The column used to find a single row, usually id.'],
          ['$allowedFields', 'Which columns can be saved', 'Only these columns can be saved from user input. Forget one and saves to it silently fail.']
        ]
      }],
      body: [['p', 'There are more Model properties than these three. See the CodeIgniter documentation for the complete list.']],
      check: { q: 'You insert a task but the status column never changes. What is the most likely cause?', o: ["'status' is missing from $allowedFields", 'The table has no primary key', '$table is set to tasks', 'The view does not use esc()'], a: 0, why: 'Columns that are not in $allowedFields are silently skipped on save.' },
      watch: ['A table name in the Model that does not match the real table', 'Forgetting a column in $allowedFields, so saves silently fail'],
      twin: 'fillable'
    },
    {
      id: 'query-builder', title: 'Query Builder: findAll() and find()', sub: 'Reading records without raw SQL',
      lead: 'Instead of writing SQL strings by hand, you call PHP methods and CodeIgniter builds the SQL for you.',
      body: [
        ['compare', ['Writing raw SQL', [
          'You build the query string by hand',
          'Easy to forget escaping, which opens the door to SQL injection',
          'Syntax differs slightly between database systems'
        ]], ['Using Query Builder', [
          'You call PHP methods and CodeIgniter builds the SQL',
          'Values are automatically escaped for you',
          'The same code works across supported databases'
        ]]]
      ],
      code: [{
        name: 'Tasks.php', path: 'app/Controllers/Tasks.php', lang: 'php',
        src: R`$model = new TaskModel();
$tasks = $model->findAll();

// The same thing with the model() helper:
$tasks = model(TaskModel::class)->findAll();

$task = $model->find(3);`,
        notes: [
          ['new TaskModel()', 'Create the model object', '`$model` is a TaskModel object created with the new operator.'],
          ['->findAll()', 'Every row', 'Every Model already has findAll(). It returns all rows of the table.'],
          ['model(TaskModel::class)', 'The model() helper', 'CodeIgniter’s model() helper function creates the model for you. Both styles are valid.'],
          ['->find(3)', 'One row by primary key', 'Returns the row whose id is 3, or nothing (null) if no row has that id.']
        ]
      }],
      check: { q: 'What does Query Builder do that raw SQL strings do not do automatically?', o: ['Escapes values for you', 'Creates the database', 'Writes the view', 'Hashes passwords'], a: 0, why: 'Query Builder escapes values automatically, which protects against SQL injection.' },
      twin: 'get-all'
    },
    {
      id: 'filter-sort', title: 'Filtering, sorting and chaining', sub: 'where(), orderBy() and friends',
      lead: 'Add conditions before calling a retrieval method to choose which records come back and in what order.',
      code: [{
        name: 'Tasks.php', path: 'app/Controllers/Tasks.php', lang: 'php',
        src: R`$pending = $model
    ->where('status', 'pending')
    ->findAll();

$tasks = $model
    ->orderBy('created_at', 'DESC')
    ->findAll();

$tasks = $model
    ->where('status', 'pending')
    ->orderBy('created_at', 'DESC')
    ->findAll();`,
        notes: [
          ["->where('status', 'pending')", 'Filter rows', "Only tasks whose status column equals 'pending' come back."],
          ["'DESC')", 'Sort order', 'DESC sorts newest first (descending). Use ASC for ascending.'],
          [9, 'Chaining', 'Query Builder methods return the builder itself, so you can chain several together before findAll().']
        ]
      }],
      body: [
        ['table', ['Method', 'What it does'], [
          ['`like()`', 'Search for rows containing a keyword'],
          ['`limit()`', 'Cap the number of rows returned'],
          ['`countAllResults()`', 'Count matching rows instead of fetching them'],
          ['`first()`', 'Return just the first matching row']
        ], 'Other handy Query Builder methods']
      ],
      check: { q: 'Which call returns only the first matching row?', o: ['first()', 'findAll()', 'limit()', 'countAllResults()'], a: 0, why: 'first() returns one row. limit() still returns a list, and countAllResults() returns a number.' },
      twin: 'filter-sort'
    },
    {
      id: 'list-view', title: 'Showing the task list', sub: 'Controller → $data → foreach',
      lead: 'Use the Model in a controller, pass the records to a view through a $data array, then loop over them with foreach.',
      flow: flow('ci', ['controller', 'view'], { url: 'GET /tasks', over: { routes: ['Routes.php', "'/tasks'", "`$routes->get('/tasks', 'Tasks::index');`"], controller: ['Tasks::index', 'controller', 'Calls findAll() and passes the rows as $data[\'tasks\'].'], model: ['TaskModel', 'findAll()', 'Returns every row of the tasks table.'], view: ['tasks/index.php', 'view', 'Loops over $tasks and prints each title with esc().'] } }),
      code: [{
        name: 'Tasks.php', path: 'app/Controllers/Tasks.php', lang: 'php',
        src: R`<?php

namespace App\Controllers;

use App\Models\TaskModel;

class Tasks extends BaseController
{
    public function index()
    {
        $model = new TaskModel();
        $data['tasks'] = $model->findAll();

        return view('tasks/index', $data);
    }
}`,
        notes: [
          ['use App\\Models\\TaskModel', 'Import the model', 'Without this line, `new TaskModel()` cannot be found.'],
          ["$data['tasks']", 'The key becomes a variable', "The key 'tasks' becomes the `$tasks` variable inside the view."],
          ["view('tasks/index'", 'A view in a sub-folder', 'Loads app/Views/tasks/index.php.']
        ]
      }, {
        name: 'index.php', path: 'app/Views/tasks/index.php', lang: 'blade',
        src: R`<h1>My Tasks</h1>
<ul>
<?php foreach ($tasks as $task): ?>
    <li>
        <?= esc($task['title']) ?>
        -- <?= esc($task['status']) ?>
    </li>
<?php endforeach; ?>
</ul>`,
        notes: [
          ['foreach ($tasks as $task)', 'Loop over the records', '`$tasks` is the array passed from the controller. Each `$task` is one row.'],
          ["esc($task['title'])", 'Print safely', 'esc() escapes the value so any HTML in a title is shown as text instead of running. Rows are arrays here, so use `$task[\'title\']`.'],
          ['endforeach', 'Close the loop', 'The alternative syntax `foreach (...):` / `endforeach;` reads better inside HTML.']
        ]
      }, {
        name: 'Routes.php', path: 'app/Config/Routes.php', lang: 'php',
        src: R`$routes->get('/tasks', 'Tasks::index');`,
        notes: [["'/tasks'", 'Add the route', 'Visit localhost:8080/tasks to see Buy groceries, Submit report and Fix login bug.']]
      }],
      check: { q: "The controller does `$data['tasks'] = $model->findAll();`. Which variable does the view loop over?", o: ['$tasks', '$data', '$model', "$data['tasks']"], a: 0, why: 'Each key of the data array becomes a variable in the view, so the view uses $tasks.' }
    },
    {
      id: 'show-one', title: 'Showing one task', sub: 'show($id) and missing records',
      lead: 'A route with a numeric segment passes the id into a show($id) method, which finds one record and sends it to its own view.',
      flow: flow('ci', ['routes', 'controller'], { url: 'GET /tasks/3', over: { routes: ['Routes.php', '(:num)', "`(:num)` accepts only a numeric segment, and `$1` passes it to show($id)."], controller: ['Tasks::show', 'show($id)', 'Calls find($id). If the result is null, throws PageNotFoundException.'], model: ['TaskModel', 'find($id)', 'Returns one row, or null if no row has that id.'], view: ['tasks/show.php', 'view', 'Prints one $task.'] } }),
      code: [{
        name: 'Tasks.php', path: 'app/Controllers/Tasks.php', lang: 'php',
        src: R`public function show($id)
{
    $model = new TaskModel();
    $data['task'] = $model->find($id);

    if ($data['task'] === null) {
        throw new PageNotFoundException();
    }

    return view('tasks/show', $data);
}`,
        notes: [
          ['show($id)', 'The id from the URL', 'For /tasks/3, `$id` is 3.'],
          ['->find($id)', 'Find one record', 'Returns the row, or null when no row has that id. It does not throw an error on its own.'],
          ['=== null', 'Check before using it', 'Always check for null before using a single record. Forgetting this is a listed mistake.'],
          ['PageNotFoundException', 'Respond with a 404', 'Shows CodeIgniter’s not-found page instead of a broken view. Import it with `use CodeIgniter\\Exceptions\\PageNotFoundException;` at the top of the controller.']
        ]
      }, {
        name: 'show.php', path: 'app/Views/tasks/show.php', lang: 'blade',
        src: R`<h1><?= esc($task['title']) ?></h1>
<p>
    Status: <?= esc($task['status']) ?>
</p>`,
        notes: [["$task['title']", 'One record', "The data key named 'task' becomes the `$task` variable. Visiting /tasks/3 shows Fix login bug, Status: done."]]
      }, {
        name: 'Routes.php', path: 'app/Config/Routes.php', lang: 'php',
        src: R`$routes->get('/tasks/(:num)', 'Tasks::show/$1');`,
        notes: [['(:num)', 'Numeric segment', '`(:num)` accepts only a number, and `$1` passes it into show($id).']]
      }],
      check: { q: 'What does `$model->find(99)` return when no task has id 99?', o: ['null', 'false', 'An empty array', 'It throws PageNotFoundException'], a: 0, why: 'find() simply returns null. Your controller has to check for null and throw PageNotFoundException itself.' },
      watch: ['Not checking for null before using a single record'],
      twin: 'find-or-404'
    }
  ],
  mistakes: [
    'A table name in the Model that does not match the real table',
    'Forgetting a column in $allowedFields, so saves silently fail',
    'Not checking for null before using a single record'
  ],
  takeaways: [
    '.env holds real credentials; Database.php holds the defaults',
    'A Model wraps one table and knows how to query it',
    'Query Builder methods chain together and escape values for you'
  ],
  quiz: [
    { t: 'mcq', q: 'Which tool from XAMPP is used to create the database and run the CREATE TABLE SQL?', o: ['phpMyAdmin', 'Spark', 'Composer', 'Tinker'], a: 0, why: 'Open phpMyAdmin from the XAMPP control panel to create the database and table.', l: 'tables' },
    { t: 'mcq', q: "In the tasks table, what is the default value of status?", o: ["'pending'", "'done'", 'NULL', "'new'"], a: 0, why: "The column is defined as VARCHAR(20) DEFAULT 'pending'.", l: 'tables' },
    { t: 'id', q: 'Type the .env key that sets the database name for the default connection.', a: 'database.default.database', why: 'database.default.database = your_database_name.', l: 'db-config' },
    { t: 'mcq', q: 'Which DBDriver value does the module use for MySQL?', o: ['MySQLi', 'PDO', 'SQLite3', 'Postgre'], a: 0, why: 'database.default.DBDriver = MySQLi.', l: 'db-config' },
    { t: 'tf', q: 'A value set in .env overrides the matching value in app/Config/Database.php.', a: true, why: 'True. .env always wins, so you rarely edit Database.php directly.', l: 'db-config' },
    { t: 'mcq', q: 'Why should database credentials not be hardcoded in Database.php?', o: ['They get committed to version control and every environment needs different values', 'Database.php cannot hold strings', 'CodeIgniter ignores Database.php', 'It makes queries slower'], a: 0, why: 'Hardcoded credentials get shared by accident, and each machine needs its own values.', l: 'db-config' },
    { t: 'mcq', q: 'You see "Access denied for user". What should you check?', o: ['The username and password', 'Whether MySQL is running', 'The database name', 'The route'], a: 0, why: 'Access denied means the username or password is wrong.', l: 'connection' },
    { t: 'mcq', q: 'You see "Unknown database". What is the cause?', o: ['The database name in .env does not exist in phpMyAdmin yet', 'MySQL is stopped', 'The password is wrong', 'The model has no $table'], a: 0, why: 'The configured database has not been created yet, or its name is misspelled.', l: 'connection' },
    { t: 'mcq', q: 'Which class does a CodeIgniter model extend?', o: ['CodeIgniter\\Model', 'BaseController', 'Illuminate\\Database\\Eloquent\\Model', 'FilterInterface'], a: 0, why: 'use CodeIgniter\\Model; then class TaskModel extends Model.', l: 'model' },
    { t: 'fill', q: 'Tell the model which table it manages.', code: "protected ______ = 'tasks';", a: '$table', why: '$table names the table this Model manages.', l: 'model' },
    { t: 'mcq', q: 'What is $allowedFields for?', o: ['Listing which columns can be saved from user input', 'Listing which columns are shown in the view', 'Listing which users can log in', 'Listing allowed file types'], a: 0, why: '$allowedFields whitelists columns for insert and update.', l: 'model' },
    { t: 'tf', q: 'If a column is missing from $allowedFields, CodeIgniter shows a clear error when you try to save it.', a: false, why: 'False. The save to that column silently fails, which is why it is a listed mistake.', l: 'model' },
    { t: 'mcq', q: 'What does findAll() return?', o: ['All rows of the model’s table', 'The first row', 'The number of rows', 'The table structure'], a: 0, why: 'findAll() retrieves every record.', l: 'query-builder' },
    { t: 'id', q: 'Type the CodeIgniter helper call that creates a TaskModel without using new.', a: 'model(TaskModel::class)', why: 'model(TaskModel::class)->findAll() is the helper style.', l: 'query-builder' },
    { t: 'mcq', q: 'What is one risk of building raw SQL strings by hand?', o: ['Forgetting to escape values, which allows SQL injection', 'Queries become too fast', 'The view cannot display results', 'Composer stops working'], a: 0, why: 'Query Builder escapes values automatically. Hand-written SQL makes it easy to forget.', l: 'query-builder' },
    { t: 'fill', q: 'Return only pending tasks.', code: "$pending = $model->______('status', 'pending')->findAll();", a: 'where', why: 'where() adds a condition before findAll() runs.', l: 'filter-sort' },
    { t: 'mcq', q: "What does orderBy('created_at', 'DESC') do?", o: ['Sorts newest first', 'Sorts oldest first', 'Removes old tasks', 'Groups tasks by date'], a: 0, why: 'DESC sorts in descending order. ASC sorts ascending.', l: 'filter-sort' },
    { t: 'mcq', q: 'Which method counts matching rows instead of fetching them?', o: ['countAllResults()', 'limit()', 'first()', 'like()'], a: 0, why: 'countAllResults() returns a number.', l: 'filter-sort' },
    { t: 'mcq', q: 'Which method searches for rows containing a keyword?', o: ['like()', 'where()', 'find()', 'orderBy()'], a: 0, why: 'like() matches rows that contain the keyword.', l: 'filter-sort' },
    { t: 'tf', q: 'Query Builder methods can be chained because each returns the builder itself.', a: true, why: 'True: where(...)->orderBy(...)->findAll().', l: 'filter-sort' },
    { t: 'mcq', q: 'In the task list view, which function prints a value safely?', o: ['esc()', 'echo_safe()', 'html()', 'print_r()'], a: 0, why: "<?= esc($task['title']) ?> escapes the value before printing.", l: 'list-view' },
    { t: 'mcq', q: "In a CodeIgniter view, how do you read a task's title from a findAll() row?", o: ["$task['title']", '$task->title', 'title($task)', '{{ $task.title }}'], a: 0, why: 'Rows come back as arrays here, so use array syntax. Eloquent in Laravel uses $task->title.', l: 'list-view' },
    { t: 'order', q: 'Put the task list flow in order.', o: ["Add $routes->get('/tasks', 'Tasks::index')", 'Tasks::index creates a TaskModel', "$data['tasks'] = $model->findAll()", "return view('tasks/index', $data)", 'The view loops over $tasks with foreach'], why: 'Route → controller → model → data array → view loop.', l: 'list-view' },
    { t: 'fill', q: 'Pass the numeric id to show().', code: "$routes->get('/tasks/(:num)', 'Tasks::show/__');", a: '$1', why: '$1 passes the first placeholder value to the method.', l: 'show-one' },
    { t: 'mcq', q: 'What should show($id) do when find($id) returns null?', o: ['throw new PageNotFoundException()', 'Return an empty view', 'Redirect to /login', 'Call findAll() instead'], a: 0, why: 'Throwing PageNotFoundException shows a proper 404 page.', l: 'show-one' }
  ]
};
