import fs from 'fs'
import path from 'path'
import Search from './Search.js'
import cheerio from 'cheerio'

class TaskHelper {

    constructor(taskFilePath, dataDir, folders, excludeFiles = []) {
        this.taskFilePath = taskFilePath
        this.dataDir = dataDir
        this.folders = folders
        this.excludeFiles = excludeFiles
    }

    writeTasksOverview() {

        let tasks = this.searchTasksInFiles()
        let content = this.formatOverviewContentHtml(tasks)
  
        try {
            fs.writeFileSync(this.taskFilePath, content, "utf-8")
            return this.filePath
        } catch (e) { return false }
    }

    searchTasksInFiles() {

        const search = new Search(this.dataDir, this.folders)
        const folderMatches = search.filterFiles('<ul class="todo-list"[^>]*>(.*)</ul>', this.excludeFiles)

        let matches = []
        let tasks = []

        for (const folderMatch of folderMatches) {
            for (const fileMatch of folderMatch.files) {
                
                if(fileMatch.html) {
                    
                    // console.log('----')
                    // console.log(fileMatch.path)
                    // console.log(fileMatch.html)

                    const $ = cheerio.load(fileMatch.html)
                    const li = $('ul.todo-list').find('li')

                    for(let i=0; i<li.length; i++) {
                        let task = this.parseTaskHtml(fileMatch, $(li[i]).html())
                        tasks.push(task)

                        // console.log(task)
                    }
                }
            }
        }

        // console.log('====')

        tasks.sort(function(a, b) {
            if (a.dueDate > b.dueDate) return 1
            if (b.dueDate > a.dueDate) return -1
  
            return 0
        });

        return tasks
    }

    parseTaskHtml(file, taskHtml) {

        let task = {}

        const $ = cheerio.load(taskHtml)

        task.path = file.path
        task.raw = taskHtml
        task.text = $(taskHtml).find('span').text()

        task.status = 'OPEN'
        if($(taskHtml).find('input').attr('checked')) {
            task.status = 'DONE'
        }
        
        task.createDate = ''
        let createDate = task.path.match(/(\d\d\d\d-\d\d-\d\d)/)
        if(createDate && createDate.length) {
            task.createDate = createDate[0]
        }

        let dueDate = task.text.match(/(\d\d\d\d-\d\d-\d\d)/)
        if(dueDate && dueDate.length) {
            task.dueDate = dueDate[0]
        } else {
            task.dueDate = task.createDate
        }

        let owner = task.text.match(/(@[^\s]+)/)
        if(owner && owner.length) {
            task.owner = owner[0]
        } else {
            task.owner = '@me'
        }

        return task
    }

    formatOverviewContentHtml(tasks) {

        let content = "<h1>All Open Tasks</h1>"
        let lastDate = ''
        let taskIndex = 0

        for (const task of tasks) {
            if(task.status === 'OPEN') {

                if(taskIndex === 0) {
                    if(task.dueDate === '') {
                        content += '<h2>No due date</h2><ul class="todo-list">'
                    } else {
                        content += '<h2>' + task.dueDate + '</h2><ul class="todo-list">'
                    }
                }     

                if(lastDate !== task.dueDate) {
                    content += '</ul>'
                    content += '<h2>' + task.dueDate + '</h2><ul class="todo-list">'
                    
                    lastDate = task.dueDate
                }

                content += '<li>'
                content += '<label class="todo-list__label"><input type="checkbox" disabled="disabled">'
                content += '<span class="todo-list__label__description">' + task.text + "</span>"
                content += '</li>'

                taskIndex++
            }
        }

        content += '</ul>'
  
        content += '<h2>Done Tasks</h2><ul class="todo-list">'
        for (const task of tasks) {
            if(task.status === 'DONE') {
                content += '<li>'
                content += '<label class="todo-list__label"><input type="checkbox" disabled="disabled" checked="checked">'
                content += '<span class="todo-list__label__description">' + task.text + "</span>"
                content += '</li>'
            }
        }

        content += '</ul>'

        return content
    }

}

export default TaskHelper


