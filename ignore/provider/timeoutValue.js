"use strict";
var TimeoutValueProvider = (function () {
    function TimeoutValueProvider() {
        var _this = this;
        this.setTimeoutValue = function (value) {
            _this.timeoutValue = value;
        };
        this.$get = function () {
            return {
                set: function (value) {
                    _this.setTimeoutValue(value);
                },
                get: function () {
                    return _this.timeoutValue;
                }
            };
        };
        this.timeoutValue = 200;
    }
    return TimeoutValueProvider;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TimeoutValueProvider;
