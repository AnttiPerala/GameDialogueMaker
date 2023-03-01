let priority = 0;
let lastLog;
let logAtAll =true;
let fileInformation ='';

function myLog(message, logPriority, fileInfo) {
    fileInformation = ''; //make sure it's empty in the beginning
    if (logPriority >= priority) {
        lastLog = message;
        priority = logPriority;
    }
    if (logAtAll){
        if (priority > 0){ //don't log priority 0 messages at all

            

            if (fileInfo) { //check that it's not undefined
                fileInformation = (`Current file: ${fileInfo.filename}, line number: ${fileInfo.lineNumber}`);

            }

            console.log(lastLog +' '+ fileInformation);

        }
        

    }
 

}

//for getting line number and file name


function getFileInfo() {
    const err = new Error();
    const stackTrace = err.stack.split('\n')[2].trim();
    const matchResult = /\((.*):(\d+):\d+\)/.exec(stackTrace);
    const absoluteFilename = matchResult[1];
    const lineNumber = matchResult[2];

    const currentDir = window.location.href.split('/').slice(0, -1).join('/');
    const relativeFilename = absoluteFilename.replace(currentDir, '');

    return {
        filename: relativeFilename,
        lineNumber: lineNumber
    };
}


