<template>
    <aside class="files">
        <p><input class="files__input" type="text"
            v-on:keyup.enter="search($event.target.value)" placeholder="Search ⏎"/></p>

        <ul class="files__ul">
            <li class="files__li" v-for="folder in folders" v-bind:key="folder.name"
                v-show="!folder.isHidden || showHidden">

                <div v-show="folder.name" class="files__folder-name files__folder-name--open">
                    <span>{{folder.name}}</span>
                    <button v-on:click="createNoteFile(folder.name)" class="files__button">New</button>
                </div>

                <ul class="files__ul">
                    <li class="files__li" v-for="file in folder.files" v-bind:key="file.name"
                        v-show="!file.isHidden || showHidden">

                        <span class="files__span files__span--open"
                            v-on:click="openFile(file.path)"
                            v-on:contextmenu="openContextmenu(folder.name, file.name, $event)">{{file.name}}</span>
                    </li>
                </ul>
            </li>
        </ul>

        <p>
            <button v-on:click="createFolder()" class="files__button">New Folder</button>
            <button v-on:click="toggleHidden()" class="files__button">Toggle Hidden</button>
        </p>
    </aside>
</template>

<script>

import fs from 'fs'
import path from 'path'

import { shell, remote } from 'electron'
const { Menu, MenuItem } = remote

import dateFormat from 'dateformat'
import Dialogs from 'dialogs'

import Search from '../../Search.js'
import TaskHelper from '../../TaskHelper.js'

// import { mapGetters, mapActions } from 'vuex'

