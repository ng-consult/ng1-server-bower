import {IServerConfig} from './../interfaces/definitions';
const WindowError = ($rootScope, $window, serverConfigHelper: IServerConfig) => {


    const init = () => {
        if( serverConfigHelper.onServer() === false) return;
        const originalThrow = $window.throw;

        let originalErrorHandler = $window.onerror;
        if ( ! originalErrorHandler ) {
            originalErrorHandler = function mockHandler() {
                return( true );
            };
        }


        $window.onerror = function handleGlobalError( message, fileName, lineNumber, columnNumber, error ) {
            // If this browser does not pass-in the original error object, let's
            // create a new error object based on what we know.
            if ( ! error ) {
                error = new Error( message );
                // NOTE: These values are not standard, according to MDN.
                error.fileName = fileName;
                error.lineNumber = lineNumber;
                error.columnNumber = ( columnNumber || 0 );
            }
            $rootScope.exception = true;


            return false;
            //return originalErrorHandler.apply( $window, arguments ) ;

        };
    }

    return {
        init: init
    }


};

export default WindowError;
