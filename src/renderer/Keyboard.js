import Mousetrap from 'mousetrap'
import EditorBindings from './keyboard/EditorBindings.js'

class Keyboard {

    constructor(vue) {
        this.vue = vue;
        this.logger = this.vue.$root.$log;
    }

    bindEditor(editor) {

        /* this.editor = editor

        let editorBindings = new EditorBindings(this.vue, this.editor)
        editorBindings.bind() */

        /* editor.keyboard.addBinding({
            key: 13,
            shiftKey: true,
            collapsed: true,
            handler: function (range, context) {
                this.logger.debug('keyboard: toggle checkbox')
                
                let currentLeaf = this.editor.getLeaf(range.index)[0]
                let nextLeaf = this.editor.getLeaf(range.index + 1)[0]

                this.editor.insertEmbed(range.index, 'break', true, 'user')

                // Insert a second break if:
                // At the end of the editor, OR next leaf has a different parent (<p>)
                if (nextLeaf === null || (currentLeaf.parent !== nextLeaf.parent)) {
                this.editor.insertEmbed(range.index, 'break', true, 'user')
                }

                // Now that we've inserted a line break, move the cursor forward
                this.editor.setSelection(range.index + 1, Quill.sources.SILENT)
                
            }
        }) */

        // Mousetrap.bind(['command+x', 'ctrl+x'], () => { this.checkUncheckCreateTask() });
    }
}

export default Keyboard