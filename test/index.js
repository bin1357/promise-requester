const childProcess = require('child_process');
let color = {
    FgRed: "\x1b[31m",
    FgGreen: "\x1b[32m",
    FgYellow: "\x1b[33m",
    FgBlue: "\x1b[34m",
    FgMagenta: "\x1b[35m",
    FgCyan: "\x1b[36m",
    FgWhite: "\x1b[37m"
};

function runScript(scriptPath, name, color) {

    let invoked = false;

    let process = childProcess.fork(scriptPath, [], {silent: !!name});


    name && process.stdout.on('data', buffer => {
        let message = buffer.toString().slice(0, -1);
        console.log(color, name, message)
    });

    process.stderr.on('data', buffer => {
        let message = buffer.toString().slice(0, -1);
        if (invoked) return;
        invoked = true;
        console.log(color, name, "ERR >>", message);
    });
    process.on('error', function (err) {
        if (invoked) return;
        invoked = true;
        console.log(color, name, color.FgRed, err);
    });

    process.on('exit', function (code) {
        if (invoked) return;
        invoked = true;
        let err = code === 0 ? null : new Error('exit code ' + code);

        console.log(color, name, color.FgRed, err);
    });

}
runScript('./test/client.js', 'Client >>', color.FgBlue);
runScript('./test/server.js', 'Server >>', color.FgMagenta);