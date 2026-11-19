import { flow } from './flows.js';
const R = String.raw;

export default {
  id: 'm7', code: 'M7', track: 'lv',
  title: 'Laravel Forms, Validation and File Upload',
  summary: 'Build form routes, validate requests and show feedback, update records with route model binding, and validate, store, display and replace uploaded files.',
  objectives: [
    'Build Laravel form submission routes',
    'Use request validation and display validation feedback',
    'Redisplay old input after validation errors',
    'Update records through controller methods',
    'Validate, store, display and replace uploaded files safely'
  ],
  layers: { routes: 'named routes, PATCH', controller: '$request->validate()', model: 'store() on the public disk', view: '@error, old()', security: '@csrf, file rules' },
  lessons: [
    {
      id: 'form-routes', title: 'Two routes per form', sub: 'GET shows, POST submits',
      lead: 'A form workflow usually needs one route to show the form and another to receive the submitted data. The controller validates the input before storing or updating records.',
      flow: flow('lv', ['routes'], { url: 'POST /tasks', over: { routes: ['routes/web.php', 'tasks.store', "Route::post('/tasks', ...)->name('tasks.store')"], controller: ['TaskController', 'store()', 'Validates, then saves.'], model: ['Task', 'create()', 'Saves validated fields.'], view: ['tasks/create.blade.php', 'form', 'Posts to route(\'tasks.store\').'] } }),
      code: [{
        name: 'Terminal', lang: 'sh',
        src: R`php artisan make:controller TaskController
# INFO Controller created successfully.`,
        notes: [['make:controller TaskController', 'Generate the controller first', 'Then register the GET and POST routes before verifying them with route:list.']]
      }, {
        name: 'web.php', path: 'routes/web.php', lang: 'php',
        src: R`use App\Http\Controllers\TaskController;

Route::get('/tasks/create',
    [TaskController::class, 'create']
)->name('tasks.create');

Route::post('/tasks',
    [TaskController::class, 'store']
)->name('tasks.store');`,
        notes: [
          ["Route::get('/tasks/create'", 'GET displays the form', 'TaskController@create returns the form view.'],
          ["->name('tasks.create')", 'A named route', "Naming a route lets views build its URL with route('tasks.create'), even if the path changes later."],
          ['Route::post(', 'POST sends the input', 'The form submits here, and store() validates the data.']
        ]
      }],
      body: [
        ['p', 'Laravel protects web forms from **cross-site request forgery**. Every POST, PUT, PATCH or DELETE form in web routes should include `@csrf`. Without it, Laravel rejects the form submission.']
      ],
      check: { q: 'What does `->name(\'tasks.store\')` give you?', o: ["A name you can use with route('tasks.store') to build the URL", 'A new database table', 'A controller method', 'CSRF protection'], a: 0, why: "Named routes let views build URLs with route('tasks.store')." },
      twin: 'resource-routes'
    },
    {
      id: 'store-validate', title: 'The create form and request validation', sub: '@csrf, Request and validate()',
      lead: 'The form posts to the named store route. Laravel can inject the current HTTP request into the controller method, and validate() checks it before anything is saved.',
      code: [{
        name: 'create.blade.php', path: 'resources/views/tasks/create.blade.php', lang: 'blade',
        src: R`<form method="POST" action="{{ route('tasks.store') }}">
    @csrf
    <label>Title</label>
    <input name="title" value="{{ old('title') }}">
    <button type="submit">Save</button>
</form>`,
        notes: [
          ["route('tasks.store')", 'Post to the named route', 'Builds the URL of the store route.'],
          ['@csrf', 'The CSRF token', 'Required on every POST, PUT, PATCH or DELETE form. Missing @csrf is a listed mistake.'],
          ["old('title')", 'Keep the typed value', 'Restores what the user typed after a failed submission.']
        ]
      }, {
        name: 'TaskController.php', path: 'app/Http/Controllers/TaskController.php', lang: 'php',
        src: R`use Illuminate\Http\Request;

public function store(Request $request)
{
    $validated = $request->validate([
        'title' => ['required', 'string', 'max:100'],
    ]);

    Task::create($validated);

    return redirect()->route('tasks.index');
}`,
        notes: [
          ['Request $request', 'Request injection', 'Laravel passes the current HTTP request into the method.'],
          ['$request->validate([', 'Validate before saving', 'If validation fails, Laravel automatically redirects back with errors and old input. The lines below never run.'],
          ["['required', 'string', 'max:100']", 'Rules as an array', 'Rules should match the table columns and the application requirements.'],
          ['Task::create($validated)', 'Save only validated fields', 'create() uses the validated array and the model’s $fillable list.']
        ]
      }],
      check: { q: 'What happens when `$request->validate()` fails?', o: ['Laravel redirects back with errors and old input automatically', 'The method continues and saves anyway', 'Laravel shows a 404 page', 'You must call redirect()->back() yourself'], a: 0, why: 'validate() handles the redirect for you. In CodeIgniter you wrote the redirect yourself.' },
      watch: ['Missing @csrf', 'Wrong form method or action'],
      twin: 'validate'
    },
    {
      id: 'feedback', title: 'Showing validation feedback', sub: '@error, $message and old()',
      lead: 'Blade can show errors beside the field that failed, and old() restores what the user typed. The form becomes easy to correct without starting over.',
      code: [{
        name: 'create.blade.php', path: 'resources/views/tasks/create.blade.php', lang: 'blade',
        src: R`<input name="title" value="{{ old('title') }}">
@error('title')
    <p class="error">{{ $message }}</p>
@enderror`,
        notes: [
          ["@error('title')", 'Does the field have an error?', '@error checks whether the title field failed validation.'],
          ['{{ $message }}', 'Laravel’s message', 'Inside @error, $message holds the validation message for that field.'],
          ['@enderror', 'Close the block', 'Every @error needs @enderror.']
        ],
        added: true
      }],
      body: [
        ['list', ["`@error('title')` checks whether the title field has an error.", '`{{ $message }}` prints Laravel’s validation message.', "`old('title')` restores what the user typed after a failed submission."], 'From the slides'],
        ['note', 'A good form workflow protects the database, guides the user, and keeps the input visible when something needs correction.', 'Remember']
      ],
      check: { q: 'Inside @error(\'title\') ... @enderror, which variable holds the error text?', o: ['$message', '$error', '$errors', '$title'], a: 0, why: '{{ $message }} prints the validation message.' },
      twin: 'field-error'
    },
    {
      id: 'edit-update', title: 'Edit and update', sub: 'Route model binding and PATCH',
      lead: 'The edit page loads an existing record, the form shows its current values, and the update route receives and validates the edited values.',
      flow: flow('lv', ['routes', 'controller'], { url: 'PATCH /tasks/2', over: { routes: ['routes/web.php', 'tasks.update', "Route::patch('/tasks/{task}', ...)"], controller: ['TaskController', 'update()', 'Validates, then $task->update($validated).'], model: ['Task', '{task} binding', 'Laravel finds the Task from the URL value.'], view: ['tasks/edit.blade.php', '@method(\'PATCH\')', 'The form posts with a hidden PATCH method.'] } }),
      code: [{
        name: 'web.php', path: 'routes/web.php', lang: 'php',
        src: R`Route::get('/tasks/{task}/edit',
    [TaskController::class, 'edit']
)->name('tasks.edit');

Route::patch('/tasks/{task}',
    [TaskController::class, 'update']
)->name('tasks.update');

Route::post('/tasks/{task}/upload',
    [TaskController::class, 'upload']
)->name('tasks.upload');`,
        notes: [
          ['{task}/edit', 'The URL value selects the record', 'Naming the parameter {task} lets Laravel find the matching Task automatically.'],
          ['Route::patch(', 'PATCH for updates', 'Updates use PATCH. HTML forms can only send GET or POST, so the form adds @method(\'PATCH\').'],
          ["'upload'", 'A separate upload route', 'Used in the next lesson.']
        ]
      }, {
        name: 'TaskController.php', path: 'app/Http/Controllers/TaskController.php', lang: 'php',
        src: R`use App\Models\Task;

public function edit(Task $task)
{
    return view('tasks.edit', [
        'task' => $task,
    ]);
}

public function update(Request $request, Task $task)
{
    $validated = $request->validate([
        'title' => ['required', 'string', 'max:100'],
    ]);

    $task->update($validated);

    return redirect()->route('tasks.index');
}`,
        notes: [
          ['edit(Task $task)', 'Route model binding', 'Type-hinting Task $task makes Laravel load the record whose id is in the URL. No find() call needed.'],
          ["'task' => $task", 'Send the record to Blade', 'The form shows the current values.'],
          ['$task->update($validated)', 'Validate first, then save', 'Updates the record with the validated fields.']
        ]
      }, {
        name: 'edit.blade.php', path: 'resources/views/tasks/edit.blade.php', lang: 'blade',
        src: R`<form method="POST" action="{{ route('tasks.update', $task) }}">
    @csrf
    @method('PATCH')
    <input name="title" value="{{ old('title', $task->title) }}">
    <button type="submit">Update</button>
</form>`,
        notes: [
          ["route('tasks.update', $task)", 'URL for this task', 'Passing $task fills in the {task} parameter.'],
          ["@method('PATCH')", 'Spoof the PATCH method', 'Adds a hidden field so Laravel treats the POST as the PATCH the route expects. Forgetting it is a listed mistake.'],
          ["old('title', $task->title)", 'Failed input, then saved value', 'Same idea as CodeIgniter’s old() with a fallback.']
        ]
      }],
      body: [
        ['table', ['Step', 'CodeIgniter', 'Laravel'], [
          ['Show the form', 'Controller method returns the view', 'GET route + controller method'],
          ['Validate input', '`$this->validate($rules)`', '`$request->validate([...])`'],
          ['Return errors to the view', '`validation_show_error()`', '`@error` and `old()` in Blade'],
          ['Update the record', '`$model->update($id, $data)`', 'Eloquent `$task->update([...])`']
        ], 'CI vs. Laravel form workflow']
      ],
      check: { q: 'Why does the edit form include `@method(\'PATCH\')`?', o: ['HTML forms can only send GET or POST, and the update route expects PATCH', 'It adds the CSRF token', 'It validates the title', 'It uploads a file'], a: 0, why: "@method('PATCH') adds a hidden field so Laravel routes the POST to Route::patch." },
      watch: ["Forgetting @method('PATCH')"],
      twin: 'update-delete'
    },
    {
      id: 'upload', title: 'Upload form and file validation', sub: 'enctype and file rules',
      lead: 'The upload form points to the upload route, and enctype makes the browser send the file bytes. File validation should restrict type and size before storage.',
      code: [{
        name: 'edit.blade.php', path: 'resources/views/tasks/edit.blade.php', lang: 'blade',
        src: R`<form method="POST"
      action="{{ route('tasks.upload', $task) }}"
      enctype="multipart/form-data">
    @csrf
    <label>Attachment</label>
    <input type="file" name="attachment">
    <button type="submit">Upload</button>
</form>`,
        notes: [
          ['enctype="multipart/form-data"', 'Send the file bytes', 'No enctype means no file. A listed mistake.'],
          ["route('tasks.upload', $task)", 'The upload route', 'POST /tasks/{task}/upload.']
        ]
      }, {
        name: 'TaskController.php', path: 'app/Http/Controllers/TaskController.php', lang: 'php',
        src: R`$validated = $request->validate([
    'attachment' => [
        'nullable',
        'image',
        'mimes:jpg,jpeg,png',
        'max:2048',
    ],
]);`,
        notes: [
          ["'nullable'", 'Optional', 'The field may be left empty.'],
          ["'image'", 'Must be an image', 'Rejects non-image files.'],
          ["'mimes:jpg,jpeg,png'", 'Allowed types', 'Only these extensions/types.'],
          ["'max:2048'", 'Size limit', 'max:2048 means 2048 KB, about 2 MB.']
        ]
      }],
      check: { q: 'In Laravel file validation, what does `max:2048` mean?', o: ['At most 2048 KB (about 2 MB)', 'At most 2048 pixels wide', 'At most 2048 files', 'At most 2048 characters in the name'], a: 0, why: 'For files, max is in kilobytes.' },
      watch: ['No enctype for file upload', 'Saving files before validation']
    },
    {
      id: 'storage', title: 'Storing, showing and replacing files', sub: 'store(), storage:link, Storage::delete',
      lead: 'Save the file on the public disk, save only its path on the record, then show it through /storage. When a replacement arrives, delete the old file after the new one is accepted.',
      flow: flow('lv', ['controller'], { url: 'POST /tasks/3/upload', over: { controller: ['TaskController', 'upload()', "store('attachments', 'public') then $task->update(['attachment' => $path])."], model: ['Task', 'attachment', 'Stores the path only.'], view: ['tasks/show.blade.php', 'asset()', "asset('storage/'.$task->attachment)"] } }),
      code: [{
        name: 'TaskController.php', path: 'app/Http/Controllers/TaskController.php', lang: 'php',
        src: R`if ($request->hasFile('attachment')) {
    if ($task->attachment) {
        Storage::disk('public')
            ->delete($task->attachment);
    }

    $path = $request->file('attachment')
        ->store('attachments', 'public');

    $task->update([
        'attachment' => $path,
    ]);
}

return redirect()->route('tasks.show', $task);`,
        notes: [
          ['hasFile(', 'Was a file submitted?', 'Only run the storage code when a file actually arrived.'],
          ['Storage::disk', 'Remove the old file', "When replacing, delete the old file from the public disk. The slides' safe order: delete old files only after the replacement is accepted."],
          ["->store('attachments', 'public')", 'Save on the public disk', 'Generates a safe filename and saves it in storage/app/public/attachments. Returns the path.'],
          ["'attachment' => $path", 'Save only the path', 'The task record already exists, so update() adds the attachment field.']
        ]
      }, {
        name: 'Terminal', lang: 'sh',
        src: R`php artisan storage:link`,
        notes: [['storage:link', 'Expose the public disk', 'Creates a link so files on the public disk can be reached through /storage in the browser. Run it once per project.']]
      }, {
        name: 'show.blade.php', path: 'resources/views/tasks/show.blade.php', lang: 'blade',
        src: R`@if ($task->attachment)
    <img
        src="{{ asset('storage/'.$task->attachment) }}"
        alt="Task attachment"
        width="120"
    >
@endif`,
        notes: [["asset('storage/'", 'Build the public URL', 'After storage:link, public-disk files are shown under /storage.']]
      }, {
        name: 'Image prepare', path: 'TaskController.php (optional)', lang: 'php',
        src: R`use Intervention\Image\Laravel\Facades\Image;

$name = uniqid('avatar_') . '.jpg';
$path = storage_path('app/public/attachments/' . $name);

Image::read($request->file('attachment'))
    ->cover(300, 300)
    ->save($path);`,
        notes: [
          ['use Intervention', 'An image package', 'The slides use the Intervention Image package to resize or crop after validation.'],
          ['->cover(300, 300)', 'Crop to 300 × 300', 'Like CodeIgniter’s fit(300, 300, \'center\').']
        ]
      }],
      check: { q: 'Uploaded images return 404 at /storage/... What did you probably forget?', o: ['php artisan storage:link', '@csrf', 'php artisan migrate:fresh', "@method('PATCH')"], a: 0, why: 'storage:link exposes the public disk through /storage.' },
      twin: 'store-file'
    },
    {
      id: 'form-request', title: 'Form Requests and the safe upload checklist', sub: 'make:request and good habits',
      lead: 'For longer validation rules, move the rules into a Form Request class so the controller stays clean.',
      code: [{
        name: 'Terminal', lang: 'sh',
        src: R`php artisan make:request UpdateTaskRequest`,
        notes: [['make:request', 'Generate a Form Request', 'Creates a class whose rules() method returns the validation rules.']]
      }, {
        name: 'UpdateTaskRequest.php', path: 'app/Http/Requests/UpdateTaskRequest.php', lang: 'php',
        src: R`public function rules(): array
{
    return [
        'title' => ['required', 'string', 'max:100'],
    ];
}`,
        notes: [['rules()', 'The rules live here', 'Type-hint UpdateTaskRequest instead of Request in the controller method and the rules run automatically.']]
      }],
      body: [
        ['steps', ['Validate the file (`nullable`, `image`, `max:2048`).', 'Do not trust the original filename.', 'Prepare the image size before display.', 'Store the file and save only the generated path.', 'Display it safely with `asset(\'storage/...\')`.', 'Delete old files only after the replacement succeeds.'], 'Safe upload order'],
        ['note', 'GET shows forms. POST/PATCH submit data. validate() redirects with errors. old() keeps user input. Storage manages uploaded files.', 'Key takeaways']
      ],
      check: { q: 'What is a Form Request class for?', o: ['Moving long validation rules out of the controller', 'Sending email', 'Creating tables', 'Listing routes'], a: 0, why: 'Form Requests keep controllers clean by holding the rules.' }
    }
  ],
  mistakes: [
    'Missing @csrf',
    'Wrong form method or action',
    "Forgetting @method('PATCH')",
    'No enctype for file upload',
    'Saving files before validation'
  ],
  takeaways: [
    'GET shows forms',
    'POST/PATCH submits data',
    'validate() redirects with errors',
    'old() keeps user input',
    'Storage manages uploaded files'
  ],
  quiz: [
    { t: 'mcq', q: 'Which HTTP method displays a form page?', o: ['GET', 'POST', 'PATCH', 'DELETE'], a: 0, why: 'GET displays the form. POST sends the input.', l: 'form-routes' },
    { t: 'fill', q: 'Name the store route.', code: "Route::post('/tasks', [TaskController::class, 'store'])->____('tasks.store');", a: 'name', why: '->name() gives the route a name.', l: 'form-routes' },
    { t: 'mcq', q: 'Which forms need @csrf in Laravel web routes?', o: ['Every POST, PUT, PATCH or DELETE form', 'Only login forms', 'Only GET forms', 'Only file upload forms'], a: 0, why: 'Without @csrf, Laravel rejects the submission.', l: 'form-routes' },
    { t: 'id', q: 'Type the Blade directive that adds the CSRF token to a form.', a: '@csrf', why: '@csrf adds the hidden token.', l: 'store-validate' },
    { t: 'mcq', q: 'How does the store() method receive the submitted form?', o: ['Laravel injects Request $request', 'From $_POST', 'From session()', 'From the route name'], a: 0, why: 'public function store(Request $request).', l: 'store-validate' },
    { t: 'tf', q: 'If $request->validate() fails, the next line of store() still runs.', a: false, why: 'False. Laravel redirects back with errors and old input automatically.', l: 'store-validate' },
    { t: 'mcq', q: "Which rule means 'no more than 100 characters' in Laravel?", o: ['max:100', 'max_length[100]', 'size(100)', 'limit:100'], a: 0, why: 'Laravel uses max:100. CodeIgniter uses max_length[100].', l: 'store-validate' },
    { t: 'fill', q: 'Show the title error.', code: "@error('title')\n    <p>{{ ________ }}</p>\n@enderror", a: '$message', why: '$message holds the validation message.', l: 'feedback' },
    { t: 'mcq', q: "What does `old('title')` do in a Laravel form?", o: ['Restores what the user typed after a failed submission', 'Shows the oldest task', 'Reverts the database', 'Shows the previous route'], a: 0, why: 'Same helper name as CodeIgniter.', l: 'feedback' },
    { t: 'mcq', q: 'In `public function edit(Task $task)`, how does Laravel find the task?', o: ['Route model binding: it loads the Task whose id is in the {task} URL segment', 'It calls Task::all()', 'It reads the session', 'It cannot; you must call find()'], a: 0, why: 'Type-hinting the model with a matching {task} parameter loads the record.', l: 'edit-update' },
    { t: 'id', q: 'Type the Blade directive that makes a POST form act as a PATCH request.', a: "@method('PATCH')", why: "@method('PATCH') adds the hidden method field.", l: 'edit-update' },
    { t: 'mcq', q: 'Which route definition receives the edit form?', o: ["Route::patch('/tasks/{task}', [TaskController::class, 'update'])", "Route::get('/tasks/{task}', [TaskController::class, 'update'])", "Route::post('/tasks/{task}/edit', [TaskController::class, 'edit'])", "Route::delete('/tasks/{task}', [TaskController::class, 'update'])"], a: 0, why: 'Updates use PATCH to tasks.update.', l: 'edit-update' },
    { t: 'mcq', q: 'Which Eloquent call saves validated changes to an existing task?', o: ['$task->update($validated)', 'Task::create($validated)', '$task->save($validated)', 'Task::update($id)'], a: 0, why: '$task->update($validated).', l: 'edit-update' },
    { t: 'mcq', q: 'Which rule list accepts an optional JPG or PNG image up to about 2 MB?', o: ["['nullable', 'image', 'mimes:jpg,jpeg,png', 'max:2048']", "['required', 'max_size[2048]']", "['uploaded', 'mime_in[jpg]']", "['image', 'size:2']"], a: 0, why: 'This is the rule list from the slides.', l: 'upload' },
    { t: 'tf', q: 'A file upload form works without enctype="multipart/form-data".', a: false, why: 'False. No enctype means the file bytes are never sent.', l: 'upload' },
    { t: 'id', q: 'Type the Artisan command that exposes the public disk through /storage.', a: 'php artisan storage:link', alt: ['storage:link'], why: '`php artisan storage:link`.', l: 'storage' },
    { t: 'mcq', q: "What does `->store('attachments', 'public')` return?", o: ['The stored file path', 'The file bytes', 'true or false', 'The original filename'], a: 0, why: 'Save that path on the record.', l: 'storage' },
    { t: 'mcq', q: 'Which call checks that a file was submitted?', o: ["$request->hasFile('attachment')", "$request->file('attachment')->exists()", "old('attachment')", "Storage::exists('attachment')"], a: 0, why: 'hasFile() returns true when a file arrived.', l: 'storage' },
    { t: 'fill', q: 'Build the image URL in Blade.', code: "<img src=\"{{ _____('storage/'.$task->attachment) }}\">", a: 'asset', why: "asset('storage/...') builds the public URL.", l: 'storage' },
    { t: 'mcq', q: 'When replacing an attachment, when should the old file be deleted?', o: ['Only after the new file is accepted', 'Before validation', 'Never', 'Before the form is shown'], a: 0, why: 'Delete old files only after the replacement succeeds.', l: 'storage' },
    { t: 'id', q: 'Type the Artisan command that creates a Form Request named UpdateTaskRequest.', a: 'php artisan make:request UpdateTaskRequest', why: '`php artisan make:request UpdateTaskRequest`.', l: 'form-request' },
    { t: 'order', q: 'Put the safe upload order in sequence.', o: ['Validate the file', 'Store it on the public disk', 'Save the generated path on the record', 'Display it with asset(\'storage/...\')', 'Delete the old file once the replacement succeeded'], why: 'Validate, store, save the path, display safely, clean up old files.', l: 'form-request' }
  ]
};
