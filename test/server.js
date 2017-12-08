const Pr = require('../index');
const api = require('./myapi');

let io = require('socket.io')();
io.on('connection', function (client) {
    console.log('client connected');
    let pr = new Pr();

    //set function send object to client
    pr.setSender(outData =>
        client.emit('from-server', outData));

    //receive object from client
    client.on('from-client', pr.getReceiver());

    //server request handler
    pr.setHandler(async (data, callback) => {
        let {apiName, ...arg} = data;
        let startTime = +new Date();
        callback({message: 'receive message'});

        if (!api[apiName]) return false;
        callback({
            message: `method ${apiName} founded,
             run ${apiName}(${JSON.stringify(arg)})`

        });

        let answer = await api[apiName](arg);
        callback({
            message: `command "${apiName}(${JSON.stringify(arg)})" 
            return answer before ${+new Date() - startTime}ms`
        });
        return answer;
    });
});
io.listen(3000);