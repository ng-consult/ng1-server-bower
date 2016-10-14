'use strict';
var $templateRequestMinErr = minErr('$compile');
var TemplateRequest = (function () {
    function TemplateRequest() {
        this.defaultHttpResponseTransform = function (data, headers) {
            if (typeof data === 'string') {
                var tempData = data.replace(JSON_PROTECTION_PREFIX, '').trim();
                if (tempData) {
                    var contentType = headers('Content-Type');
                    if ((contentType && (contentType.indexOf(APPLICATION_JSON) === 0)) || isJsonLike(tempData)) {
                        data = fromJson(tempData);
                    }
                }
            }
            return data;
        };
    }
    TemplateRequest.prototype.httpOptions = function (val) {
        if (val) {
            this._httpOptions = val;
            return this;
        }
        return this._httpOptions;
    };
    ;
    TemplateRequest.prototype.$get = function ($templateCache, $http, $q, $sce) {
        var _this = this;
        var handleRequestFn = function (tpl, ignoreRequestError) {
            handleRequestFn.totalPendingRequests++;
            if (typeof tpl !== 'string' || typeof $templateCache.get(tpl) === 'undefined') {
                tpl = $sce.getTrustedResourceUrl(tpl);
            }
            var transformResponse = $http.defaults && $http.defaults.transformResponse;
            if (transformResponse instanceof Array) {
                transformResponse = transformResponse.filter(function (transformer) {
                    return transformer !== defaultHttpResponseTransform;
                });
            }
            else if (transformResponse === defaultHttpResponseTransform) {
                transformResponse = null;
            }
            return $http.get(tpl, extend({
                cache: $templateCache,
                transformResponse: transformResponse
            }, _this._httpOptions))['finally'](function () {
                handleRequestFn.totalPendingRequests--;
            })
                .then(function (response) {
                $templateCache.put(tpl, response.data);
                return response.data;
            }, handleError);
            var handleError = function (resp) {
                if (!ignoreRequestError) {
                    throw $templateRequestMinErr('tpload', 'Failed to load template: {0} (HTTP status: {1} {2})', tpl, resp.status, resp.statusText);
                }
                return $q.reject(resp);
            };
        };
        handleRequestFn.totalPendingRequests = 0;
        return handleRequestFn;
    };
    return TemplateRequest;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TemplateRequest;
