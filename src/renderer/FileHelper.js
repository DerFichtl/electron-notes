import fs from 'fs'
import path from 'path'

import { shell, remote } from 'electron'
import Dialogs from 'dialogs'

class FileHelper {


    constructor(vue) {
        this.vue = vue
        this.config = vue.config
        this.logger = vue.logger
    }


    openExternal(folderName = '', fileName = '') {
        this.logger.debug(fileName, folderName)

        if(fileName) {
            fileName += this.config.fileExtension
        }

        let filePath = path.join(this.config.dataDir, folderName, fileName)
        shell.showItemInFolder(filePath)

        this.logger.debug(filePath)
    }


    renameFileInFolder(folderName, oldFileName) {
        const dialogs = Dialogs()

        dialogs.prompt('New Name', oldFileName, newFileName => {

            if(! newFileName) {
                return false
            }

            const oldFilePath = path.join(this.config.dataDir, folderName, oldFileName + this.config.fileExtension)
            const newFilePath = path.join(this.config.dataDir, folderName, newFileName + this.config.fileExtension)

            if(fs.existsSync(newFilePath)) {
                alert(`The Note "${newFileName}" in "${folderName}" already exists!`)

                return false
            }

            this.logger.debug('rename', oldFilePath, newFilePath)

            fs.renameSync(oldFilePath, newFilePath)
            this.vue.$root.$emit('file-created', newFilePath)
        })
    }

    renameFolder(oldName) {
        const dialogs = Dialogs()

        dialogs.prompt('New Foldername?', oldName, newName => {

            const oldPath = path.join(this.config.dataDir, oldName)
            const newPath = path.join(this.config.dataDir, newName)

            if(fs.existsSync(newPath)) {
                alert(`The Folder "${newName}" already exists!`)

                return false
            }

            this.logger.debug('rename', oldPath, newPath)

            fs.renameSync(oldPath, newPath)
            this.vue.$root.$emit('folder-created', newPath)
        })
    }



    deleteFileInFolder(folderName, fileName) {
        this.logger.debug(folderName)

        if (!confirm(`Delete file "${fileName}" in "${folderName}"?`)) {
            return false
        }

        let filePath = path.join(this.config.dataDir, folderName, fileName + this.config.fileExtension)

        if (fs.existsSync(filePath)) {

            this.logger.debug('unlinkSync', filePath)
            fs.unlinkSync(filePath)

            this.vue.$root.$emit('file-deleted', filePath)
        }
    }

    deleteFolder(folderName) {
        this.logger.debug(folderName)

        if (!confirm(`Delete folder "${folderName}"?`)) {
            return false
        }

        let folderPath = path.join(this.config.dataDir, folderName)

        if (fs.existsSync(folderPath)) {

            this.logger.debug('unlinkSync', folderPath)
            fs.rmdirSync(folderPath)

            this.vue.$root.$emit('folder-deleted', folderPath)
        }
    }
}

export default FileHelper