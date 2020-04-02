import fs from 'fs'
import path from 'path'
import stripHtml from 'string-strip-html'

class Search {

    constructor(dataDir, folders) {
        this.dataDir = dataDir
        this.folders = folders
    }

    /**
     * filter files
     * @param string search string as regex 
     * @param string ignoreFiles 
     * @param bool searchInPlain: strip off html tags and search only in plain text
     */
    filterFiles(query, ignoreFiles = [], searchInPlain = false) {

        let regexp = new RegExp(query, "igm")
        let results = this.folders

        // console.log('----------')
        // console.log(query)

        for (let f in results) {
            const folder = results[f]

            for (let ff in results[f].files) {

                const file = results[f].files[ff]
                const filePath = path.join(this.dataDir, folder.name, file.name) + '.' + file.ext

                // console.log('----')
                // console.log(folder.name, file.name, file.ext)
                // console.log(filePath)

                let remove = false

                if(file.name === '' || file.name === undefined) {
                    remove = true
                }

                if (ignoreFiles && ignoreFiles.indexOf(file.name) !== -1) {
                    remove = true
                }

                // ignore subdirectories or wrong pa
                if (! fs.existsSync(filePath) || fs.lstatSync(filePath).isDirectory()) {
                    remove = true
                }

                // ignore non html files
                if (filePath.indexOf('.html') === -1) {
                    remove = true
                }

                let html, content, matchesArr = null

                if(remove === false) {

                    html = fs.readFileSync(filePath, "utf-8")
                    content = stripHtml(html)
                    matchesArr = []

                    // console.log(html)

                    let matches = []

                    if(searchInPlain === true) {
                        matches = content.matchAll(regexp)
                    } else {
                        html = html.replace(/<ul/g, "\n<ul")
                        matches = html.matchAll(regexp)
                    }

                    for (const match of matches) {
                        matchesArr.push(match)
                    }

                    // console.log(matchesArr.length)

                    if(matchesArr.length === 0) {
                        remove = true
                    }
                }

                // console.log(file, remove)

                if(remove === true) {
                    results[f].files.splice(ff, 1)
                } else {
                    results[f].files[ff].matches = matchesArr
                    results[f].files[ff].content = content
                    results[f].files[ff].html = html
                }
            }
        }

        return results
    }

}

export default Search