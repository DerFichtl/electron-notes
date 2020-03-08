<template>
    <div id="app">
        <FileList />
        <EditorPanel />
        <div class="c"></div>
    </div>
</template>


<script>

import { ipcRenderer, remote } from 'electron'

import fs from 'fs'
import path from 'path'

import FileList from './NotesPage/FileList'
import EditorPanel from './NotesPage/EditorPanel'
import Keyboard from '../Keyboard.js'


export default {
    name: 'App',
    components: { FileList, EditorPanel },
    data: function() {
        return {
            configFilePath: '',
            config: null,
            currentFilePath: '',
        };
    },
    created: function() {
        this.loadConfig();

        // let keyboard = new Keyboard(this)
        // keyboard.bindApp()
    },
    mounted: function() {

    },
    methods: {
        loadConfig: function() {

            let docDir = remote.app.getPath('documents')
            let configFilePath = path.join(docDir, 'Electron Notes/.Config/Config.json')

            if (! fs.existsSync(configFilePath)) {
                try {
                    this.createConfig(docDir, configFilePath)
                } catch(ex) {
                    ipcRenderer.send('close-app')
                }
            }

            let config = JSON.parse(fs.readFileSync(configFilePath))
            this.config = config

            this.$store.commit('setConfig', config)
        },
        createConfig: function(docDir, configFilePath) {

            let config = {
                "docDir": docDir,
                "dataDir": path.join(docDir, "Electron Notes"),
                "configDir": path.join(docDir, "Electron Notes", ".Config"),
                "configFilePath": configFilePath,
                "fileExtension": ".html",
                "taskFileName": "Open Tasks",
                "templateFileName": "Template"
            }

            if (! fs.existsSync(config.dataDir)) {
                fs.mkdirSync(config.dataDir)
            }

            if (! fs.existsSync(config.configDir)) {
                fs.mkdirSync(config.configDir)
            }

            if (! fs.existsSync(config.configFilePath)) {
                let configString = JSON.stringify(config)
                fs.writeFileSync(config.configFilePath, configString)
            }
        }
    }
};

</script>

<style lang="scss">

html, body {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    background: #fff;
}

div, main, aside, textarea, input, p, button {
    box-sizing: border-box;
}

textarea, select, input, button {
    outline: none;
}

#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: #2c3e50;
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
}

#editorPanel {
    width: 70%;
    height: 100%;
    margin: 0;
    padding: 20px;
    float: left;
}

</style>
