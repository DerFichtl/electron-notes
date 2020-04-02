<template>
    <aside class="files">
        <p><input class="files__input" type="text"
            v-on:keyup.enter="search($event.target.value)" placeholder="Search ⏎"/></p>

        <FolderBox v-bind:folders="folders" v-bind:showHidden="showHidden" />

        <p>
            <button v-on:click="createFolder()" class="files__button">New Folder</button>
            <button v-on:click="toggleHidden()" class="files__button">Toggle Hidden</button>
        </p>
    </aside>
</template>


<style lang="scss">

.files {
    width: 30%;
    height: 100%;
    margin: 0;
    padding: 20px;
    float: left;
}

.files__input {
    padding: 10px;
    font-size: 1em;
    border: 1px solid #ccc;
    width: 100%;
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

</style>

<script>

import fs from 'fs'
import path from 'path'

import { shell, remote } from 'electron'
const { Menu, MenuItem } = remote

import dateFormat from 'dateformat'
import Dialogs from 'dialogs'

import Search from '../../Search.js'
import TaskHelper from '../../TaskHelper.js'

import FolderBox from './FolderBox'

// import { mapGetters, mapActions } from 'vuex'

export default {
    name: 'FilesPanel',
    props: [],
    components: { FolderBox },
    watch: { },
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

        this.$root.$on('overview-clicked', this.createTaskOverview)

        this.$root.$on('file-created', this.loadFilesFromDataDir)
        this.$root.$on('file-deleted', this.loadFilesFromDataDir)

        this.$root.$on('folder-created', this.loadFilesFromDataDir)
        this.$root.$on('folder-deleted', this.loadFilesFromDataDir)
    },
    methods: {

        createFolder: function() {
            this.logger.debug()

            const dialogs = Dialogs()

            dialogs.prompt('New Foldername', folderName => {

                if(! folderName) {
                    return false
                }

                const folderPath = path.join(this.config.dataDir, folderName)
                if(! fs.existsSync(folderPath)) {
                    this.logger.debug(folderName)
                    fs.mkdirSync(folderPath)

                    this.$root.$emit('file-created', folderPath)
                }
            })
        },

        toggleHidden: function() {
            if(!this.showHidden) {
                this.showHidden = true
            } else {
                this.showHidden = false
            }
        },


        /**
         * sync filelist when changes happening (delete, create, ...)
         */
        loadFilesFromDataDir: function () {
            
            if (fs.existsSync(this.config.dataDir)) {
                
                // pseudo folder for special files like TaskOverview
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
            return search.filterFiles(query)
        }
    }
}
</script>