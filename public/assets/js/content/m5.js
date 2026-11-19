import { flow } from './flows.js';
const R = String.raw;

export default {
  id: 'm5', code: 'M5', track: 'lv',
  title: 'Laravel Foundations',
  summary: 'Transfer what you know from CodeIgniter: set up a Laravel project, use Artisan, and build routes, controllers and Blade views.',
  objectives: [
    'Set up a Laravel project and run it locally',
    'Identify how Laravel’s structure compares with CodeIgniter',
    'Use Artisan commands to inspect and generate application files',
    'Create Laravel routes, controllers and Blade views, and pass data to views'
  ],
  layers: { routes: 'routes/web.php, {id}', controller: 'make:controller', model: '', view: 'Blade {{ }}', security: 'Blade auto-escaping' },
  lessons: [
    {
      id: 'why-laravel', title: 'Why learn Laravel after CodeIgniter?', sub: 'Same MVC thinking, new workflow',
      lead: 'You already know the main idea: a framework gives structure to server-side PHP applications. Laravel uses the same MVC thinking, but it is more convention-driven and tool-assisted.',
      plain: 'Moving from CodeIgniter to Laravel is like switching from one car to another. The steering wheel and pedals are the same (MVC). Only some buttons are in different places.',
      body: [
        ['p', 'The goal is not to memorize a second framework from zero. It is to transfer what you already know into Laravel’s workflow.'],
        ['note', 'Laravel feels easier once you stop looking for CodeIgniter file names and start looking for the same MVC responsibilities.', 'Key idea']
      ],
      code: [{
        name: 'Terminal', lang: 'sh',
        src: R`composer global require laravel/installer
laravel new myproject
cd myproject
# Application ready.`,
        notes: [
          ['composer global require', 'Install the Laravel installer', 'Installs the laravel command once per machine. If "laravel is not recognized" appears later, Composer’s global bin folder is not on your PATH.'],
          ['laravel new myproject', 'Create the project', 'Creates a ready-to-run project with routes, views, configuration and Artisan already included.']
        ]
      }],
      check: { q: 'What is the recommended way to approach Laravel after CodeIgniter?', o: ['Transfer the same MVC responsibilities into Laravel’s workflow', 'Memorize Laravel from zero', 'Look for CodeIgniter file names in Laravel', 'Skip MVC because Laravel does not use it'], a: 0, why: 'Laravel uses the same MVC thinking. Look for the same responsibilities, not the same file names.' }
    },
    {
      id: 'structure', title: 'Project structure and conventions', sub: 'Where Laravel expects files',
      lead: 'A new Laravel project has more folders than the first CodeIgniter examples. For now you only need the folders that affect routing, controllers, views, configuration and public access.',
      code: [{
        name: 'myproject/', lang: 'tree',
        src: R`myproject/
  app/
    Http/Controllers/
  bootstrap/
  config/
  database/
  public/
  resources/views/
  routes/web.php
  storage/
  vendor/`,
        notes: [
          ['Http/Controllers/', 'Controllers', 'Controllers live in app/Http/Controllers.'],
          ['config/', 'Configuration files', 'They read values from .env and give Laravel a consistent place to look.'],
          ['database/', 'Migrations and seeders', 'Module 6 works in here.'],
          ['public/', 'The web entry point', 'Like CodeIgniter, public/ is the only folder the browser reaches.'],
          ['resources/views/', 'Blade views', 'Templates end in .blade.php.'],
          ['routes/web.php', 'Routes', 'Routes normally live in routes/web.php.'],
          ['storage/', 'Files and logs', 'Uploaded files on the public disk go in storage/app/public (Module 7).']
        ]
      }],
      body: [
        ['p', 'Laravel expects common files to live in predictable places. Because the locations are predictable, Laravel tools and developers can find files quickly.'],
        ['table', ['Job', 'CodeIgniter', 'Laravel'], [
          ['Routes', '`app/Config/Routes.php`', '`routes/web.php`'],
          ['Controller', '`app/Controllers/Pages.php`', '`app/Http/Controllers/PageController.php`'],
          ['View', '`app/Views/about.php`', '`resources/views/about.blade.php`'],
          ['Load a view', "`view('about')`", "`view('about')`"]
        ], 'CI vs. Laravel MVC map']
      ],
      check: { q: 'Where do Laravel Blade views live?', o: ['resources/views', 'app/Views', 'public/views', 'routes/views'], a: 0, why: 'Blade views live in resources/views and end with .blade.php.' },
      twin: 'routes-file'
    },
    {
      id: 'env-run', title: 'Configuring .env and running locally', sub: 'APP_URL, artisan serve, setup errors',
      lead: '.env holds values that can change per computer or server. Configuration files in config/ read those values. This is the same pattern as CodeIgniter: local settings stay separate from application code.',
      code: [{
        name: '.env', lang: 'env',
        src: R`APP_NAME="Student Portal"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000
DB_CONNECTION=sqlite

# If you use a local virtual host:
# APP_URL=http://myproject.test`,
        notes: [
          ['APP_NAME', 'The app’s name', 'Used in titles and emails.'],
          ['APP_DEBUG=true', 'Detailed errors', 'Shows Laravel’s error page while developing.'],
          ['APP_URL=http://localhost:8000', 'The application URL', 'Tells Laravel which address the project expects during development.'],
          ['DB_CONNECTION', 'Database driver', 'SQLite keeps the classroom setup inside one file (Module 6).']
        ]
      }, {
        name: 'Terminal', lang: 'sh',
        src: R`php artisan serve
# Server running on http://127.0.0.1:8000

composer run dev
# Starts Laravel's full development workflow`,
        notes: [
          ['php artisan serve', 'The simplest local server', 'Artisan is Laravel’s command-line tool. serve runs the app on port 8000.'],
          ['composer run dev', 'Full dev workflow', 'If the project uses frontend assets, this runs more tools together.']
        ]
      }],
      body: [
        ['table', ['Error', 'Cause'], [
          ['`laravel` is not recognized', 'Composer’s global bin folder is not on PATH.'],
          ['`composer` is not recognized', 'Composer is not installed, or the terminal was not restarted.'],
          ['Port already in use', 'Another server is already using port 8000.'],
          ['White error page', 'Read the Laravel error message, then check .env and the file you edited.']
        ], 'Common setup errors']
      ],
      check: { q: 'Which port does `php artisan serve` use by default?', o: ['8000', '8080', '3000', '80'], a: 0, why: 'Laravel serves on 127.0.0.1:8000. CodeIgniter’s spark serve uses 8080.' },
      twin: 'cli'
    },
    {
      id: 'routes', title: 'Laravel routes', sub: 'Closures, Route::view and parameters',
      lead: 'A request arrives through a route. The route may respond directly or send the request to a controller.',
      flow: flow('lv', 'routes', { keys: ['browser', 'routes', 'view'] }),
      code: [{
        name: 'web.php', path: 'routes/web.php', lang: 'php',
        src: R`<?php

use Illuminate\Support\Facades\Route;

Route::get('/about', function () {
    return 'This is the about page.';
});

Route::view('/contact', 'contact');

Route::view('/course', 'course', [
    'course' => 'IT0049',
]);

Route::get('/tasks/{id}', function ($id) {
    return "Task ID: " . $id;
});`,
        notes: [
          ['use Illuminate', 'Import the Route facade', 'Every routes file starts by importing Route.'],
          ["Route::get('/about'", 'Route anatomy', "`Route::get` responds to a normal page request. `'/about'` is the path after the domain. `function ()` is the code Laravel runs when that URL is visited."],
          ['Route::view(', 'Return a view directly', 'For simple static pages with no controller logic yet. In the slides: `Route::view(\'/about\', \'about\');`'],
          ["'course' => 'IT0049'", 'Pass small data from a route', "The key 'course' becomes a `$course` variable in the Blade file."],
          ['{id}', 'Capture part of the URL', 'Visiting /tasks/15 makes `$id` contain 15.']
        ]
      }],
      body: [['p', 'Step by step: open `routes/web.php`, add one simple route, then visit `/about` and confirm the response.']],
      check: { q: 'In `Route::get(\'/tasks/{id}\', function ($id) { ... })`, what is $id when you visit /tasks/15?', o: ['15', "'{id}'", 'null', '/tasks/15'], a: 0, why: 'The {id} segment is captured and passed to the function.' },
      twin: 'route-params',
      watch: ['Putting routes in the wrong file']
    },
    {
      id: 'controllers', title: 'Controllers with Artisan', sub: 'make:controller and connecting routes',
      lead: 'Artisan can generate a controller file in the correct folder. Use Artisan whenever Laravel already has a convention for the file you need.',
      flow: flow('lv', 'controller', { keys: ['browser', 'routes', 'controller', 'view'], over: { controller: ['PageController', 'about()', 'Prepares the response for one page.'] } }),
      code: [{
        name: 'Terminal', lang: 'sh',
        src: R`php artisan make:controller PageController
# Created: app/Http/Controllers/PageController.php`,
        notes: [['make:controller', 'Generate a controller', 'Creates the file in app/Http/Controllers with the right namespace.']]
      }, {
        name: 'PageController.php', path: 'app/Http/Controllers/PageController.php', lang: 'php',
        src: R`<?php

namespace App\Http\Controllers;

class PageController extends Controller
{
    public function about()
    {
        return view('about');
    }
}`,
        notes: [
          ['namespace App\\Http\\Controllers', 'Laravel’s controller namespace', 'Note the extra Http folder compared with CodeIgniter.'],
          ['extends Controller', 'Extends Controller', 'Laravel controllers extend Controller (CodeIgniter’s extend BaseController).'],
          ["return view('about')", 'Return a Blade view', 'Renders resources/views/about.blade.php.']
        ]
      }, {
        name: 'web.php', path: 'routes/web.php', lang: 'php',
        src: R`<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PageController;

Route::get('/about', [PageController::class, 'about']);`,
        notes: [
          ['use App\\Http\\Controllers\\PageController', 'Import the controller', 'Forgetting this import is a listed common mistake.'],
          ['[PageController::class, \'about\']', 'Point the route at the method', 'An array of the controller class and the method name.']
        ]
      }],
      body: [
        ['table', ['Command', 'What it does'], [
          ['`php artisan list`', 'Show available commands'],
          ['`php artisan route:list`', 'Show registered routes'],
          ['`php artisan make:controller PageController`', 'Create a controller'],
          ['`php artisan serve`', 'Run a local development server']
        ], 'Artisan commands']
      ],
      check: { q: 'Which route points /about to PageController’s about() method?', o: ["Route::get('/about', [PageController::class, 'about']);", "Route::get('/about', 'PageController::about');", "$routes->get('/about', 'PageController::about');", "Route::view('/about', PageController::about);"], a: 0, why: 'Laravel uses an array of the class and the method name.' },
      watch: ['Misspelling the controller class', 'Forgetting to import the controller'],
      twin: 'routes-file'
    },
    {
      id: 'blade', title: 'Blade views and passing data', sub: '{{ }} prints safely',
      lead: 'Pass an array as the second argument of view(). Each key becomes a variable in the Blade view.',
      flow: flow('lv', 'view', { keys: ['browser', 'routes', 'controller', 'view'] }),
      code: [{
        name: 'PageController.php', path: 'app/Http/Controllers/PageController.php', lang: 'php',
        src: R`public function about()
{
    $data = [
        'course' => 'Web System Technologies',
        'module' => 'Laravel Foundations',
    ];

    return view('about', $data);
}

public function task($id)
{
    $data = [
        'id'    => $id,
        'title' => 'Buy groceries',
    ];

    return view('task', $data);
}`,
        notes: [
          ["return view('about', $data)", 'Same as CodeIgniter', 'view() with a data array works the same way in both frameworks.'],
          ['public function task($id)', 'A route parameter in a controller', "With `Route::get('/tasks/{id}', [PageController::class, 'task']);`, visiting /tasks/15 passes 15 here."]
        ]
      }, {
        name: 'about.blade.php', path: 'resources/views/about.blade.php', lang: 'blade',
        src: R`<!DOCTYPE html>
<html>
<head>
    <title>About</title>
</head>
<body>
    <h1>{{ $course }}</h1>
    <p>{{ $module }}</p>
</body>
</html>`,
        notes: [['{{ $course }}', 'Print with double curly braces', 'Blade escapes these values before printing them.']]
      }, {
        name: 'task.blade.php', path: 'resources/views/task.blade.php', lang: 'blade',
        src: R`<h1>{{ $title }}</h1>
<p>Task ID: {{ $id }}</p>

{{-- Avoid raw output for user input --}}
{!! $title !!}`,
        notes: [
          ['{{-- Avoid', 'A Blade comment', 'Not sent to the browser.'],
          ['{!! $title !!}', 'Raw, unescaped output', 'Prints the value without escaping. Avoid it for anything a user typed.']
        ]
      }],
      body: [['note', 'The file must be named `about.blade.php`, not `about.php`. Using the wrong extension is a listed common mistake.', 'Watch out']],
      check: { q: 'Which Blade syntax prints a value safely (escaped)?', o: ['{{ $title }}', '{!! $title !!}', '<?= $title ?>', '@print($title)'], a: 0, why: 'Double curly braces escape the value. {!! !!} prints raw output.' },
      watch: ['Using about.php instead of about.blade.php'],
      twin: 'print-view'
    }
  ],
  mistakes: [
    'Putting routes in the wrong file',
    'Misspelling the controller class',
    'Forgetting to import the controller',
    'Using about.php instead of about.blade.php'
  ],
  takeaways: [
    'routes/web.php maps the URL',
    'Controllers coordinate page logic',
    'Blade views live in resources/views',
    '{{ }} safely prints view data'
  ],
  quiz: [
    { t: 'mcq', q: 'How does Laravel differ from CodeIgniter according to the module?', o: ['It uses the same MVC thinking but is more convention-driven and tool-assisted', 'It does not use MVC', 'It has no command-line tool', 'It cannot use .env'], a: 0, why: 'Same MVC ideas, more conventions and tools.', l: 'why-laravel' },
    { t: 'id', q: 'Type the command that creates a new Laravel project named myproject with the Laravel installer.', a: 'laravel new myproject', why: '`laravel new myproject` after installing laravel/installer globally.', l: 'why-laravel' },
    { t: 'mcq', q: '"laravel is not recognized" appears in the terminal. What is the cause?', o: ['Composer’s global bin folder is not on PATH', 'Port 8000 is busy', 'APP_DEBUG is false', 'The routes file is missing'], a: 0, why: 'The installer was installed but its folder is not on PATH.', l: 'env-run' },
    { t: 'mcq', q: 'Where do Laravel routes normally live?', o: ['routes/web.php', 'app/Config/Routes.php', 'config/routes.php', 'app/Http/routes.php'], a: 0, why: 'routes/web.php.', l: 'structure' },
    { t: 'mcq', q: 'Where do Laravel controllers live?', o: ['app/Http/Controllers', 'app/Controllers', 'resources/controllers', 'routes/controllers'], a: 0, why: 'Laravel adds the Http folder.', l: 'structure' },
    { t: 'tf', q: 'In Laravel, the public folder is the web entry point.', a: true, why: 'True, just like CodeIgniter.', l: 'structure' },
    { t: 'mcq', q: 'Which .env key tells Laravel which address the project expects?', o: ['APP_URL', 'APP_NAME', 'APP_ENV', 'DB_CONNECTION'], a: 0, why: 'APP_URL=http://localhost:8000.', l: 'env-run' },
    { t: 'id', q: 'Type the Artisan command that runs a local development server.', a: 'php artisan serve', why: '`php artisan serve` runs on http://127.0.0.1:8000.', l: 'env-run' },
    { t: 'mcq', q: 'How do Laravel config files get values that change per computer?', o: ['They read them from .env', 'They are edited by hand on every server', 'They read them from routes/web.php', 'From the database'], a: 0, why: '.env holds the values, and config/ reads them.', l: 'env-run' },
    { t: 'mcq', q: 'You see "Port already in use". What does it mean?', o: ['Another server is already using port 8000', 'Composer is not installed', 'The view is missing', '.env has a typo'], a: 0, why: 'Stop the other server or use another port.', l: 'env-run' },
    { t: 'fill', q: 'Import the Route facade at the top of web.php.', code: 'use Illuminate\\Support\\Facades\\_____;', a: 'Route', why: 'use Illuminate\\Support\\Facades\\Route;', l: 'routes' },
    { t: 'mcq', q: 'What is Route::view() useful for?', o: ['Returning a view directly for a simple page with no controller logic', 'Listing all views', 'Validating a form', 'Creating a controller'], a: 0, why: "Route::view('/about', 'about') returns the view directly.", l: 'routes' },
    { t: 'fill', q: 'Capture the task id from the URL.', code: "Route::get('/tasks/____', function ($id) { ... });", a: '{id}', why: 'Laravel names parameters in braces.', l: 'routes' },
    { t: 'id', q: 'Type the Artisan command that creates a controller named PageController.', a: 'php artisan make:controller PageController', why: 'make:controller creates app/Http/Controllers/PageController.php.', l: 'controllers' },
    { t: 'id', q: 'Type the Artisan command that shows registered routes.', a: 'php artisan route:list', alt: ['route:list'], why: '`php artisan route:list`.', l: 'controllers' },
    { t: 'mcq', q: 'Which command shows every available Artisan command?', o: ['php artisan list', 'php artisan help all', 'php artisan route:list', 'composer list'], a: 0, why: '`php artisan list`.', l: 'controllers' },
    { t: 'mcq', q: 'A route uses PageController but Laravel says the class does not exist. What is the likely mistake?', o: ['The controller was not imported with use in web.php', 'The view is missing', 'APP_URL is wrong', 'The port is in use'], a: 0, why: 'Forgetting to import the controller is a listed mistake.', l: 'controllers' },
    { t: 'mcq', q: 'What file name must the about view have?', o: ['about.blade.php', 'about.php', 'about.html', 'about.view.php'], a: 0, why: 'Blade views end in .blade.php.', l: 'blade' },
    { t: 'tf', q: '{!! $title !!} escapes the value before printing it.', a: false, why: 'False. {!! !!} prints raw output. Use {{ }} for user input.', l: 'blade' },
    { t: 'mcq', q: "With `return view('about', ['course' => 'IT0049']);`, how does the Blade view print the course?", o: ['{{ $course }}', "{{ $data['course'] }}", '<?= course ?>', '@course'], a: 0, why: 'Each key becomes a variable.', l: 'blade' },
    { t: 'mcq', q: 'Which is a Blade comment?', o: ['{{-- comment --}}', '<!-- comment -->', '// comment', '# comment'], a: 0, why: 'Blade comments are not sent to the browser.', l: 'blade' },
    { t: 'order', q: 'Put the steps for building the About page in order.', o: ['php artisan make:controller PageController', 'Write the about() method that returns view(\'about\', $data)', 'Create resources/views/about.blade.php', "Add Route::get('/about', [PageController::class, 'about'])", 'Visit /about'], why: 'Generate the controller, write the method, create the view, connect the route, test.', l: 'controllers' }
  ]
};
