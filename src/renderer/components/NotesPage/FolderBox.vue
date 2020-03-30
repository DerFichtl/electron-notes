<template>
    <ul class="files__ul">
        <li class="files__li" v-for="folder in folders" v-bind:key="folder.name"
            v-show="!folder.isHidden || showHidden">

            <div class="files__folder-name files__folder-name--open"
                v-show="folder.name"
                v-on:contextmenu="openContextmenu(folder, $event)">

                <span>{{folder.name}}</span>
                <!-- <button v-on:click="createNoteFile(folder.name)" class="files__add"><span>➕</span></button> -->
            </div>

            <FilesBox v-bind:folder="folder" v-bind:showHidden="showHidden" />
        </li>
    </ul>
</template>

<style lang="scss">

.files__ul {
    list-style-type: none;
    padding: 0;
}

.files__li {
    padding: 2px 5px 10px 5px;
    cursor: pointer;
}

.files__folder-name {
    padding: 5px 0;
    margin-bottom: 10px;
    border-bottom: 1px solid #ccc;
    display: block;
}

.files__folder-name:hover {
    background: #eee;
}

.files__li .files__li {
    padding: 2px 5px;
}

.files__li .files__li:hover {
    background: #eee;
}

.files__li .files__li .files__span {
    -webkit-user-select: none;
    font-size: 1em;
    cursor: pointer;
}

</style>

<script>

import fs from 'fs'
import path from 'path'

import { shell, remote } from 'electron'
const { Menu, MenuItem } = remote

import dateFormat from 'dateformat'
import Dialogs from 'dialogs'

import FilesBox from './FilesBox'
import FileHelper from '../../FileHelper.js'

export default {
    name: 'FolderBox',
    props: [ 'folders', 'showHidden' ],
    components: { FilesBox },
    watch: { },
    data: function () {
        return {
            config: this.$store.state.config,
            logger: this.$root.$log
        }
    },
    methods: {

        openContextmenu: function (folder, evt) {
            this.logger.debug(folder.name)

            evt.preventDefault()

            const menu = new Menu()
            const fileHelper = new FileHelper(this)

            menu.append(new MenuItem({
                label: 'New Note',
                click: () => {
                    this.createNoteFile(folder.name)
                }
            }))

            menu.append(new MenuItem({type: 'separator'}))

            menu.append(new MenuItem({
                label: 'Rename',
                click: () => {
                    fileHelper.renameFolder(folder.name)
                }
            }))

            menu.append(new MenuItem({
                label: 'Delete',
                click: () => {
                    fileHelper.deleteFolder(folder.name)
                }
            }))

            menu.append(new MenuItem({
                label: 'Show in Finder',
                click: () => {
                    fileHelper.openExternal(folder.name, '')
                }
            }))

            menu.popup({window: remote.getCurrentWindow()})
        },

        /**
         * create a new note file. use the template if available.
         */
        createNoteFile: function (folderName = '') {
            this.logger.debug(folderName)

            let now = new Date()
            let date = dateFormat(now, 'yyyy-mm-dd')

            let fileName
            let content = ''

            const dialogs = Dialogs()

            fileName = date

            dialogs.prompt('New Filename', fileName, fileName => {

                if(! fileName) {
                    return
                }

                const templateFilePath = path.join(this.config.configDir, this.config.templateFileName + this.config.fileExtension)

                if (fs.existsSync(templateFilePath)) {
                    content = fs.readFileSync(templateFilePath, 'utf-8')
                    content = content.replace(/{{DATE}}/g, date)
                    content = content.replace(/{{TITLE}}/g, fileName)
                }

                let filePath = path.join(this.config.dataDir, folderName, fileName) + this.config.fileExtension

                if (! fs.existsSync(filePath)) {
                    try {

                        fs.writeFileSync(filePath, content, 'utf-8')

                        this.$root.$emit('file-created', filePath)

                        this.logger.debug(filePath)

                    } catch (ex) { this.logger.error(ex) }
                } else {
                    alert(`The Note "${fileName}" in "${folderName}" already exists!`)
                }
            })
        },
    }
}

</script>