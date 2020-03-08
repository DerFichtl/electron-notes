<template>
    <main id="editorPanel">
        <div id="editor"></div>
    </main>
</template>

<script>

import fs from 'fs'
import path from 'path'
import Quill from 'quill'
import dateFormat from 'dateformat'

import TaskHelper from '../../TaskHelper.js'
import Keyboard from '../../Keyboard.js'

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

        this.taskFilePath = path.join(this.config.dataDir, this.config.taskFileName + this.config.fileExtension)
        if (!fs.existsSync(this.taskFilePath)) {
            this.initTaskOverview()
        }

        this.$root.$on('file-deleted', (fileName) => {
            // console.log(fileName)
        })

        this.$root.$on('file-opened', (filePath) => {
            this.loadFile(filePath)
            this.setEditorContent()
        })

        let now = new Date()
        let date = dateFormat(now, 'yyyy-mm-dd')

        this.loadFile(path.join(this.config.dataDir, date + this.config.fileExtension))
        window.setTimeout(this.setEditorContent, 100) // TODO check why this is necessary

        window.setInterval(() => {
            if (this.internalContent !== this.lastInternalContent) {
                this.lastInternalContent = this.internalContent
                this.saveFile(this.currentFilePath, this.internalContent)
            }
        }, 500)
    },
    methods: {
        initEditor: function () {
            this.logger.debug()

            const toolbarOptions = [
                [{'header': [1, 2, 3, false]}],
                ['bold', 'italic', 'underline', 'strike'],
                ['blockquote', 'code-block'],
                [{'list': 'ordered'}, {'list': 'bullet'}, {'list': 'check'}],
                [{'color': []}, {'background': []}],
                ['image', 'video'],
                ['clean']
            ]

            this.editor = new Quill('#editor', {
                theme: 'snow',
                modules: {
                    toolbar: toolbarOptions,
                    clipboard: {
                        matchVisual: false // strange config of quill adds <p><br></p> if this is true
                    }
                }
            })

            this.editor.on('text-change', (delta, oldDelta, source) => {
                this.internalContent = this.editor.root.innerHTML
            })

            let keyboard = new Keyboard(this)
            keyboard.bindEditor(this.editor)
        },

        initTaskOverview: function () {
            this.logger.debug()

            const taskHelper = new TaskHelper(this.config.taskFileName + this.config.fileExtension, this.config.dataDir,
                [this.config.taskFileName + this.config.fileExtension, this.config.templateFileName + this.config.fileExtension])

            const filePath = taskHelper.writeTasksOverview()
            if (filePath) {
                this.logger.debug('emit file-created', filePath)
                this.$root.$emit('file-created', filePath)
            }
        },

        loadFile: function (filePath) {
            this.logger.debug(filePath)

            // create or update the task overview file
            if (path.basename(filePath) === this.config.taskFileName + this.config.fileExtension) {
                this.initTaskOverview()
            }

            if (fs.existsSync(filePath)) {

                this.internalContent = fs.readFileSync(filePath, 'utf-8')
                this.currentFilePath = filePath
                this.$root.$emit('file-loaded', filePath)

            } else {
                let now = new Date()
                let date = dateFormat(now, 'yyyy-mm-dd')

                const templateFilePath = path.join(this.config.dataDir, this.config.templateFileName + this.config.fileExtension)

                if (fs.existsSync(templateFilePath)) {
                    let content = fs.readFileSync(templateFilePath, 'utf-8')
                    content = content.replace(/{{DATE}}/g, date)
                    content = content.replace(/{{TITLE}}/g, '')

                    this.internalContent = content
                }

                this.saveFile(filePath, this.internalContent)
                this.currentFilePath = filePath

                this.$root.$emit('file-created', filePath)
            }
        },

        saveFile: function (filePath, content) {
            this.logger.debug()

            // console.log(content)
            // TODO: do stuff if special file Open-Tasks File

            fs.writeFileSync(filePath, content, 'utf-8')
        },

        setEditorContent: function () {
            this.logger.debug()

            let delta = this.editor.clipboard.convert(this.internalContent)
            this.editor.setContents(delta, 'silent')
        }

    }
}
</script>

<style lang="scss">

@import '../../../../node_modules/quill/dist/quill.snow.css';

.ql-container.ql-snow, .ql-toolbar.ql-snow {
    border: none;
}

.ql-editor ul[data-checked="false"] > li::before {
    font-size: 1.2rem;
}

.ql-editor ul[data-checked="true"] li::before {
    font-size: 1.2rem;
}

</style>