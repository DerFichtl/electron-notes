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
     * @param bool fullResults add match results to return value for later use
     * @param string ignoreFiles 
     * @param bool plain: strip off html tags and search only in plain text
     */
    filterFiles(query, fullResults = false, ignoreFiles = [], plain = true) {

        let regexp = new RegExp(query, "igm")
        let results = this.folders

        for (let f in results) {
            const folder = results[f]

            for (let ff in results[f].files) {
                const file = results[f].files[ff]

                if(file.name === '' || file.name === undefined) {
                    continue
                }
                
                if (ignoreFiles && ignoreFiles.indexOf(file.name) !== -1) {
                    continue
                }

                let filePath = path.join(this.dataDir, folder.name, file.name) + '.' + file.ext

                if (fs.existsSync(filePath)) {

                    // ignore subdirectories
                    if (fs.lstatSync(filePath).isDirectory()) {
                        continue
                    }

                    let content = fs.readFileSync(filePath, "utf-8")

                    // TODO: remove this hack
                    content = content.replace(/<ul/g, "\n<ul")

                    // if html then strip tags
                    if (plain === true && filePath.indexOf('.html')) {
                        content = stripHtml(content)
                    }

                    let matchesArr = []
                    const matches = content.matchAll(regexp)
                    for (const match of matches) {
                        matchesArr.push(match)
                    }

                    if(matchesArr.length === 0) {
                        // remove file from results if no matches
                        results[f].files[ff] = { }
                    } else if (fullResults === true && matchesArr.length > 0) {
                        results[f].files[ff].matches = matchesArr
                    }
                }
            }
        }

        return results
    }

}

export default Search