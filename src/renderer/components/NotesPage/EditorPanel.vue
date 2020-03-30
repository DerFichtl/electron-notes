<template>
    <main id="editorPanel">
        <div id="editor"></div>
    </main>
</template>

<script>

import fs from 'fs'
import path from 'path'
import dateFormat from 'dateformat'

// import Mousetrap from 'mousetrap'
import Editor from '../../ckeditor.js'

// import EditorBindings from '../../keyboard/EditorBindings.js'

import { shell, remote } from 'electron'
const { Menu, MenuItem } = remote


export default {
    name: 'EditorPanel',
    components: { },
    props: [
        'disabled',
        'visible'
    ],
    data: function () {
        return {
            config: this.$store.state.config,
            logger: this.$root.$log,

            currentFilePath: '',
            internalContent: '',

            taskFilePath: ''
        }
    },
    watch: { },
    mounted: function () {
        this.logger.debug()

        this.initEditor()

        this.$root.$on('file-deleted', (filePath) => {
            if(this.currentFilePath === filePath) {
                this.currentFilePath = ''
                this.internalContent = ''
                this.setEditorContent()
            }
        })

        this.$root.$on('file-clicked', (filePath) => {
            this.loadFile(filePath)
            this.setEditorContent()
        })

        this.$root.$on('file-created', (filePath) => {
            this.loadFile(filePath)
            this.setEditorContent()
        })

        let now = new Date()
        let date = dateFormat(now, 'yyyy-mm-dd')

        this.loadFile(path.join(this.config.dataDir, date + this.config.fileExtension))
        window.setTimeout(this.setEditorContent, 100) // TODO check why this is necessary

        window.setInterval(() => {
            
            if(! this.currentFilePath) {
                this.editor.isReadOnly = true
            } else {
                this.editor.isReadOnly = false
            }

            if (this.currentFilePath && this.internalContent !== this.lastInternalContent) {
                this.lastInternalContent = this.internalContent
                this.saveFile(this.currentFilePath, this.internalContent)
            }
        }, 500)
    },
    methods: {

        initEditor: function () {
            this.logger.debug()

            ClassicEditor
                .create(
                    document.querySelector('#editor'),
                    {
                        toolbar: [ 'heading', '|',
                            'bold', 'italic', 'link', 'fontColor', 'removeFormat', '|',
                            'bulletedList', 'numberedList', 'todoList', '|',
                            'blockQuote', 'codeBlock', '|',
                            'insertTable', '|', 'mediaEmbed', 'imageUpload' ],
                        heading: {
                            options: [
                                { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
                                { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
                                { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
                                { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' }
                            ]
                        },
                        image: {
                            toolbar: [
                                'imageTextAlternative',
                                'imageStyle:full',
                                'imageStyle:side'
                            ]
                        },
                        table: {
                            contentToolbar: [
                                'tableColumn',
                                'tableRow',
                                'mergeTableCells',
                                'tableCellProperties',
                                'tableProperties'
                            ]
                        },
                    }
                )
                .then(editor => {
                    this.editor = editor

                    this.editor.model.document.on('change:data', () => {
                        this.internalContent = editor.getData()
                    })

                    let container = editor.ui.view.editable.element
                    container.addEventListener('contextmenu', (evt) => {
                        this.openContextmenu(evt)
                    })

                    console.log( Array.from( editor.ui.componentFactory.names() ));
                })
                .catch(error => {
                    // 
                })
        },

        openContextmenu: function (evt) {
            this.logger.debug()

            evt.preventDefault()

            const menu = new Menu()

            menu.append(new MenuItem({label: 'Undo', role: 'undo'}))
            menu.append(new MenuItem({label: 'Redo', role: 'redo'}))

            menu.append(new MenuItem({type: 'separator'}))

            menu.append(new MenuItem({label: 'Cut', role: 'cut' }))
            menu.append(new MenuItem({label: 'Copy', role: 'copy' }))
            menu.append(new MenuItem({label: 'Paste', role: 'paste' }))

            menu.append(new MenuItem({type: 'separator'}))

            menu.append(new MenuItem({label: 'Select All', role: 'selectall' }))

            menu.append(new MenuItem({
                label: 'Create Link',
                click: () => {
                    let toolbarItems = this.editor.ui.view.toolbar.items
                    for(let item of toolbarItems) {
                        if(item.label === 'Link') {
                            item.element.click()
                        }
                    }
                }
            }))

            menu.append(new MenuItem({type: 'separator'}))

            menu.append(new MenuItem({
                label: 'Wikipedia',
                click: () => {
                    const text = this.getSelectedText()
                    const url = "https://de.wikipedia.org/wiki/" + text
                    shell.openExternal(url)
                }
            }))

            menu.append(new MenuItem({
                label: 'Dict',
                click: () => {
                    const text = this.getSelectedText()
                    const url = "https://www.dict.cc/?s=" + text
                    shell.openExternal(url)
                }
            }))

            menu.popup({window: remote.getCurrentWindow()})
        },

        getSelectedText: function() {
            const selection = this.editor.model.document.selection
            const range = selection.getFirstRange()
            
            let text = ''
            for (const item of range.getItems()) {
                if(item.is('textProxy')) {
                    if(text) {
                        text += ' '
                    }
                    text += item.data
                }
            }
            return text
        },

        loadFile: function (filePath) {
            this.logger.debug(filePath)

            if (fs.existsSync(filePath)) {
                this.internalContent = fs.readFileSync(filePath, 'utf-8')
                this.currentFilePath = filePath
                this.$root.$emit('file-loaded', filePath)
            }
        },

        saveFile: function (filePath, content) {
            this.logger.debug()
            fs.writeFileSync(filePath, content, 'utf-8')
        },

        setEditorContent: function () {
            this.logger.debug()
            this.editor.setData(this.internalContent)
        }

    }
}
</script>

<style lang="scss">

.ck.ck-editor__editable_inline,
.ck.ck-editor__editable:not(.ck-editor__nested-editable).ck-focused { border:none; outline:none; box-shadow:none; }

.ck.ck-toolbar { border:none; background:none; }

</style>