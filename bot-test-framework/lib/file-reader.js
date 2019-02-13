
const fs = require('fs');
const dateFormat = require('dateformat');

module.exports = {
		
	fileNames: function(dirname) {
		return fs.readdirSync(dirname);
	},
	
	fileContent: function(dirname, filename) {
		return fs.readFileSync(dirname + filename);
	},
	
	createResultsFolder: function(dirname) {
		
		if (!fs.existsSync(dirname)){
			fs.mkdirSync(dirname);
		}
		
		var now = new Date();
 		var foldername = "testrun_" + dateFormat(now, "dd_mm_yy_HH_MM_ss");
		var testRunFolderName = dirname + '/' + foldername;
		
		if (!fs.existsSync(testRunFolderName)){
			fs.mkdirSync(testRunFolderName);
		}
		return testRunFolderName;
	},
	
	writeResults: function(dirname, filename, fileContent) {
		
		//console.log(dirname + " : " + filename + " : " + JSON.stringify(fileContent));			
		fs.writeFileSync(dirname + "/" + filename +'.json', JSON.stringify(fileContent, 0, 4));
	}

}




