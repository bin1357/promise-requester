# promise-requester
Essence for easy communication between the client and the server

## with socket.io

### server
```javascript
const Pr = require('promise-requester');
const api = require('./myapi');

let io = require('socket.io')();
io.on('connection', function (client) {
    console.log('client connected');
    let pr = new Pr();

    //set function send object to client
    pr.setSender(outData => 
        client.emit('from-server', outData)
    );

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
            message: `"${apiName}(${JSON.stringify(arg)})"
            was performed for ${+new Date() - startTime}ms`
        });
        return answer;
    });
});
io.listen(3000);
```

### client

```javascript
const Pr = require('promise-requester');

const address = 'http://localhost:3000';
const io = require('socket.io-client')(address);

let pr = new Pr();

io.on('connect', function () {
    console.log('connected');

    //set function send object to Server
    pr.setSender((data) => io.emit('from-client', data));

    //receive object from Server
    io.on('from-server', pr.getReceiver());

    //using
    (async () => {
        let user = await pr.send({
            apiName: "getUserById", id: 3
        }, data => console.log(
            'Receive in callback from server:',
            data.message
        ));
        //or without callback
        //let user = await pr.send({
        // apiName: "getUserById", id: 3
        //});
        console.log('user', user);
    })();
});
```

