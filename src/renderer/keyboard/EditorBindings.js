import Quill from 'quill'
import Delta from 'quill-delta'

class EditorBindings {

    constructor(vue) {
        this.vue = vue
        this.logger = this.vue.$root.$log
    }

    /**
     * get configuration for special key bindings
     */
    getEditorBindings() {

        this.initSmartbreak()

        const bindings = {
            shiftEnter: {
                key: 13,
                shiftKey: true,
                handler: function (range, context) {
                    let currentLeaf = this.quill.getLeaf(range.index)[0]
                    let nextLeaf = this.quill.getLeaf(range.index + 1)[0]
            
                    this.quill.insertEmbed(range.index, 'break', true, 'user')
            
                    // Insert a second break if:
                    // At the end of the editor, OR next leaf has a different parent (<p>)
                    if (nextLeaf === null || (currentLeaf.parent !== nextLeaf.parent)) {
                      this.quill.insertEmbed(range.index, 'break', true, 'user')
                    }
            
                    // Now that we've inserted a line break, move the cursor forward
                    this.quill.setSelection(range.index + 1, Quill.sources.SILENT)
                }
            },
            headlineEnter: {
                key: 13,
                collapsed: true,
                prefix: /^#{1,3} (.*)$/,
                handler: function(range, context) {

                    let headline = context.prefix.match(/^(#{1,3} )(.*)$/)
                    let headlineSize = headline[1].length - 1
                    let headlineText = headline[2]

                    let delta = new Delta()
                        .retain(range.index - context.prefix.length)
                        .delete(context.prefix.length)
                        .insert(headlineText)

                    this.quill.updateContents(delta)
                    this.quill.format('header', headlineSize)
                }
            },
            // cannot overwrite the default "list empty enter"
            listEmptyEnter: {
                key: 13,
                collapsed: true,
                format: { list: true },
                offset: 0,
                // don't use empty: true ... it don't work anymore because of SmartBreak
                handler: function(range, context) {

                    // empty li with only a <br> in it ... otherwise it's a TextBloat
                    let currentLeaf = this.quill.getLeaf(range.index)[0]

                    if(currentLeaf.constructor.name === 'SmartBreak') {
                        // code from original source here
                        this.quill.format('list', false, Quill.sources.USER);
                        if (context.format.indent) {
                            this.quill.format('indent', false, Quill.sources.USER);
                        }
                    }
                }
            },
            checklistCheck: {
                key: 'X',
                collapsed: true,
                shortKey: true,
                format: { list: true },
                handler: function(range, context) {
                    if(context.format.list == 'checked') {
                        this.quill.format('list', 'unchecked')
                    } else if(context.format.list == 'unchecked') {
                        this.quill.format('list', 'checked')
                    }
                }   
            },
            urlEnter: {
                key: 13,
                collapsed: true,
                prefix: /https?:\/\/[^\s]+/,
                handler: function(range, context) {
    
                    let prevOffset = 0
                    let url
    
                    const regex = /https?:\/\/[^\s]+/g
                    const text = this.quill.getText(prevOffset, range.index)
                    const match = text.match(regex)
    
                    if (match === null) {
                        prevOffset = range.index
                        return true
                    }
    
                    if (match.length > 1) {
                        url = match[match.length - 1]
                    } else {
                        url = match[0]
                    }
                    
                    let delta = new Delta()
                        .retain(range.index - url.length)
                        .delete(url.length)
                        .insert(url, { link: url })

                    this.quill.updateContents(delta)
                    prevOffset = range.index
    
                    return true
                }
            }
        }

        return bindings
    }

    getMatchers() {
        return [
            ['BR', function() {
                return new Delta().insert({'break': ''})
            }]
        ]
    }

    initSmartbreak() {

        let Break = Quill.import('blots/break')
        let Embed = Quill.import('blots/embed')

        class SmartBreak extends Break {
            length () {
                return 1
            }

            value () {
                return '\n'
            }
            
            insertInto(parent, ref) {
                Embed.prototype.insertInto.call(this, parent, ref)
            }
        }
          
        SmartBreak.blotName = 'break'
        SmartBreak.tagName = 'BR'
          
        Quill.register(SmartBreak)
    }


    /**
     * format urls as links on copy/paste or keyboard enter
     */
    bindUrls() {
        this.editor.clipboard.addMatcher(Node.TEXT_NODE, (node, delta) => {
            this.logger.debug('clipboard: formatLink')
            return this.formatLink(node, delta)
        })
    }


    formatLink(node, delta) {
        var regex = /https?:\/\/[^\s]+/g
        if (regex.exec(node.data) != null) {
          delta.ops = [{ insert: node.data, attributes: { link: node.data }}]
        }
        return delta
    }
}

export default EditorBindings