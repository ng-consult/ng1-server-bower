
const TemplateRequest = function ($delegate, $window) {

    var $TemplateRequest = (tpl, ignoreRequestError) => {
        //console.log('Inside template request, querying ', tpl, ignoreRequestError);
        if(typeof tpl === 'string') {
            tpl = 'http://127.0.0.1:8883/get?url='
            + encodeURIComponent(tpl)
            + '&original-url='
            + encodeURIComponent(window.location.href )
        }
        const result =  $delegate(tpl, ignoreRequestError);

        return result;
    };

    return $TemplateRequest;
}

export default TemplateRequest;
