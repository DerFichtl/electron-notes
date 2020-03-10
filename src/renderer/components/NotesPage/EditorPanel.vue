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

import EditorBindings from '../../keyboard/EditorBindings.js'


/* let List = Quill.import('formats/list')
class KeywordList extends List { }
KeywordList.blotName = 'keywords';
KeywordList.tagName = 'UL';
KeywordList.className = 'keywords'
Quill.register(KeywordList) */

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
            if (this.currentFilePath && this.internalContent !== this.lastInternalContent) {
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
                ['image', 'video', 'link'],
                ['clean']
            ]

            let editorBindings = new EditorBindings(this)
            const keyboardBindings = editorBindings.getEditorBindings()


            this.editor = new Quill('#editor', {
                theme: 'snow',
                modules: {
                    keyboard: {
                        bindings: keyboardBindings
                    },
                    toolbar: toolbarOptions,
                    clipboard: {
                        matchVisual: false, // strange config of quill adds <p><br></p> if this is true
                        matchers: editorBindings.getMatchers()
                    }
                }
            })

            console.log(this.editor.keyboard)

            // keyboard.addBindings(this.editor)

            this.editor.on('text-change', (delta, oldDelta, source) => {
                this.internalContent = this.editor.root.innerHTML
            })

            /* let toolbar = this.editor.getModule('toolbar')
            toolbar.addHandler('keywords', function(){
                console.log(this.quill)
                this.quill.format('keywords', 'test')
            }) */
        },

        loadFile: function (filePath) {
            this.logger.debug(filePath)

            // create or update the task overview file
            /* if (path.basename(filePath) === this.config.taskFileName + this.config.fileExtension) {
                this.initTaskOverview()
            } */

            if (fs.existsSync(filePath)) {
                this.internalContent = fs.readFileSync(filePath, 'utf-8')
                this.currentFilePath = filePath
                this.$root.$emit('file-loaded', filePath)
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

.ql-container {
    font-size: 1rem;
    height: calc(100% - 40px);
}

.ql-editor ul > li {
    line-height: 1.4rem;
}

.ql-snow .ql-editor h1, .ql-snow .ql-editor h2, .ql-snow .ql-editor h3,
.ql-snow .ql-editor ul, .ql-snow .ql-editor ol {
    margin-top: 0.5rem;
}

.ql-editor ul[data-checked="false"] > li::before,
.ql-editor ul[data-checked="true"] > li::before {
    font-size: 1.5rem;
    margin-top: -0.2em;
}

.ql-editor ul > li::before {
    content: '\2022';
    font-size: 1.6rem;
    vertical-align: middle;
}

/*
.ql-keywords::after {
    content: 'K';
}

.keywords li { list-style-type:none; display:inline; }
*/

</style>