import {IEngineQueue} from './../interfaces/definitions';

class IdleEvent {
    static Send = ($window: Window) => {
        const Event = $window['Event'];
        const dispatchEvent = $window.dispatchEvent;
        const IdleEvent = new Event('Idle');
        dispatchEvent(IdleEvent);
    }
}

const EngineQueue = ($log, $window: Window): IEngineQueue => {

    const doneVar = {};

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

    /*
    if (!window['Worker']) {
        throw new Error('a web worker support is necessary for usage with angular.js. Ifit doesn\'t work, it means that you are using a very outdated browser, like Internet Explorer');
    }*/

    let isDone = false;

    //const maximumAverage = 20;

    const areDoneVarAllTrue = () => {
        for(var key in doneVar) {
            if(!doneVar[key]) { return false;}
        }
        return true;
    };

    /*
    const checkPageActivity = () => {
        var i = 0, diff = 0, d = Date.now();

        var timeoutFn = () => {
            diff += (Date.now() - d);
            timer = setTimeout(timeoutFn, 0);
            if (i++==50) {
                clearTimeout(timer);
                average =  diff / i;
                if (average > maximumAverage) {
                    checkPageActivity();
                } else {
                    if(areDoneVarAllTrue()) {
                        isDone = true;
                        console.warn('Sending Idle Event');
                        $rootScope.$broadcast('Idle');
                    }
                }
            }
            d = Date.now();
        };

        var average = null;
        var timer = setTimeout(timeoutFn, 0);
    };
*/
    const done = (from?:string) => {
        $log.dev('engineQueue.isDone()', from, doneVar);
        if(isDone) {
            return isDone;
        }
        if(areDoneVarAllTrue()) {
            isDone = true;
            //$log.dev('EngineQueue', 'Sending Idle Event');
            IdleEvent.Send($window);
            //$rootScope.$broadcast('Idle');
            //checkPageActivity();
        }
        return isDone;
    };

    return {
        isDone: done,
        setStatus: setStatus
    };
};

export default EngineQueue;