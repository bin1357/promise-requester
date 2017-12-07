/**
 * Created by joni8 on 13.11.2017.
 */
const Queue = require('chunked-singly-linked-list');
let timeToClearCallback = 2000;
let timeTickCleaner = 500;
let TYPE = {
    REQUEST: 'REQUEST',
    ANSWER: 'ANSWER',
    CALLBACK: 'CALLBACK',
    KEEP_ALIVE: 'KEEP_ALIVE'
};
/**
 *
 * @typedef {(number|string|object|boolean)} Data
 */

/**
 * @class PromiseRequester
 */
class PromiseRequester {
    /**
     * @typedef {{
     *  id: number, data: Data, type: string,
     *  callback: boolean, timeToClearCallback: number
     * }} PromiseRequester~TransmitObject
     */

    static get timeToClearCallback() {
        return timeToClearCallback;
    };
    static get timeTickCleaner() {
        return timeTickCleaner;
    };
    static get TYPE() {
        return TYPE;
    };

    /**
     *
     * @param {number} id
     * @param {Data} data
     * @param {string} type
     * @param {boolean} callback
     * @returns {PromiseRequester~TransmitObject}
     */
    static message(id, data, type, callback=false) {
        return {
            id, data, type, callback,
            timeToClearCallback: PromiseRequester.timeToClearCallback
        };
    };
    static messageKeepAlive(id) {
        return PromiseRequester.message(id, {}, PromiseRequester.TYPE.KEEP_ALIVE);
    };
    constructor() {
        this.initHandler();
        this.initAnswerListener();
        this._sendFunction = ()=>{};
    }


    /**
     * @callback PromiseRequester~Sender
     * @param {PromiseRequester~TransmitObject} sentData
     */

    /**
     * @param {PromiseRequester~Sender} sender
     */
    setSender(sender) {

        /**
         * @param {PromiseRequester~TransmitObject}
         * @return {void}
         */
        this._sendFunction = sender;
    }

    /**
     *
     * @param {PromiseRequester~TransmitObject} _data
     * @returns {Promise.<void>}
     * @private
     */
    async _receiveFunction(_data) {
        if(_data.type === PromiseRequester.TYPE.REQUEST) {
            let {id, data, timeToClearCallback} = _data;
            try {
                let answerFromHandlerPromise =  this._handler(data, toCallback => {
                    let toCallbackMessage  = PromiseRequester.message(id, toCallback,PromiseRequester.TYPE.CALLBACK);
                    this._sendFunction(toCallbackMessage);
                });
                let keepLive  = setInterval(()=>{
                    this._sendFunction(PromiseRequester.messageKeepAlive(id));
                }, timeToClearCallback/2);
                await answerFromHandlerPromise;
                clearInterval(keepLive);
                let answer  = PromiseRequester.message(id, await answerFromHandlerPromise, PromiseRequester.TYPE.ANSWER);
                this._sendFunction(answer);
            } catch(err) {
                console.error('err send from client:',err);
                this._sendFunction(err);
            }
        } else if(
            _data.type === PromiseRequester.TYPE.ANSWER ||
            _data.type === PromiseRequester.TYPE.CALLBACK ||
            _data.type === PromiseRequester.TYPE.KEEP_ALIVE) {
            this._subscribers && this._subscribers.forEach(sb => sb.callback(_data));
        }
    }

    /**
     *
     * @returns {function(this:PromiseRequester)}
     */
    getReceiver() {
        return this._receiveFunction.bind(this);
    }

    //region handlers
    initHandler() {
        this._handler = () => {};
    }
    setHandler(handler) {
        this._handler = handler;
    }
    //endregion


    //region subscribe
    initAnswerListener() {
        this._subscribers = new Queue(128);
        this._generatorNextId = (function* () {
            for(let i = 0;;) yield ++i;
        })();
        this._getNextId = () => this._generatorNextId.next().value;

        setInterval(()=> {
            while(
            !this._subscribers.isEmpty()
            && + new Date() - this._subscribers.seek().time > PromiseRequester.timeToClearCallback
                ) {
                let deleteSubscriber = this._subscribers.pop();
                if (deleteSubscriber.extend) {
                    deleteSubscriber.extend = false;
                    deleteSubscriber.time = + new Date();
                    this._subscribers.push(deleteSubscriber)
                } else {
                    deleteSubscriber.timeout();
                }
            }
        },PromiseRequester.timeTickCleaner);

    }

    /**
     * @callback PromiseRequester~SubscribeCallback
     * @param {PromiseRequester~TransmitObject} _data     *
     */
    /**
     * @callback PromiseRequester~SubscribeTimeout
     */

    /**
     * @param {PromiseRequester~SubscribeCallback} callback
     * @param timeout
     * @returns {{time: number, callback: *, timeout: (function())}}
     */
    subscribe(callback, timeout = ()=>{}) {
        let time = + new Date();
        let subscriber = {
            time,
            callback,
            timeout
        };
        this._subscribers.push(subscriber);
        return subscriber;
    }
    //endregion

    /**
     * @callback PromiseRequester~SendCallback
     * @param {Data} data
     */
    /**
     * @param {Data} data
     * @param {PromiseRequester~SendCallback} callback
     * @returns {Promise<Data>}
     */
    async send(data, callback = ()=>{}) {
        let id = this._getNextId();
        let message = PromiseRequester.message(
            id, data, PromiseRequester.TYPE.REQUEST, !!callback
        );
        let answer  = new Promise((res,err)=>{
            let subscriber = this.subscribe(
                _data => {
                    let {data, type} = _data;
                    if(_data.id === id) {
                        if(type === PromiseRequester.TYPE.ANSWER) {
                            subscriber.callback = ()=>{};
                            subscriber.timeout = ()=>{};
                            subscriber.time = + new Date() - PromiseRequester.timeToClearCallback;
                            res(data);
                        } else if(type === PromiseRequester.TYPE.CALLBACK) {
                            callback(data);
                        } else if (type === PromiseRequester.TYPE.KEEP_ALIVE) {
                            subscriber.extend = true;
                        }
                    }
                }, () => {
                    err(new Error(`Timeout ${PromiseRequester.timeToClearCallback}ms, unsubscribe`))
                }
            );
        });
        this._sendFunction(message);

        return answer;
    }



}

module.exports = PromiseRequester;