let priority = 0;
let lastLog;

function myLog(message, logPriority, fileInfo) {
    if (logPriority >= priority) {
        lastLog = message;
        priority = logPriority;
    }
    console.log(lastLog);
    console.log(`Current file: ${fileInfo.filename}, line number: ${fileInfo.lineNumber}`);

    


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


