(function ($) {
    "use strict";

    function parseShortcuts(keyboardInput, shortcuts) {
        var n = "";
        var ending = "";
        if (keyboardInput.length > 1) {
            n = keyboardInput.substr(0, keyboardInput.length - 1);
            if (!isNaN(n)) {
                ending = keyboardInput.substr(keyboardInput.length - 1);
                if (shortcuts.hasOwnProperty(ending)) {
                    return { status: true, value: n * shortcuts[ending] };
                }
            }
        }
        return { status: false, value: keyboardInput };
    }

    function formatNumberAsShortcut(n, shortcuts) {
        var i, m, a = [];
        for (i in shortcuts) {
            if (shortcuts.hasOwnProperty(i)) {
                m = n / shortcuts[i];
                if (m % 1 === 0) {
                    a.push(m + i.toUpperCase());
                }
            }
        }
        if (a.length > 0) {
            return a.sort()[a.length - 1];
        } else {
            return n;
        }
    }

    function numberFormatter(nStr) {
        nStr += '';
        var x = nStr.split('.');
        var x1 = x[0];
        var x2 = x.length > 1 ? '.' + x[1] : '';
        var rgx = /(\d+)(\d{3})/;
        while (rgx.test(x1)) {
            x1 = x1.replace(rgx, '$1' + ',' + '$2');
        }
        return x1 + x2;
    }

    function numberFormatReader(nStr) {
        var a, integer, decimal;
        if (!isNaN(nStr)) {
            return { status: true, value: nStr };
        } else {
            a = nStr.split(".");
            if (/^([0-9]{1,3}\,)?(([0-9]{3}\,)*([0-9]{3}))$/.test(a[0])) {
                integer = a[0].replace(/\,/g, "");
                if (a.length === 1) {
                    return { status: true, value: integer };
                } else if (a.length === 2 && !isNaN(a[1])) {
                    return { status: true, value: integer + "." + a[1] };
                }
            }
        }
        return { status: false, value: nStr };
    }

    $.fn.inputSlider = function (options) {
        var defaults = {
            value: 5000,
            min: 5000,
            max: 99000000,
            step: 1000,
            shortcuts: {
                "k": 1000,
                "m": 1000000
            },
            errorMessages: {
                "parse": "invalid value",
                "range": "value is out of range"
            },
            onError: $.noop,
            onSuccess: $.noop,
            name: "slider",
            numberFormatter: numberFormatter,
            numberFormatReader: numberFormatReader
        };

        var settings = $.extend({}, defaults, options);

        if (settings.value < settings.min || settings.value > settings.max) {
            throw new Error("Initial value is out of range.");
        }

        return this.each(function() {

            var $element = $("<div class='input-range-slider'></div>");
            var $input = $('<input type="text" name="' + settings.name + '" />').appendTo($element);
            var $slider = $('<div />').appendTo($element);
            var $error = $('<span class="error" />').hide().appendTo($element);

            $.fn.slider = $.fn.slider || function () { return this; };

            $slider.slider({
                value: settings.value,
                min: settings.min,
                max: settings.max,
                step: settings.step,
                slide: function (event, ui) {
                    $error.hide().text("");
                    $input.val(settings.numberFormatter(ui.value));
                }
            });

            $input.val(settings.numberFormatter(settings.value));

            $input.on("keyup blur", function (event) {
                $error.hide().text("");
                var keyboardInput = $(this).val().replace(/\s/g, "");
                var re = parseShortcuts(keyboardInput, settings.shortcuts);
                if (event.type === "blur" || re.status) {
                    if (!re.status) {
                        re = settings.numberFormatReader(keyboardInput);
                    }
                    if (re.status && re.value >= settings.min && re.value <= settings.max) {
                        $slider.slider("value", re.value);
                        $input.val(settings.numberFormatter(re.value));
                        settings.onSuccess();
                    } else if (re.status && (re.value < settings.min || re.value > settings.max)) {
                        $error.text(settings.errorMessages.range).show();
                        settings.onError();
                    } else {
                        $error.text(settings.errorMessages.parse).show();
                        settings.onError();
                    }
                }
            });

            $('<div class="min">' + formatNumberAsShortcut(settings.min, settings.shortcuts)  + '</div>').appendTo($element);
            $('<div class="max">' + formatNumberAsShortcut(settings.max, settings.shortcuts) + '</div>').appendTo($element);

            $(this).replaceWith($element);
        });
    }
}(jQuery));