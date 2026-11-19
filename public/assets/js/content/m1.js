import { flow } from './flows.js';
const R = String.raw;

export default {
  id: 'm1', code: 'M1', track: 'ci',
  title: 'CodeIgniter Foundations',
  summary: 'What a framework is, how MVC splits an app into three jobs, and your first CodeIgniter route, controller and view.',
  objectives: [
    'Explain what a web application framework is and why developers use one',
    'Describe how MVC separates data, logic and presentation',
    'Install CodeIgniter 4 with Composer and recognize its folder structure',
    'Create routes, a controller and a view, and pass data between them'
  ],
  layers: { routes: 'Routes.php, (:num) placeholders', controller: 'Pages::about, index()', model: '', view: 'view() with a $data array', security: 'public/ as document root' },
  lessons: [
    {
      id: 'request-response', title: 'Every page load is a request and a response', sub: 'What a web application is',
      lead: "A web application is a program that runs on a server and is used through a web browser. Nothing gets installed on the user's device.",
      plain: 'Think of a counter at a restaurant. The browser places an order (the request), the server prepares it, and hands back a tray of HTML (the response).',
      flow: flow('ci', 'browser'),
      body: [
        ['steps', [
          'The browser asks for a page. This is the **request**.',
          'The server figures out what to send back.',
          'The server replies with HTML the browser can display. This is the **response**.'
        ], 'Every visit follows the same pattern'],
        ['note', 'The browser never talks to your PHP code directly. It only sends a request and waits for a response. Everything you build in this course lives on the server side of that exchange.', 'Key idea']
      ],
      check: { q: 'In the request-response cycle, what does the server send back to the browser?', o: ['HTML the browser can display', 'The PHP source code of the page', 'A copy of the database', 'Nothing until the user installs the app'], a: 0, why: 'The server runs your PHP and replies with HTML. The browser only ever sees the response, never your PHP code.' }
    },
    {
      id: 'why-framework', title: 'Why use a framework?', sub: 'Plain PHP vs. a framework',
      lead: 'Writing every page in plain PHP means solving the same problems again and again: routing URLs, talking to the database safely, checking user input and organizing files.',
      plain: 'A framework is like a building that already has plumbing and wiring. You still design the rooms, but you do not lay every pipe yourself.',
      body: [
        ['p', 'A **framework** is a pre-built structure and toolkit that handles the repetitive, easy-to-get-wrong parts, so you can focus on what makes your application unique.'],
        ['compare', ['Plain PHP, page by page', [
          'One `.php` file per URL, each with its own copy-pasted setup',
          'Database code, validation and HTML mixed together',
          'Security checks are easy to forget on any given page',
          'No shared convention for where anything lives'
        ]], ['With a framework', [
          'URLs are mapped to code in one place: the routes file',
          'Data, logic and display are kept in separate, predictable files',
          'Common security and validation tools are built in',
          'Every CodeIgniter project shares the same folder layout'
        ]]],
        ['note', 'That is the trade a framework offers: a little structure to learn, in exchange for a lot of repeated work you never have to do again.', 'The trade-off']
      ],
      check: { q: 'Which of these is a benefit of using a framework instead of plain PHP pages?', o: ['URLs are mapped to code in one routes file', 'Each page gets its own copy-pasted setup', 'HTML and database code live in the same file', 'There are no folder conventions to follow'], a: 0, why: 'A framework maps every URL in one routes file. The other options describe plain PHP page-by-page development.' }
    },
    {
      id: 'mvc', title: 'MVC splits the app into three jobs', sub: 'Model, View, Controller',
      lead: 'Model-View-Controller organizes an application by splitting it into three areas of responsibility. Each part has exactly one job, so a change to one rarely breaks the others.',
      plain: 'In a restaurant, the kitchen (Model) handles the food, the plate (View) is what the customer sees, and the waiter (Controller) takes the order, talks to the kitchen and brings the plate.',
      flow: flow('ci', ['controller', 'model', 'view']),
      body: [
        ['table', ['Role', 'Its one job', 'In CodeIgniter'], [
          ['**Model**', "Manages the data. Talks to the database (retrieve, insert, update, delete) and holds business rules, like what counts as a valid price. Knows nothing about HTML.", 'A PHP class in `app/Models`'],
          ['**View**', 'What the user sees. An HTML template with small bits of PHP to display data. Does not fetch data or make decisions.', 'A `.php` file in `app/Views`'],
          ['**Controller**', 'The coordinator. Receives the request, asks the Model for data, sends that data to a View and returns the response.', 'A PHP class in `app/Controllers`']
        ]],
        ['steps', [
          'The browser sends a request.',
          'The route sends it to a **Controller**.',
          'The Controller asks the **Model** for data, and the Model returns it.',
          'The **View** gets rendered with that data.',
          'The browser shows the finished page.'
        ], 'How a request flows through MVC'],
        ['note', 'The Controller is the only part that talks to both the Model and the View. The Model and the View never talk to each other directly.', 'Key idea'],
        ['list', [
          '**Easier to maintain:** fixing a display issue means editing a View, not hunting through database code.',
          '**Easier to work in a team:** one developer builds the View while another builds the Model.',
          '**Easier to test:** you can check the Model’s logic without a browser.',
          '**Easier to reuse:** the same Model can feed a web page, a mobile app or an API.'
        ], 'Why this separation matters'],
        ['note', 'MVC in one sentence: the Model holds the data, the View displays it, and the Controller decides what happens in between.', 'Remember']
      ],
      check: { q: 'Which MVC part should never fetch data from the database?', o: ['View', 'Model', 'Controller', 'None of them. All three can.'], a: 0, why: 'The View only displays what it is given. Fetching data is the Model’s job, and the Controller passes that data to the View.' }
    },
    {
      id: 'install', title: 'Installing CodeIgniter 4', sub: 'Prerequisites and Composer',
      lead: 'CodeIgniter is a free, open-source PHP framework built around MVC. It is lightweight, fast and well documented. Version 4 is a full rewrite of CodeIgniter 3.',
      body: [
        ['list', [
          '**PHP 8.1 or newer.** CodeIgniter 4 is a PHP framework, so PHP itself has to be installed.',
          '**Composer**, the PHP package manager used to install CodeIgniter. Optional if you download the framework files directly.',
          '**A local server stack** such as XAMPP, which gives you PHP and MySQL together.',
          '**A code editor** such as VS Code.'
        ], 'What you need first'],
        ['p', 'Composer downloads and manages the packages that make up a CodeIgniter project. You install it once per machine from getcomposer.org, then reuse it for every PHP project.'],
        ['p', 'Alternatively, download the CodeIgniter zip from codeigniter.com/download. In that case the `vendor/` folder is replaced by a `system/` folder.']
      ],
      code: [{
        name: 'Terminal', lang: 'sh',
        src: R`composer --version
# Composer version 2.9.1 2026-01-14 09:12:26

composer create-project codeigniter4/appstarter myproject
# Creating a "codeigniter4/appstarter" project
# Installing codeigniter4/framework...
# Generated optimized autoload files`,
        notes: [
          ['composer --version', 'Confirm Composer is installed', 'Prints the installed version. If the command is not recognized, Composer is not installed yet, or the terminal needs to be restarted.'],
          ['create-project', 'Create a new project', 'One command downloads CodeIgniter and sets up a ready-to-run folder named `myproject`. Run it from the folder where you keep your projects.']
        ]
      }],
      check: { q: 'What does `composer create-project codeigniter4/appstarter myproject` do?', o: ['Downloads CodeIgniter and creates a ready-to-run project folder named myproject', 'Starts the development server', 'Creates a controller named myproject', 'Installs PHP 8.1'], a: 0, why: 'create-project downloads the appstarter package and sets up a new project folder with the name you give it.' }
    },
    {
      id: 'structure', title: 'Project structure and the public folder', sub: 'Where everything lives',
      lead: 'Composer generates a full folder structure for you, but you will spend most of your time in just a few folders.',
      code: [{
        name: 'myproject/', lang: 'tree',
        src: R`myproject/
  app/
    Controllers/
    Models/
    Views/
    Config/
  public/
  writable/
  vendor/
  .env`,
        notes: [
          ['Controllers/', 'app/Controllers', 'The classes that receive requests and decide what to do.'],
          ['Models/', 'app/Models', 'The classes that talk to the database.'],
          ['Views/', 'app/Views', 'The HTML/PHP templates users see in their browsers.'],
          ['Config/', 'app/Config', 'Settings, including `Routes.php`.'],
          ['public/', 'The document root', 'The only folder your web server should point to. Its `.htaccess` rewrites every URL through `index.php`.'],
          ['writable/', 'Logs and cache', 'Where CodeIgniter writes logs and cache files.'],
          ['vendor/', 'Composer packages', 'Installed by Composer. If you downloaded CodeIgniter manually, this is a `system/` folder instead.'],
          ['.env', 'Local settings', 'Environment-specific settings for this machine, such as the base URL and database login.']
        ]
      }],
      body: [
        ['p', '`public/` is the **document root**: the only folder your web server should point to. Everything else (`app/`, `writable/`, `vendor/`) stays outside it, so it can never be opened directly from a browser URL.'],
        ['p', '`public/.htaccess` quietly rewrites every URL through `index.php`. That is what lets your routes work without `index.php` showing in the address bar.']
      ],
      check: { q: 'Which folder should the web server point to as the document root?', o: ['public/', 'app/', 'writable/', 'vendor/'], a: 0, why: 'Only public/ should be reachable from a browser. app/, writable/ and vendor/ stay outside it so their files cannot be opened by URL.' }
    },
    {
      id: 'run', title: 'Running the app locally', sub: 'php spark serve or XAMPP',
      lead: 'CodeIgniter ships with Spark, a command-line tool. Its serve command starts a quick local server, so you do not need a separate Apache setup while you develop.',
      code: [{
        name: 'Terminal', lang: 'sh',
        src: R`php spark serve
# CodeIgniter development server started
# Listening on http://localhost:8080
# Press Control-C to stop.`,
        notes: [
          ['php spark serve', "Spark's development server", 'Run this from inside your project folder. It serves the app without Apache or XAMPP.'],
          ['localhost:8080', 'The address to open', 'Visit http://localhost:8080 in your browser. Press Control-C in the terminal to stop the server.']
        ]
      }],
      body: [
        ['p', 'Alternatively, use the Apache server in XAMPP. Make sure the Apache service is running (click **Start** if needed).'],
        ['table', ['Server', 'Address to visit'], [
          ['`php spark serve`', '`http://localhost:8080`'],
          ['XAMPP Apache', '`http://localhost/your-folder-name/public`']
        ]],
        ['p', "CodeIgniter's **Welcome to CodeIgniter 4!** page confirms the install worked, before you have written a single line of your own code."]
      ],
      check: { q: 'What address does `php spark serve` use by default?', o: ['http://localhost:8080', 'http://localhost:8000', 'http://localhost/public', 'http://127.0.0.1:3000'], a: 0, why: 'Spark listens on port 8080. Laravel’s artisan serve is the one that uses port 8000.' }
    },
    {
      id: 'config', title: 'Initial configuration', sub: '.env, baseURL and indexPage',
      lead: 'CodeIgniter 4 needs a little configuration before it works correctly: the environment, the base URL, and removing index.php from URLs.',
      body: [
        ['steps', [
          'Rename the `env` file in the root folder to `.env`. It holds environment-specific settings.',
          'Open `.env` in a text editor.',
          'Set `CI_ENVIRONMENT` to `development` or `production`.',
          'Set `app.baseURL` to your address, usually `http://localhost/folder-name/` while developing.'
        ], 'Configuring the environment'],
        ['p', 'You can also set the base URL in `app/Config/App.php`. Values in `.env` give you more flexibility because they can differ per computer.'],
        ['note', 'Always use a trailing slash on your base URL.', 'Rule']
      ],
      code: [{
        name: '.env', lang: 'env',
        src: R`#--------------------------------------------
# ENVIRONMENT
#--------------------------------------------
CI_ENVIRONMENT = development

#--------------------------------------------
# APP
#--------------------------------------------
app.baseURL = 'http://localhost/folder-name/'`,
        notes: [
          ['CI_ENVIRONMENT', 'development or production', 'Use `development` on your own machine so you see detailed error pages.'],
          ['app.baseURL', 'Where the app lives', 'Tells CodeIgniter the address of the application. Note the trailing slash.']
        ]
      }, {
        name: 'App.php', path: 'app/Config/App.php', lang: 'php',
        src: R`public $baseURL = 'http://localhost/your-folder-name/';

public $indexPage = '';`,
        notes: [
          ['$baseURL', 'Base URL in App.php', 'Same setting as `app.baseURL` in `.env`. Always end it with a trailing slash.'],
          ['$indexPage', 'Remove index.php from URLs', "The default is `'index.php'`. Change it to an empty string so generated URLs do not include index.php."]
        ]
      }],
      check: { q: 'What should `$indexPage` be set to so URLs do not include index.php?', o: ["'' (an empty string)", "'index.php'", "'public'", "'/'"], a: 0, why: "Changing $indexPage from 'index.php' to an empty string removes index.php from the URLs CodeIgniter generates." }
    },
    {
      id: 'urls', title: 'Reading a CodeIgniter URL', sub: 'Base URL, URI, segments, query',
      lead: 'CodeIgniter URLs are segment-based. Knowing the parts of a URL makes routes much easier to read.',
      body: [
        ['table', ['Term', 'Example from https://www.example.com/blog/news/2022/10?page=2', 'What it means'], [
          ['Base URL', '`https://www.example.com/`', 'Written as `baseURL` in your code.'],
          ['URI path', '`/blog/news/2022/10`', 'The path relative to the base URL. Also called the URI string.'],
          ['Route path', '`/blog/news/2022/10`', 'What `Routes.php` matches against. If the base URL contains a subfolder, such as `https://www.example.com/blog/`, the route path is only the part after it.'],
          ['Query', '`page=2`', 'Usually comes from forms that use the GET method.']
        ], 'Terms'],
        ['table', ['Part', 'Example from https://domain-name/blog/post/20261231', 'What it is'], [
          ['Base URL', '`https://domain-name/`', 'The base URL of your CodeIgniter 4 application.'],
          ['Segment 1', '`blog`', 'The name of the Controller.'],
          ['Segment 2', '`post`', 'The name of the method in the Blog controller.'],
          ['Segment 3 … n', '`20261231`', 'The parameter value passed to that method.']
        ], 'Segments']
      ],
      check: { q: 'In https://domain-name/blog/post/20261231, what is segment 2?', o: ['post, the method name', 'blog, the controller name', '20261231, the parameter', 'domain-name, the base URL'], a: 0, why: 'Segment 1 is the controller (blog), segment 2 is the method (post), and segment 3 onward are parameters.' }
    },
    {
      id: 'routing', title: 'Routes connect URLs to controller methods', sub: 'Anatomy and placeholders',
      lead: 'Routing is how CodeIgniter decides which code runs for a URL. Every route lives in one file, app/Config/Routes.php, and CodeIgniter checks them top to bottom until one matches.',
      flow: flow('ci', 'routes'),
      code: [{
        name: 'Routes.php', path: 'app/Config/Routes.php', lang: 'php',
        src: R`$routes->get('/about', 'Pages::about');

$routes->get('/profile/(:num)', 'Pages::profile/$1');`,
        notes: [
          ["'/about'", 'A route has three parts', "`get` is the HTTP method (a normal page visit). `'/about'` is the URL pattern after your domain. `'Pages::about'` runs the `about()` method on the Pages controller."],
          ['(:num)', 'A placeholder for a parameter', 'For https://your-domain/profile/2026123, `(:num)` captures the number and `$1` passes it to `profile()` as its first argument.']
        ]
      }],
      body: [
        ['table', ['Placeholder', 'Matches'], [
          ['`(:any)`', 'All characters from that point to the end of the URI. This may include several segments.'],
          ['`(:segment)`', 'Any character except a forward slash, so the result stays one segment.'],
          ['`(:num)`', 'Any positive integer.'],
          ['`(:alpha)`', 'Any string of alphabetic characters.'],
          ['`(:alphanum)`', 'Any string of letters, digits, or a mix of both.'],
          ['`(:hash)`', 'Same as `(:segment)`, but makes it easy to see which routes use hashed ids.']
        ], 'Route placeholders']
      ],
      check: { q: 'Which placeholder can match several segments, like /a/b/c?', o: ['(:any)', '(:segment)', '(:num)', '(:hash)'], a: 0, why: '(:any) matches everything to the end of the URI, slashes included. (:segment) and (:hash) stop at a slash, and (:num) only matches integers.' },
      watch: ['A route defined with get() but visited a different way (for example by a POST form)']
    },
    {
      id: 'controllers', title: 'Writing your first controller', sub: 'Classes, actions and index()',
      lead: 'A controller is a PHP class. You create one class per group of related pages, and each public method inside it is an action a route can point to.',
      flow: flow('ci', 'controller', { over: { controller: ['Pages', 'about()', 'Each public method is an action. This one returns plain text for /about.'] } }),
      code: [{
        name: 'Pages.php', path: 'app/Controllers/Pages.php', lang: 'php',
        src: R`<?php

namespace App\Controllers;

class Pages extends BaseController
{
    public function index()
    {
        return 'This is an index page.';
    }

    public function about()
    {
        return 'This is the about page.';
    }
}`,
        notes: [
          ['namespace', 'The namespace line', 'Every controller in app/Controllers starts with `namespace App\\Controllers;`. Forgetting it is a common mistake.'],
          ['extends BaseController', 'Extends BaseController', "Every controller extends CodeIgniter's BaseController, which gives it helpful built-in tools."],
          ['function index', 'The index method', 'The first method to run when a route calls the controller without naming another one, for example `$routes->get(\'/\', \'Pages::index\');`.'],
          ['function about', 'An action', 'Visiting /about runs this method, and the browser shows "This is the about page."']
        ]
      }, {
        name: 'Routes.php', path: 'app/Config/Routes.php', lang: 'php',
        src: R`$routes->get('/', 'Pages::index');
$routes->get('/about', 'Pages::about');`,
        notes: [
          ["'/'", 'The home page', "`''` or `'/'` both point the site root to `Pages::index`."],
          ["'/about'", 'Connect the route', 'With the controller in place, this route now has somewhere to send the request.']
        ]
      }],
      body: [
        ['list', [
          'One class per group of related pages.',
          'Each public method is an action a route can point to.',
          'Every controller extends `BaseController`.',
          'Files live in `app/Controllers` and use the same name as the class, so `Pages` goes in `Pages.php`.'
        ], 'Rules']
      ],
      check: { q: 'Where must the Pages controller class be saved?', o: ['app/Controllers/Pages.php', 'app/Views/Pages.php', 'public/Pages.php', 'app/Config/Pages.php'], a: 0, why: 'Controllers live in app/Controllers, and the file name matches the class name.' },
      watch: ['Forgetting the namespace line in a controller']
    },
    {
      id: 'clean-url', title: 'Cleaning the URL', sub: 'Removing public/index.php/',
      lead: 'By default, CodeIgniter URLs look like http://domain-name/public/index.php/home, because all access must start from the public folder. You clean the URL by removing public/index.php/.',
      body: [
        ['compare', ['Method 1: move index.php and .htaccess', [
          'Open the `public` folder and find `index.php` and `.htaccess`.',
          'Move them out of `public` into your root folder.',
          "In the moved index.php, remove the `../` from the line that requires `app/Config/Paths.php`, so it reads `require FCPATH . 'app/Config/Paths.php';`",
          'Not recommended for applications that will be hosted.'
        ]], ['Method 2: a new .htaccess in the root', [
          'Create a new file in the root directory named `.htaccess`.',
          'Put the rewrite rules below in it.',
          'Safer for hosted CodeIgniter projects.'
        ]]]
      ],
      code: [{
        name: '.htaccess', path: 'project root', lang: 'plain',
        src: R`<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^(.*)$ public/$1 [L]
</IfModule>`,
        notes: [
          ['RewriteEngine On', 'Turn on URL rewriting', 'Requires Apache mod_rewrite, which XAMPP includes.'],
          ['RewriteRule', 'Send every request into public/', 'Whatever path the visitor asks for is quietly served from the public folder, so the URL no longer needs public/.']
        ]
      }],
      check: { q: 'Which way of cleaning the URL is safer for hosted projects?', o: ['Adding a new .htaccess in the root that rewrites to public/', 'Moving index.php and .htaccess out of public/', 'Renaming the public folder', 'Setting $baseURL to include public/'], a: 0, why: 'The slides recommend the root .htaccess rewrite for hosted projects. Moving index.php out of public/ is not recommended for hosting.' }
    },
    {
      id: 'views', title: 'Views and passing data', sub: 'view(), $data and multiple views',
      lead: 'Returning plain text from a controller works, but real pages need HTML. That is what a View is for: a .php file in app/Views that mixes HTML with small bits of PHP.',
      flow: flow('ci', 'view', { keys: ['browser', 'routes', 'controller', 'view'] }),
      code: [{
        name: 'Pages.php', path: 'app/Controllers/Pages.php', lang: 'php',
        src: R`public function about()
{
    $data = [
        'title' => 'Sample Page',
        'name'  => 'Pages',
    ];

    return view('header', $data)
        . view('menu')
        . view('main', $data)
        . view('footer');
}`,
        notes: [
          ['$data = [', 'An array of data for the view', 'view() takes an optional second argument: an array of data. Each key becomes a variable in the view.'],
          ["'name'  =>", 'Keys become variables', "The key 'name' becomes the `$name` variable the view can print. No extra wiring needed."],
          ["return view('header'", 'Several views, one response', 'Join view() calls with `.` so the controller returns one complete page.']
        ]
      }, {
        name: 'about.php', path: 'app/Views/about.php', lang: 'blade',
        src: R`<!DOCTYPE html>
<html>
<head>
    <title>About</title>
</head>
<body>
    <h1>About <?= $name ?></h1>
</body>
</html>`,
        notes: [
          ['<?= $name ?>', 'Print the variable', '`<?= ?>` prints a value. Starting in Module 2, wrap user data in `esc()` so it prints safely.']
        ]
      }],
      body: [
        ['p', 'A controller loads a view with `view(\'about\')`, which renders `app/Views/about.php`. Keeping HTML in Views instead of inside the controller keeps each file focused on one job.'],
        ['p', 'Views can live in sub-folders. Include the folder name when loading them: `view(\'directory-name/about\')` loads `app/Views/directory-name/about.php`.'],
        ['note', 'A route maps a URL to a controller method. The method gathers data and hands it to a view. The view renders the page the browser displays.', 'Putting it together']
      ],
      check: { q: "In `view('about', $data)`, what does `$data['name']` become inside the view?", o: ['The variable $name', 'The variable $data', "The string 'name'", 'Nothing until you call extract()'], a: 0, why: 'Each key of the data array becomes a variable with the same name inside the view.' },
      watch: ['The view file name not matching the string in view()', 'Editing a file but the browser still shows old output. Do a hard refresh.']
    }
  ],
  mistakes: [
    'Forgetting the namespace line in a controller',
    'The view file name not matching the string in view()',
    'Editing a file while the browser still shows old output (do a hard refresh)',
    'Defining a route with get() but visiting it in a way that does not match'
  ],
  takeaways: [
    'A framework removes repetitive work so you focus on your app',
    'MVC: Model = data, View = display, Controller = coordinator',
    'Routes.php connects a URL to a controller method',
    'view() renders a template, optionally with data'
  ],
  quiz: [
    { t: 'mcq', q: 'What is a web application?', o: ['A program that runs on a server and is used through a web browser', 'A program installed on each user’s computer', 'A database that stores HTML pages', 'A browser extension'], a: 0, why: 'A web application runs on the server and is used through the browser, with nothing to install on the user’s device.', l: 'request-response' },
    { t: 'tf', q: 'The browser sends requests directly to your PHP code and reads its source.', a: false, why: 'False. The browser only sends a request and waits for a response. It never talks to your PHP code directly.', l: 'request-response' },
    { t: 'mcq', q: 'Which MVC part holds business rules, such as what counts as a valid price?', o: ['Model', 'View', 'Controller', 'Routes.php'], a: 0, why: 'The Model manages data and holds its business rules.', l: 'mvc' },
    { t: 'mcq', q: 'Which MVC part is the coordinator that receives the request?', o: ['Controller', 'Model', 'View', '.htaccess'], a: 0, why: 'The Controller receives the request, asks the Model for data and sends it to a View.', l: 'mvc' },
    { t: 'tf', q: 'In MVC, the Model and the View talk to each other directly.', a: false, why: 'False. Only the Controller talks to both. The Model and the View never talk to each other directly.', l: 'mvc' },
    { t: 'mcq', q: 'Which is a benefit of separating MVC responsibilities?', o: ['The same Model can feed a web page, a mobile app or an API', 'Views can query the database faster', 'Controllers no longer need routes', 'You can skip validation'], a: 0, why: 'Reuse is one of the four benefits: maintain, team work, test, reuse.', l: 'mvc' },
    { t: 'id', q: 'Type the Composer command that creates a new CodeIgniter 4 project in a folder named myproject.', a: 'composer create-project codeigniter4/appstarter myproject', why: '`composer create-project codeigniter4/appstarter myproject` downloads CodeIgniter and sets up the folder.', l: 'install' },
    { t: 'mcq', q: 'What is the minimum PHP version for CodeIgniter 4 listed in the module?', o: ['PHP 8.1', 'PHP 7.0', 'PHP 5.6', 'PHP 9.0'], a: 0, why: 'The slides list PHP 8.1 or newer.', l: 'install' },
    { t: 'mcq', q: 'If you download CodeIgniter as a zip instead of using Composer, which folder replaces vendor/?', o: ['system/', 'public/', 'writable/', 'app/'], a: 0, why: 'A manual download has a system/ folder instead of vendor/.', l: 'install' },
    { t: 'id', q: 'Type the Spark command that starts the CodeIgniter development server.', a: 'php spark serve', why: '`php spark serve` starts a local server at http://localhost:8080.', l: 'run' },
    { t: 'mcq', q: 'What does public/.htaccess do?', o: ['Rewrites every URL through index.php so routes work without it in the address bar', 'Stores the database password', 'Lists all routes', 'Compresses images'], a: 0, why: 'It quietly rewrites every URL through index.php.', l: 'structure' },
    { t: 'tf', q: 'The app/ and writable/ folders should be inside the web server’s document root.', a: false, why: 'False. Only public/ is the document root, so app/ and writable/ can never be opened by URL.', l: 'structure' },
    { t: 'mcq', q: 'Which folder holds Routes.php?', o: ['app/Config', 'app/Controllers', 'public', 'writable'], a: 0, why: 'Routes.php lives in app/Config.', l: 'structure' },
    { t: 'mcq', q: 'Which file do you rename to .env during initial configuration?', o: ['env', 'App.php', 'index.php', 'Routes.php'], a: 0, why: 'Rename the env file in the root directory to .env.', l: 'config' },
    { t: 'fill', q: 'Set the environment for local development.', code: 'CI_ENVIRONMENT = ________', a: 'development', why: 'Use development on your own machine. The other option is production.', l: 'config' },
    { t: 'mcq', q: 'What must every base URL end with?', o: ['A trailing slash', 'index.php', 'A port number', 'public/'], a: 0, why: 'The slides say: always use a trailing slash on your base URL.', l: 'config' },
    { t: 'mcq', q: 'In https://www.example.com/blog/news/2022/10?page=2, which part is the query?', o: ['page=2', '/blog/news/2022/10', 'https://www.example.com/', 'blog'], a: 0, why: 'The query is the part after the question mark. It usually comes from GET forms.', l: 'urls' },
    { t: 'mcq', q: 'In a segment-based URL, what does segment 1 usually name?', o: ['The controller', 'The method', 'The parameter', 'The database'], a: 0, why: 'Segment 1 is the controller, segment 2 is the method, segment 3 onward are parameters.', l: 'urls' },
    { t: 'fill', q: 'Complete the route so it only accepts a numeric profile id.', code: "$routes->get('/profile/______', 'Pages::profile/$1');", a: '(:num)', why: '(:num) matches a positive integer, and $1 passes it to profile().', l: 'routing' },
    { t: 'mcq', q: 'What does (:segment) match?', o: ['Any characters except a forward slash', 'Everything to the end of the URI', 'Only numbers', 'Only letters'], a: 0, why: '(:segment) stops at a slash, so it always matches exactly one segment.', l: 'routing' },
    { t: 'mcq', q: "In `$routes->get('/about', 'Pages::about');`, what does `'Pages::about'` mean?", o: ['Run the about() method on the Pages controller', 'Load the view about.php from a Pages folder', 'Redirect to /pages/about', 'Create a Pages model'], a: 0, why: 'The action string names the controller and the method: Pages::about.', l: 'routing' },
    { t: 'mcq', q: 'What does every CodeIgniter controller extend?', o: ['BaseController', 'Model', 'FilterInterface', 'Controller'], a: 0, why: 'CodeIgniter controllers extend BaseController. (Laravel controllers extend Controller.)', l: 'controllers' },
    { t: 'order', q: 'Put the steps of a request through MVC in order.', o: ['The browser sends a request', 'The route sends it to a controller', 'The controller asks the model for data', 'The view is rendered with that data', 'The browser shows the page'], why: 'Browser → route → controller ↔ model → view → browser.', l: 'mvc' },
    { t: 'id', q: 'Type the helper function a controller calls to render a template.', a: 'view()', alt: ['view'], why: 'view() renders a file from app/Views, optionally with a data array.', l: 'views' },
    { t: 'mcq', q: 'Which way of cleaning the URL is NOT recommended for hosted applications?', o: ['Moving index.php and .htaccess from public/ to the root', 'Adding a root .htaccess with a RewriteRule to public/', 'Both are equally recommended', 'Neither works'], a: 0, why: 'Moving the files out of public/ is not recommended for hosted applications.', l: 'clean-url' },
    { t: 'tf', q: "`view('directory-name/about')` loads app/Views/directory-name/about.php.", a: true, why: 'True. Include the folder name when a view lives in a sub-folder.', l: 'views' },
    { t: 'mcq', q: 'You edited a view but the browser still shows the old page. What should you try first?', o: ['A hard refresh', 'Reinstall Composer', 'Rename the controller', 'Delete the writable folder'], a: 0, why: 'This is a listed common mistake. The browser is showing a cached copy, so do a hard refresh.', l: 'views' }
  ]
};
