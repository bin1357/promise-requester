# promise-requester
Essence for easy communication between the client and the server
##with socket.io
###server
```ecmascript 6
const Pr = require('promise-request');
const api = require('./myapi');

let io = require('socket.io')();
io.on('connection', function(client){
    let pr = new Pr();

    //set function send object to client
    pr.setSender(outData => 
        client.emit('from-server',outData));

    //receive object from client
    client.on('from-client', pr.getReceiver());

    //server request handler
    requester.setHandler(async (data, callback)=> {
        let {apiName, ...arg} = data;
        let startTime = + new Date();
        callback({message: 'receive message'});
        
        if(!api[apiName]) return false;        
        callback({
            message: `method ${apiName} founded, run ${apiName}(${JSON.stringify(arg)})`
        });
               
        let answer = await api[apiName](arg);   
        callback({
            message: `${apiName}(${JSON.stringify(arg)}) return answer before ${+ new Date() - startTime}ms`
        });
        return answer;
    });
});
```
###client
```ecmascript 6
const Pr = require('promise-request');
const io = require('socket.io-client')('http://localhost:3000');

let pr = new Pr();

//set function send object to Server
pr.setSender((data) =>
    io.emit('from-client',data));

//receive object from Server
io.on('from-server', pr.getReceiver());

//using
(async () => {
    let user = await pr.send({apiName: "getUserById", id: 3},data => {
        console.log('Server >>', data.message);
    });
    //or    
    //let user = await pr.send({apiName: "getUserById", id: 3});
})()

```

