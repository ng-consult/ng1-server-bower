"use strict";
var TemplateRequest = function ($delegate, $window) {
    var $TemplateRequest = function (tpl, ignoreRequestError) {
        console.log('Inside template request, querying ', tpl, ignoreRequestError);
        if (typeof tpl === 'string') {
            tpl = 'http://127.0.0.1:8883/get?url='
                + encodeURIComponent(tpl)
                + '&original-url='
                + encodeURIComponent(window.location.href);
        }
        var result = $delegate(tpl, ignoreRequestError);
        return result;
    };
    return $TemplateRequest;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TemplateRequest;
