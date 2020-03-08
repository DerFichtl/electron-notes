# electron-notes

A simple electron app for editing daily notes and task-lists with webpack and vue.js

Warning: It's just an prototype and not intended to be used for real work.
Sometimes it destroyes your notes or not proper saves your edits.

## Running and Features

```
npm run dev
```

* Create, rename, delete files
* Auto-saving every 500ms
* Workspaces (folders) to seperate work and private notes 
* Searching for notes within the whole data folder
* Wysiwyg HTML editor
* Markdown autoformat for lists, tasks, headlines, ...
* Data resides in document folder of your operating system
* Template for new notes in ./Electron Notes/Config/Template.html
* Creates on the fly a tasks overview file from all open/closed tasks
* Keyboard shortcuts
* Binary for Mac OSX via electron-builder

## Todo

* embed video on copy/paste youtube url
* embed image on copy/paste image url
* embed image on drag&drop image
* template for tasks overview
* config is editable via gui
* calendar view for tasks
* export to markdown file
* electron security and application settings (logo, name, ...)

## Project setup, development, build, lint
```
npm install
npm run dev
npm run build
```

## Attribution
Icons made by www.flaticon.com