export default {
    name: 'FileList',
    props: [],
    components: {

    },
    watch: {

    },
    data: function () {
        return {
            config: this.$store.state.config,
            logger: this.$root.$log,

            showHidden: false,
            folders: []
        }
    },
    mounted: function () {
        this.logger.debug()

        this.loadFilesFromDataDir()
        this.createTaskOverview()

        this.$root.$on('file-created', this.loadFilesFromDataDir)
        this.$root.$on('file-deleted', this.loadFilesFromDataDir)
    },
    methods: {

        /**
         * sync filelist when changes happening (delete, create, ...)
         */
        loadFilesFromDataDir: function () {
            
            if (fs.existsSync(this.config.dataDir)) {

                this.folders = [
                    {
                        'name': '',
                        'path': '',
                        'type': 'folder',
                        'isHidden': false,
                        'files': []
                    }
                ]

                let files = fs.readdirSync(this.config.dataDir)

                files.forEach(fileName => {

                    let filePath = path.join(this.config.dataDir, fileName)
                    let fileStat = fs.lstatSync(filePath)

                    if(fileStat.isDirectory()) {

                        let isHidden = false
                        if(fileName[0] === '.') {
                            isHidden = true
                        }

                        let folder = {
                            'name': fileName,
                            'path': filePath,
                            'type': 'folder',
                            'isHidden': isHidden,
                            'files': []
                        }

                        let files = fs.readdirSync(filePath)

                        files.forEach(fileName => {
                            let file = this.formatFile(filePath, fileName)
                            if(file) {
                                folder.files.push(file)
                            }
                        })

                        this.folders.push(folder)
                    
                    } else {

                        let file = this.formatFile(this.config.dataDir, fileName)
                        if(file) {
                            this.folders[0].files.push(file)
                        }
                    }
                })
            }
        },

        formatFile: function(filePath, fileName) {

            let isHidden = false
            if(fileName[0] === '.') {
                isHidden = true
            }

            if(! fs.lstatSync(path.join(filePath, fileName)).isDirectory()) {

                let fileNameExt = fileName.split(/\./)

                return {
                    'name': fileNameExt[0],
                    'ext': fileNameExt[1],
                    'path': path.join(filePath, fileName),
                    'type': 'file',
                    'isHidden': isHidden
                }                             
            }

            return false
        },

        toggleHidden: function() {
            if(!this.showHidden) {
                this.showHidden = true
            } else {
                this.showHidden = false
            }
        },

        createFolder: function() {
            this.logger.debug()

            const dialogs = Dialogs()

            dialogs.prompt('New Foldername', folderName => {
                const folderPath = path.join(this.config.dataDir, folderName)
                if(! fs.existsSync(folderPath)) {
                    this.logger.debug(folderName)
                    fs.mkdirSync(folderPath)

                    this.$root.$emit('file-created', folderPath)
                }
            })
        },

        /**
         * create a new note file. use the template if available.
         */
        createNoteFile: function (folderName = '', noteName = '') {
            this.logger.debug(folderName, noteName)

            let now = new Date()
            let date = dateFormat(now, 'yyyy-mm-dd')

            let fileName
            let content = ''

            if (noteName) {
                fileName = date + '-' + noteName + this.config.fileExtension
            } else {
                fileName = date + this.config.fileExtension
            }

            const templateFilePath = path.join(this.config.configDir, this.config.templateFileName + this.config.fileExtension)

            if (fs.existsSync(templateFilePath)) {
                content = fs.readFileSync(templateFilePath, 'utf-8')
                content = content.replace(/{{DATE}}/g, date)
                content = content.replace(/{{TITLE}}/g, noteName)
            }

            let filePath = path.join(this.config.dataDir, folderName, fileName)

            try {

                fs.writeFileSync(filePath, content, 'utf-8')

                this.$root.$emit('file-created', filePath)
                this.$root.$emit('file-opened', fileName)

                this.logger.debug(filePath)

            } catch (ex) {

                this.logger.error(ex)
            }
        },

        createTaskOverview: function () {
            this.logger.debug()

            this.config.taskFilePath = path.join(this.config.dataDir, this.config.taskFileName + this.config.fileExtension)

            const excludeFiles = [
                this.config.taskFileName,
                this.config.templateFileName
            ]

            const taskHelper = new TaskHelper(this.config.taskFilePath, this.config.dataDir, this.folders, excludeFiles)

            const filePath = taskHelper.writeTasksOverview()
            if (filePath) {
                this.logger.debug('emit file-created', filePath)
                this.$root.$emit('file-created', filePath)
            }
        },

        openContextmenu: function (folderName, fileName, evt) {
            this.logger.debug(folderName, fileName)

            evt.preventDefault()

            const menu = new Menu()

            menu.append(new MenuItem({
                label: 'Rename',
                click: () => {
                    this.renameFile(folderName, fileName)
                }
            }))

            menu.append(new MenuItem({
                label: 'Delete',
                click: () => {
                    this.deleteFile(folderName, fileName)
                }
            }))

            menu.append(new MenuItem({
                label: 'Show in Finder',
                click: () => {
                    let filePath = path.join(this.config.dataDir, folderName, fileName)
                    shell.showItemInFolder(filePath)
                }
            }))

            menu.popup({window: remote.getCurrentWindow()})
        },

        openFile: function (filePath) {
            this.logger.debug()

            if(! fs.lstatSync(filePath).isDirectory()) {

                if(path.basename(filePath).indexOf(this.config.taskFileName) > -1) {
                    this.createTaskOverview()
                }
                
                // TODO: highlight current file

                this.$root.$emit('file-opened', filePath)
            }
        },

        renameFile: function (oldFileFolder, oldFileName) {
            this.logger.debug(oldFileFolder, oldFileName)

            const dialogs = Dialogs()

            dialogs.prompt('New Filename', oldFileName, newFileName => {

                if(! newFileName) {
                    return
                }

                const oldFilePath = path.join(this.config.dataDir, oldFileFolder, oldFileName + this.config.fileExtension)
                const newFilePath = path.join(this.config.dataDir, oldFileFolder, newFileName + this.config.fileExtension)

                if(fs.existsSync(newFilePath)) {
                    return
                }

                this.logger.debug('rename', oldFilePath, newFilePath)

                fs.rename(oldFilePath, newFilePath, () => {
                    this.$root.$emit('file-created', newFileName)
                })
            })
        },

        deleteFile: function (fileFolder, fileName) {
            this.logger.debug(fileFolder, fileName)

            if (!confirm('Delete File? ' + fileName)) {
                return false
            }

            let filePath = path.join(this.config.dataDir, fileFolder, fileName) + this.config.fileExtension

            if (fs.existsSync(filePath)) {

                this.logger.debug('unlinkSync', filePath)
                fs.unlinkSync(filePath)

                this.$root.$emit('file-deleted', fileFolder, fileName)

                /* if (this.folders.length && this.folders[0].files.length) {
                    let openFilePath = path.join(this.config.dataDir, this.folders[0].name, this.folders[0].files[0].name) + this.config.fileExtension
                    
                    this.logger.debug('unlinkSync', openFilePath)
                    this.openFile(openFilePath)
                } */
            }
        },

        search: function (query) {
            this.logger.debug()

            this.loadFilesFromDataDir()

            if (!query) {
                return false
            }

            this.folders = this.filterFiles(query)
        },

        filterFiles: function (query, fullResults = false) {
            this.logger.debug()

            const search = new Search(this.config.dataDir, this.folders)
            return search.filterFiles(query, fullResults)
        }
    }
}
</script>

<style lang="scss">

.files {
    width: 30%;
    height: 100%;
    margin: 0;
    padding: 20px;
    float: left;
}

.files__ul {
    list-style-type: none;
    padding: 0;
}

.files__li {
    padding: 2px 5px 10px 5px;
}

.files__li .files__li {
    padding: 2px 5px;
}

.files__li .files__li:hover {
    background: #eee;
}

.files__button {
    border: none;
    background: none;
    float: right;
    cursor: pointer;
    color: #ccc;
    padding: 5px 0 5px 5px;
}

.files__button:hover {
    color: #999;
}

.files__input {
    padding: 10px;
    font-size: 1em;
    border: 1px solid #ccc;
    width: 100%;
}

.files__folder-name {
    padding: 5px 0;
    margin-bottom: 10px;
    border-bottom: 1px solid #ccc;
    display: block;
}

.files__li .files__li .files__span {
    -webkit-user-select: none;
    font-size: 1em;
    cursor: pointer;
}

</style>