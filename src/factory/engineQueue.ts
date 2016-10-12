import {IEngineQueue} from './../interfaces/definitions';

const EngineQueue = ($log, $rootScope, $window: Window, socket): IEngineQueue => {

    const doneVar = {};
    
    $rootScope.exception = false;

    //makes sure that when an exception occurs, the IDLE state is NOT triggered
    $window.addEventListener('ExceptionHandler', () => {
        $rootScope.exception = true;
    });

    const setStatus = function(name: string, value: boolean) {
        if(isDone) {
            //$log.dev('EngineQueue', name, value, 'EngineQueue is now inactive - you cant use it anymore');
            return;
        }
        doneVar[name] = value;
        if (value === true) {
            done(name);
        }
    };

    let isDone = false;

    const areDoneVarAllTrue = () => {
        for(var key in doneVar) {
            if(!doneVar[key]) { return false;}
        }
        return true;
    };

   
    const done = (from?:string) => {
        $log.dev('engineQueue.isDone()', from, doneVar);
        if(isDone) {
            return isDone;
        }
        if(areDoneVarAllTrue() && $rootScope.exception === false) {
            isDone = true;

            if($window['onServer'] === true) {

                //todo uncomment this
                //console.log('GOing to throw an error');
                //throw new Error('testerror');

                socket.emit('IDLE', {
                    html: document.documentElement.outerHTML,
                    doctype: new XMLSerializer().serializeToString(document.doctype),
                    url: window.location.href,
                    uid: $window['serverConfig'].uid
                });

                socket.on('IDLE'+ $window['serverConfig'].uid, function() {
                    const Event = $window['Event'];
                    const dispatchEvent = $window.dispatchEvent;
                    const IdleEvent = new Event('Idle');
                    dispatchEvent(IdleEvent);
                    $rootScope.$broadcast('InternIdle');
                });
            } else {
                const Event = $window['Event'];
                const dispatchEvent = $window.dispatchEvent;
                const IdleEvent = new Event('Idle');
                dispatchEvent(IdleEvent);
                console.log('IDLE');
                $rootScope.$broadcast('InternIdle');
            }
        }
        return isDone;
    };

    return {
        isDone: done,
        setStatus: setStatus
    };
};

export default EngineQueue;