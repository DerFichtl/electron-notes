import Mousetrap from 'mousetrap'

class Keyboard {

    constructor(vue) {
        this.vue = vue;
        this.logger = this.vue.$root.$log;
    }

    bindEditor(editor) {

        this.editor = editor;

        /**
         * Create headlines on hashtag
         */
        editor.keyboard.addBinding({
            key: ' ',
            collapsed: true,
            prefix: /^#{1,3}$/,
            handler: (range, context) => {

                this.logger.debug('keyboard: create headline');

                const ops = [];
                ops.push({ retain: range.index - context.prefix.length });
                ops.push({ delete: context.prefix.length });

                editor.updateContents({ ops });
            
                editor.format('header', context.prefix.length);
            }
        });

        // check or uncheck a tasklist item with command+x / control+x
        editor.keyboard.addBinding(
        {
            key: 'X',
            collapsed: true,
            shortKey: true,
            format: { list: true },
            handler: (range, context) => {
                this.logger.debug('keyboard: toggle checkbox');

                if(context.format.list == 'checked') {
                    editor.format('list', 'unchecked');
                } else if(context.format.list == 'unchecked') {
                    editor.format('list', 'checked');
                }
            }        
        });

        editor.keyboard.addBinding({
            key: ' ',
            collapsed: true,
            prefix: /https?:\/\/[^\s]+/,
            handler: (range, context) => {

                this.logger.debug('keyboard: format url as link');

                let prevOffset = 0;
                let url;

                const regex = /https?:\/\/[^\s]+/g;
                const text = editor.getText(prevOffset, range.index);
                const match = text.match(regex);

                if (match === null) {
                    prevOffset = range.index;
                    return true;
                }

                if (match.length > 1) {
                    url = match[match.length - 1];
                } else {
                    url = match[0];
                }

                const ops = [];
                ops.push({ retain: range.index - url.length });
                ops.push({ delete: url.length });
                ops.push({ insert: url, attributes: { link: url } });

                editor.updateContents({ ops });
                prevOffset = range.index;

                return true;
            }
        });

        editor.clipboard.addMatcher(Node.TEXT_NODE, (node, delta) => {
            this.logger.debug('clipboard: formatLink');
            return this.formatLink(node, delta);
        });

        // Mousetrap.bind(['command+x', 'ctrl+x'], () => { this.checkUncheckCreateTask() });
    }

    formatLink(node, delta) {
        var regex = /https?:\/\/[^\s]+/g;
        if (regex.exec(node.data) != null) {
          delta.ops = [{ insert: node.data, attributes: { link: node.data }}];
        }
        return delta;
    }
}

export default Keyboard