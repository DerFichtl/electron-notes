
import fs from 'fs'
import Search from './Search.js'

class TaskHelper {

    constructor(taskFileName, dataDir, excludeFiles = []) {
        this.taskFileName = taskFileName;
        this.dataDir = dataDir;
        this.excludeFiles = excludeFiles;
    }

    writeTasksOverview() {

        let tasks = this.searchTasksInFiles();
        let content = this.formatOverviewContentHtml(tasks);

        this.filePath = this.dataDir + "/" + this.taskFileName;
        this.content = content;
  
        try {
            fs.writeFileSync(this.filePath, this.content, "utf-8");
            return this.filePath;
        } catch (e) { return false; }
    }

    searchTasksInFiles() {

        let search = new Search(this.dataDir)
        let matches = []
        let tasks = [];

        let fileMatches = search.filterFiles('<ul[^>]*>(.*)</ul>', true, this.excludeFiles, false);
        
        for (const fileMatch of fileMatches) {

            if(fileMatch[0].indexOf('data-checked') === -1) {
                continue;
            }

            let items = fileMatch[1].replace(/<\/li>/g, '').split(/<li>/).filter((el)=>{return el != '';})

            for (const item of items) {
                let match = fileMatch
                match.text = item
                tasks.push(this.parseTaskMatchHtml(match));
            }
        }
  
        tasks.sort(function(a, b) {
            if (a.dueDate > b.dueDate) return 1;
            if (b.dueDate > a.dueDate) return -1;
  
            return 0;
        });

        return tasks
    }

    parseTaskMatchHtml(match) {
        let task = {}

        task.filePath = match.filePath
        task.raw = match[0]
        task.text = match.text.trim()

        task.status = 'OPEN'
        if(task.raw.indexOf('data-checked="true"') > -1) {
            task.status = 'DONE'
        }
        
        task.createDate = null
        let createDate = task.filePath.match(/(\d\d\d\d-\d\d-\d\d)/)
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
        let content = "<h1>All Open Tasks</h1><p><br /></p>";
        let lastDate = '';
  
        for (const task of tasks) {
            if(task.status === 'OPEN') {
                if(lastDate != task.dueDate) {
                    if(lastDate != '') {
                        content += '</ul><p><br /></p>';
                    }
                    content += '<h2>' + task.dueDate + '</h2><ul data-checked="false">';
                    lastDate = task.dueDate;
                }
                content += '<li>' + task.text + "</li>";
            }
        }

        content += '</ul><p><br /></p>';
  
        content += '<h2>Done Tasks</h2><ul data-checked="true">';
        for (const task of tasks) {
            if(task.status === 'DONE') {
                content += '<li>' + task.text + "</li>";
            }
        }

        content += '</ul>';
  
        return content
    }

}

export default TaskHelper


