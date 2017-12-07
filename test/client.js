const Pr = require('../index');
const io = require('socket.io-client')('http://localhost:3000');

let pr = new Pr();

io.on('connect',function () {
    console.log('connected');

    //set function send object to Server
    pr.setSender((data) => io.emit('from-client',data));

    //receive object from Server
    io.on('from-server', pr.getReceiver());

    //using
    (async () => {
        let user = await pr.send({apiName: "getUserById", id: 3},data =>{
            console.log('Receive in callback from server:', data.message);
        });
        //or
        //let user = await pr.send({apiName: "getUserById", id: 3});
        console.log('user', user);
    })();
});



