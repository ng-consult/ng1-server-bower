import {IServerConfig} from './../interfaces/definitions';

const TemplateRequest = function ($delegate, $sce, serverConfigHelper: IServerConfig) {

    var $TemplateRequest = (tpl, ignoreRequestError) => {
        //console.log('Inside template request, querying ', tpl, ignoreRequestError);

        const restURL = serverConfigHelper.getRestServer();
        if(restURL !== null) {

            if(typeof tpl === 'string') {
                tpl = $sce.trustAsResourceUrl(restURL + '/get?url=' + encodeURIComponent(tpl));
            }
        }

        const result =  $delegate(tpl, ignoreRequestError);

        return result;
    };

    return $TemplateRequest;
}

export default TemplateRequest;
