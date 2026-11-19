import { flow } from './flows.js';
const R = String.raw;

export default {
  id: 'm3', code: 'M3', track: 'ci',
  title: 'Forms, Validation, File Upload and CRUD',
  summary: 'Build forms that post to controller methods, validate input with useful feedback, implement create, read, update and delete, and accept uploaded files safely.',
  objectives: [
    'Build CodeIgniter forms that send data to controller methods',
    'Validate form input and show useful feedback',
    'Implement create, read, update and delete workflows',
    'Accept and validate uploaded files safely',
    'Store a public filename and display the uploaded file'
  ],
  layers: { routes: 'GET /tasks/new, POST /tasks', controller: 'validate(), redirect()->back()', model: 'insert, update, delete', view: 'old(), validation_show_error()', security: 'csrf_field(), upload rules' },
  lessons: [
    {
      id: 'form-routes', title: 'Never trust user input: the form routes', sub: 'GET shows the form, POST receives it',
      lead: 'A form can send blank, incomplete, incorrect or unsafe values. Validation is the checkpoint between submitted data and saved data.',
      plain: 'Validation is the security guard who checks every bag before it goes into the building (the database).',
      flow: flow('ci', ['routes', 'controller'], { url: 'POST /tasks', over: { controller: ['Tasks::create', 'validate first', 'Validates the input, then asks the Model to save.'], model: ['TaskModel', 'insert()', 'Saves only after the data passes the rules.'], view: ['tasks/new.php', 'form', 'Shows the form, errors and old input.'] } }),
      body: [
        ['p', 'The **controller validates first**, and the Model saves only after the data passes the rules. In the task manager, the title must exist before a new task is inserted.'],
        ['p', 'Add two routes before testing the form: one shows the form, the other receives the POST request. Then run `php spark routes` to confirm they exist.']
      ],
      code: [{
        name: 'Routes.php', path: 'app/Config/Routes.php', lang: 'php',
        src: R`$routes->get('/tasks/new', 'Tasks::new');
$routes->post('/tasks', 'Tasks::create');`,
        notes: [
          ["get('/tasks/new'", 'Show the form', 'A normal visit (GET) to /tasks/new runs Tasks::new, which returns the form view.'],
          ['->post(', 'Receive the form', 'The form submits with POST to /tasks, which runs Tasks::create.']
        ]
      }, {
        name: 'Terminal', lang: 'sh',
        src: R`php spark routes
# GET   /tasks/new   Tasks::new
# POST  /tasks       Tasks::create`,
        notes: [['php spark routes', 'List your routes', 'Confirms both routes exist and shows which method each answers to.']]
      }, {
        name: 'new.php', path: 'app/Views/tasks/new.php', lang: 'blade',
        src: R`<form method="post" action="<?= site_url('tasks') ?>">
    <?= csrf_field() ?>
    <input type="text" name="title">
    <button type="submit">Add Task</button>
</form>`,
        notes: [
          ['method="post"', 'POST to the create route', "site_url('tasks') builds the full URL for /tasks."],
          ['csrf_field()', 'CSRF protection', 'Inserts a hidden field containing a CSRF token. This secures your form against Cross-Site Request Forgery.'],
          ['name="title"', 'The field name', 'The name here must match the name used in the validation rules.']
        ]
      }],
      check: { q: 'What does `<?= csrf_field() ?>` add to a form?', o: ['A hidden field with a CSRF token', 'A visible title input', 'A file input', 'A submit button'], a: 0, why: 'csrf_field() adds a hidden token so the server can reject forged requests.' },
      twin: 'csrf'
    },
    {
      id: 'validation', title: 'Validation rules', sub: 'Describe what counts as valid',
      lead: 'Validation rules describe what counts as valid for each field. If validation fails, return to the form with the previous input and the error messages.',
      code: [{
        name: 'Tasks.php', path: 'app/Controllers/Tasks.php', lang: 'php',
        src: R`public function create()
{
    $rules = [
        'title' => 'required|min_length[3]|max_length[150]',
    ];

    if (! $this->validate($rules)) {
        return redirect()->back()->withInput();
    }

    // Valid input can be saved here.
}`,
        notes: [
          ['required|min_length[3]', 'Rules joined with |', 'Each field gets a string of rules separated by pipes. The title must exist, be at least 3 and at most 150 characters.'],
          ['$this->validate($rules)', 'Run the rules', 'Checks the submitted data against the rules. Returns false when any rule fails.'],
          ['withInput()', 'Go back with the input', 'Redirects to the form and keeps what the user typed, so old() can show it again.']
        ]
      }],
      body: [
        ['table', ['Rule', 'Meaning'], [
          ['`required`', 'The field cannot be empty'],
          ['`min_length[3]`', 'At least 3 characters'],
          ['`max_length[150]`', 'No more than 150 characters'],
          ['`valid_email`', 'Must look like an email address'],
          ['`numeric`', 'Digits only'],
          ['`is_unique[tasks.title]`', 'No duplicate title in the table']
        ], 'Common validation rules'],
        ['p', 'See the CodeIgniter documentation for the complete list of rules. Read input through the request object (`$this->request->getPost(\'title\')`), not directly from a global variable like `$_POST`.']
      ],
      check: { q: 'Which rule rejects a title that already exists in the tasks table?', o: ['is_unique[tasks.title]', 'required', 'max_length[150]', 'numeric'], a: 0, why: 'is_unique[table.column] fails when the value already exists in that column.' },
      twin: 'validate'
    },
    {
      id: 'errors-old', title: 'Showing errors and keeping old input', sub: 'old() and validation_show_error()',
      lead: 'After a redirect with input, the view can print each field’s error and refill what the user typed.',
      code: [{
        name: 'new.php', path: 'app/Views/tasks/new.php', lang: 'blade',
        src: R`<form method="post" action="<?= site_url('tasks') ?>">
    <?= csrf_field() ?>
    <input type="text" name="title"
           value="<?= old('title') ?>">
    <?= validation_show_error('title') ?>
    <button type="submit">Add Task</button>
</form>`,
        notes: [
          ["old('title')", 'Keep the user’s input', 'Refills the field with what was submitted, so the user does not have to type it again after a failed validation.'],
          ["validation_show_error('title')", 'Show the field’s error', 'Prints the error message for the title field, right beside it.']
        ]
      }],
      body: [
        ['note', 'The field name in the validation rules and the field name in the form must match. A mismatch is one of the listed common mistakes.', 'Rule'],
        ['note', 'A good form workflow validates first, keeps the user’s input visible, and saves only after the data is validated.', 'Remember']
      ],
      check: { q: 'Which helper refills an input with the value the user submitted before validation failed?', o: ["old('title')", "validation_show_error('title')", "csrf_field()", "site_url('title')"], a: 0, why: 'old() returns the previously submitted value.' },
      watch: ['Mismatched form field names'],
      twin: 'field-error'
    },
    {
      id: 'create', title: 'CRUD and the Create step', sub: 'Validate, insert, redirect',
      lead: 'CRUD means four record actions. In CodeIgniter the controller receives the request and the Model performs the table operation.',
      body: [
        ['table', ['Letter', 'Action', 'What happens'], [
          ['C', 'Create', 'Adds a new row'],
          ['R', 'Read', 'Lists rows or shows one row'],
          ['U', 'Update', 'Changes an existing row'],
          ['D', 'Delete', 'Removes or deactivates a row']
        ], 'CRUD means four record actions']
      ],
      code: [{
        name: 'Tasks.php', path: 'app/Controllers/Tasks.php', lang: 'php',
        src: R`use App\Models\TaskModel;

public function create()
{
    if (! $this->validate(['title' => 'required'])) {
        return redirect()->back()->withInput();
    }

    $model = new TaskModel();
    $model->insert([
        'title'  => $this->request->getPost('title'),
        'status' => 'pending',
    ]);

    return redirect()->to('/tasks');
}`,
        notes: [
          ['$this->validate(', 'Validate first', 'Nothing is saved unless the title passes.'],
          ['->insert([', 'Insert a row', 'The Model adds a new row. Only columns listed in $allowedFields are saved.'],
          ["getPost('title')", 'Read the input safely', 'Read POST data through the request object instead of $_POST.'],
          ["redirect()->to('/tasks')", 'Back to the list', 'After saving, send the user to the task list.']
        ]
      }],
      check: { q: 'In create(), what must happen before $model->insert()?', o: ['Validation must pass', 'The view must be loaded', 'The session must be destroyed', 'The route must be deleted'], a: 0, why: 'Validate before save. Saving before validation is a listed mistake.' },
      watch: ['Saving before validation']
    },
    {
      id: 'update-delete', title: 'Read, update and delete', sub: 'One Model, one clear operation each',
      lead: 'The same TaskModel is used for every record action. In each controller method, create the model first, then call one clear model operation.',
      body: [
        ['compare', ['Unsafe shortcut', [
          'Save without validating',
          'Use the `$_POST` superglobal directly',
          'Delete with a normal link (it triggers a GET route)',
          'Repeat SQL code in views'
        ]], ['Clean flow', [
          'Validate in the controller',
          'Read request values safely',
          'Use POST for destructive work like updating or deleting',
          'Call Model methods only in controller or model code'
        ]]]
      ],
      code: [{
        name: 'Method map', path: 'TaskModel methods', lang: 'php',
        src: R`$model = new TaskModel();
$tasks = $model->findAll();
$task  = $model->find($id);
$model->update($id, $data);
$model->delete($id);`,
        notes: [
          ['findAll()', 'Read many', 'Every row.'],
          ['find($id)', 'Read one', 'One row by id.'],
          ['->update($id', 'Update one', 'Changes the row with that id.'],
          ['->delete($id)', 'Delete one', 'Removes the row with that id.']
        ]
      }, {
        name: 'edit()', path: 'app/Controllers/Tasks.php', lang: 'php',
        src: R`$model = new TaskModel();
$task = $model->find($id);

return view('tasks/edit', ['task' => $task]);`,
        notes: [["['task' => $task]", 'Load the record first', 'Load the record before showing the edit form. The edit view receives it as `$task`.']]
      }, {
        name: 'edit.php', path: 'app/Views/tasks/edit.php', lang: 'blade',
        src: R`<input name="title"
       value="<?= old('title', $task['title']) ?>">`,
        notes: [["old('title', $task['title'])", 'Failed input, then saved value', 'old() returns the failed input first (first parameter). If there is none, it falls back to the saved value from the database (second parameter).']]
      }, {
        name: 'update() / delete()', path: 'app/Controllers/Tasks.php', lang: 'php',
        src: R`$model = new TaskModel();

// update method
$model->update($id, [
    'title' => $this->request->getPost('title'),
]);

// delete method
$model->delete($id);

return redirect()->to('/tasks');`,
        notes: [
          ['$model->update($id, [', 'Update changes one row', 'The id usually comes from the second segment of the URL.'],
          ['$model->delete($id)', 'Delete removes one row', 'Send this through a POST form, never a plain link, because links use GET.']
        ]
      }],
      check: { q: 'Why should deleting a task use a POST form instead of a normal link?', o: ['Links send GET requests, and destructive work should use POST', 'Links cannot contain an id', 'POST is faster than GET', 'Delete only works in views'], a: 0, why: 'A plain link triggers a GET route. Destructive actions like delete should use POST.' },
      watch: ['Deleting records through GET links'],
      twin: 'update-delete'
    },
    {
      id: 'upload-form', title: 'Upload forms and file rules', sub: 'multipart/form-data and file validation',
      lead: 'A normal form will not send file bytes. Add the enctype attribute before using a file input.',
      code: [{
        name: 'upload.php', path: 'app/Views/tasks/upload.php', lang: 'blade',
        src: R`<form method="post"
      action="<?= site_url('tasks/' . $task['id'] . '/upload') ?>"
      enctype="multipart/form-data">
    <?= csrf_field() ?>
    <input type="file" name="attachment">
    <button type="submit">Upload</button>
</form>`,
        notes: [
          ['enctype="multipart/form-data"', 'Send the file bytes', 'Without multipart/form-data, the file never reaches the request.'],
          ['type="file"', 'The file field', "Its name, attachment, must match the name inside the validation rules."]
        ]
      }, {
        name: 'Tasks.php', path: 'app/Controllers/Tasks.php', lang: 'php',
        src: R`$rules = [
    'attachment' => [
        'rules' => [
            'uploaded[attachment]',
            'max_size[attachment,2048]',
            'mime_in[attachment,image/jpeg,image/png]',
        ],
    ],
];`,
        notes: [
          ['uploaded[attachment]', 'A file must arrive', 'File fields use uploaded, not required. Using required for a file is a listed mistake.'],
          ['max_size[attachment,2048]', 'Size limit', 'At most 2048 KB (about 2 MB).'],
          ['mime_in[', 'Allowed types', 'Only JPEG and PNG images are accepted.']
        ]
      }],
      body: [['p', 'File rules are file-specific, and the field name appears inside each rule.']],
      check: { q: 'Which validation rule makes sure a file was actually uploaded?', o: ['uploaded[attachment]', 'required', 'max_size[attachment,2048]', 'is_unique[attachment]'], a: 0, why: 'File fields use uploaded[field]. Using required instead of uploaded is a listed mistake.' },
      watch: ['Using required instead of uploaded for file fields']
    },
    {
      id: 'upload-handle', title: 'Handling the upload safely', sub: 'Random name, move, resize, save filename',
      lead: 'After validation, read the file, give it a safe random name, move it into public/uploads, optionally prepare the image, and save only the filename in the database.',
      flow: flow('ci', ['controller'], { url: 'POST /tasks/3/upload', over: { controller: ['Tasks::upload', 'move()', 'Validates, renames, moves into public/uploads, saves the filename.'], model: ['TaskModel', 'update()', "Stores only the filename in the attachment column."], view: ['tasks/show.php', '<img>', "Builds the URL with base_url('uploads/...')."] } }),
      code: [{
        name: 'upload()', path: 'app/Controllers/Tasks.php', lang: 'php',
        src: R`if (! $this->validateData([], $rules)) {
    return redirect()->back()->withInput();
}

$file = $this->request->getFile('attachment');
$newName = $file->getRandomName();

$uploadPath = FCPATH . 'uploads';
if (! is_dir($uploadPath)) {
    mkdir($uploadPath, 0775, true);
}
$file->move($uploadPath, $newName);

$image = service('image');
$image->withFile(FCPATH . 'uploads/' . $newName)
      ->fit(300, 300, 'center')
      ->save(FCPATH . 'uploads/' . $newName);

$model = new TaskModel();
$model->update($id, [
    'attachment' => $newName,
]);

return redirect()->to('/tasks/' . $id);`,
        notes: [
          ['validateData', 'Validate first', 'Run the file rules before touching the file.'],
          ["getFile('attachment')", 'Read the uploaded file object', 'The name matches the file input.'],
          ['getRandomName()', 'A safer filename', 'Generates a random server-side name. Never trust the user-supplied filename.'],
          ["FCPATH . 'uploads'", 'Inside public/', 'FCPATH points to the public folder, so files saved here can be shown in the browser.'],
          ['mkdir(', 'Create the folder if needed', 'Makes public/uploads the first time.'],
          ['->move(', 'Move the file', 'Moves the upload into public/uploads with the new name.'],
          ["service('image')", 'Prepare the image', 'Resize or crop before showing it as an avatar or product image.'],
          ['->fit(300, 300', 'Crop to 300 × 300', 'fit() resizes and crops around the center.'],
          ["'attachment' => $newName", 'Save only the filename', 'The database stores the name, never the file bytes. attachment must be in $allowedFields.']
        ]
      }, {
        name: 'show.php', path: 'app/Views/tasks/show.php', lang: 'blade',
        src: R`<?php $url = base_url('uploads/' . $task['attachment']); ?>
<img src="<?= esc($url, 'attr') ?>">`,
        notes: [
          ["base_url('uploads/'", 'Build the public URL', 'base_url() turns the stored filename into a URL under public/uploads.'],
          ["esc($url, 'attr')", 'Escape for an attribute', "The 'attr' context escapes the value safely for use inside an HTML attribute."]
        ]
      }],
      check: { q: 'Why call `$file->getRandomName()` instead of keeping the original filename?', o: ['A random server-side name is safer than a user-supplied one', 'Original filenames are always too long', 'It compresses the file', 'base_url() needs random names'], a: 0, why: 'Do not trust the user-supplied filename. A random name avoids collisions and unsafe names.' },
      watch: ['Saving to writable/ but trying to display it with base_url()'],
      twin: 'store-file'
    },
    {
      id: 'upload-checklist', title: 'Safe upload checklist', sub: 'Type, size, name, location, display',
      lead: 'Before accepting uploaded files, check type, size, name, storage location and display path.',
      body: [
        ['steps', [
          'The form uses `multipart/form-data`.',
          'The field name matches the validation rules.',
          '`uploaded`, `max_size` and `mime_in` validate the file.',
          'The file name is random, not user-supplied.',
          'The file is moved to the correct public folder.',
          'The image is prepared for display when needed.',
          'Only the filename or path is saved.',
          'The view builds the display URL safely.'
        ], 'Upload checklist'],
        ['note', 'Files saved in `writable/` cannot be shown with `base_url()`, because only `public/` is reachable from the browser. Move display files to `FCPATH . \'uploads\'`.', 'Watch out']
      ],
      check: { q: 'A file was saved in writable/uploads, but the <img> built with base_url() is broken. Why?', o: ['writable/ is outside public/, so the browser cannot reach it', 'base_url() only works for CSS', 'The image was not resized', 'The CSRF token expired'], a: 0, why: 'Only public/ is the document root. Move display files to FCPATH . \'uploads\'.' }
    }
  ],
  mistakes: [
    'Saving before validation',
    'Mismatched form field names',
    'Deleting records through GET links',
    'Using required instead of uploaded for files',
    'Saving to writable but displaying with base_url'
  ],
  takeaways: [
    'Validate before save',
    'old() keeps failed input visible',
    'Model methods perform CRUD',
    'Use random names for files',
    'Store filenames, not file bytes'
  ],
  quiz: [
    { t: 'mcq', q: 'Which route shows the Add Task form?', o: ["$routes->get('/tasks/new', 'Tasks::new');", "$routes->post('/tasks', 'Tasks::create');", "$routes->get('/tasks', 'Tasks::index');", "$routes->post('/tasks/new', 'Tasks::new');"], a: 0, why: 'GET /tasks/new shows the form. POST /tasks receives it.', l: 'form-routes' },
    { t: 'id', q: 'Type the Spark command that lists your routes.', a: 'php spark routes', why: '`php spark routes` confirms your routes exist.', l: 'form-routes' },
    { t: 'mcq', q: 'What does CSRF stand for?', o: ['Cross-Site Request Forgery', 'Client-Side Rendering Format', 'Controller State Request Filter', 'Cross-Server Resource Fetch'], a: 0, why: 'csrf_field() protects forms against Cross-Site Request Forgery.', l: 'form-routes' },
    { t: 'tf', q: 'The controller should read form fields from $_POST directly.', a: false, why: 'False. Read input through the request object, for example $this->request->getPost(\'title\').', l: 'validation' },
    { t: 'fill', q: 'Complete the rules so the title is required and at least 3 characters.', code: "'title' => 'required|______[3]'", a: 'min_length', why: 'min_length[3] means at least 3 characters.', l: 'validation' },
    { t: 'mcq', q: 'Which rule requires an email address format?', o: ['valid_email', 'numeric', 'is_unique', 'required'], a: 0, why: 'valid_email checks that the value looks like an email address.', l: 'validation' },
    { t: 'mcq', q: 'What does `redirect()->back()->withInput()` do after validation fails?', o: ['Returns to the form and keeps the submitted values', 'Deletes the input', 'Saves the record anyway', 'Logs the user out'], a: 0, why: 'withInput() keeps the old input for old() to display.', l: 'validation' },
    { t: 'mcq', q: 'Which helper prints the validation error for one field?', o: ["validation_show_error('title')", "old('title')", "csrf_field('title')", "esc('title')"], a: 0, why: 'validation_show_error() shows that field’s error message.', l: 'errors-old' },
    { t: 'tf', q: 'The field name in the validation rules and in the form input must match.', a: true, why: 'True. Mismatched field names is a listed common mistake.', l: 'errors-old' },
    { t: 'mcq', q: 'What does CRUD stand for?', o: ['Create, Read, Update, Delete', 'Copy, Run, Upload, Download', 'Controller, Route, Upload, Database', 'Create, Render, Undo, Destroy'], a: 0, why: 'The four record actions.', l: 'create' },
    { t: 'id', q: 'Type the TaskModel method that adds a new row.', a: 'insert()', alt: ['insert', '$model->insert()'], why: '$model->insert([...]) adds a row.', l: 'create' },
    { t: 'mcq', q: 'After a successful create, where does the controller send the user?', o: ["redirect()->to('/tasks')", "view('tasks/new')", 'session()->destroy()', "redirect()->back()->withInput()"], a: 0, why: 'After saving, the user goes back to the task list.', l: 'create' },
    { t: 'mcq', q: "In the edit form, what does `old('title', $task['title'])` show when there is no failed input?", o: ['The saved title from the database', 'An empty field', 'An error message', "The word 'title'"], a: 0, why: 'old() falls back to its second parameter, the saved value.', l: 'update-delete' },
    { t: 'mcq', q: 'Which TaskModel call removes the row with a given id?', o: ['$model->delete($id)', '$model->remove($id)', '$model->destroy($id)', '$model->find($id)->delete()'], a: 0, why: 'delete($id) removes one row.', l: 'update-delete' },
    { t: 'mcq', q: 'Which of these is part of the clean CRUD flow?', o: ['Use POST for destructive work like updating or deleting', 'Repeat SQL code in views', 'Delete with a normal link', 'Save without validating'], a: 0, why: 'The other three are the unsafe shortcuts.', l: 'update-delete' },
    { t: 'fill', q: 'Make the form send file bytes.', code: '<form method="post" action="..." enctype="__________">', a: 'multipart/form-data', why: 'Without multipart/form-data, the file never reaches the request.', l: 'upload-form' },
    { t: 'mcq', q: "What does `max_size[attachment,2048]` allow?", o: ['Files up to 2048 KB (about 2 MB)', 'Up to 2048 files', 'Images up to 2048 pixels wide', 'Filenames up to 2048 characters'], a: 0, why: 'The number is in kilobytes.', l: 'upload-form' },
    { t: 'mcq', q: 'Which rule limits uploads to JPEG and PNG?', o: ['mime_in[attachment,image/jpeg,image/png]', 'uploaded[attachment]', 'max_size[attachment,2048]', 'valid_image[attachment]'], a: 0, why: 'mime_in lists the allowed MIME types.', l: 'upload-form' },
    { t: 'id', q: 'Type the method that generates a safer server-side filename for an uploaded file.', a: 'getRandomName()', alt: ['getRandomName', '$file->getRandomName()'], why: '$file->getRandomName() returns a random name.', l: 'upload-handle' },
    { t: 'mcq', q: 'Which constant points to the public folder?', o: ['FCPATH', 'APPPATH', 'WRITEPATH', 'ROOTPATH'], a: 0, why: "FCPATH . 'uploads' is public/uploads.", l: 'upload-handle' },
    { t: 'mcq', q: 'What should be saved in the database after an upload?', o: ['Only the filename or path', 'The file bytes', 'The original user filename', 'The whole $file object'], a: 0, why: 'Store filenames, not file bytes.', l: 'upload-handle' },
    { t: 'mcq', q: "What does `->fit(300, 300, 'center')` do?", o: ['Resizes and crops the image to 300 × 300 around the center', 'Rejects images larger than 300 KB', 'Moves the image to the center of the page', 'Converts the image to PNG'], a: 0, why: 'fit() resizes and crops to the given size.', l: 'upload-handle' },
    { t: 'order', q: 'Put the upload steps in order.', o: ['Validate the file with the rules', "$file = $this->request->getFile('attachment')", '$newName = $file->getRandomName()', "$file->move(FCPATH . 'uploads', $newName)", "$model->update($id, ['attachment' => $newName])"], why: 'Validate, read, rename, move, then save the filename.', l: 'upload-handle' },
    { t: 'mcq', q: 'Which function builds the URL for an uploaded image in public/uploads?', o: ['base_url()', 'site_url()', 'FCPATH', 'redirect()'], a: 0, why: "base_url('uploads/' . $name) points to the file.", l: 'upload-handle' },
    { t: 'tf', q: 'A file saved in writable/ can be displayed with base_url().', a: false, why: 'False. writable/ is outside the document root. Display files belong in public/uploads.', l: 'upload-checklist' }
  ]
};
