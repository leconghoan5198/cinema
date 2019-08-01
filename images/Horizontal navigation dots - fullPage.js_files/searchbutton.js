/**
 * Jellybo SearchButton003 , JavaScript search button animation
 *
 * @license Copyright (c) 2017, Jellybo. All rights reserved, http://tech.jellybo.com/doc/license.html
 * To use this plugin you must buy our product in http://jellybo.com.
 * @author  Marian Spisiak
 * @created 2017-07-27
 * @link    http://jellybo.com
 */

var Jellybo = Jellybo || {};

Jellybo._prefix = "jellybo";

Jellybo.BootLoader = function ($) {
    var defaultSettings = {
        pluginName: "",
        animationFactory: null,
        publicFunctions: null,
        selector: "",
        settingAttributes: null
    };
    var _prefix = Jellybo._prefix;
    return function (c_settings) {
        var settings = {};
        $.extend(settings, defaultSettings, c_settings);
        var dataName = _prefix + "animation_plugin_" + settings.pluginName;

        function proxyEachFunction(es, fn) {
            return function () {
                var retval = null;
                var args = arguments;
                es.each(function () {
                    var obj = $(this).data(dataName);
                    retval = obj[fn].apply(obj, args);
                });
                return retval;
            };
        }
        function proxyObject(es) {
            var obj = {};
            for (var i in settings.publicFunctions) {
                obj[settings.publicFunctions[i]] = proxyEachFunction(es, settings.publicFunctions[i]);
            }
            return obj;
        }
        function proxyFunction(obj, fn) {
            return function () {
                return obj[fn].apply(obj, arguments);
            };
        }
        function createPluginObject(e, init_args) {
            var args = {};
            for (var i in settings.settingAttributes) {
                var attr = settings.settingAttributes[i].toString().toLowerCase();
                if (e.data(attr)) {
                    args[attr] = e.data(attr);
                }
            }
            if (init_args.length === 1) {
                $.extend(args, init_args[0]);
            }
            var anim = settings.animationFactory(e, args);
            var obj = {};
            anim.init();
            obj.settings = proxyFunction(anim, "settings");
            for (var i in settings.publicFunctions) {
                obj[settings.publicFunctions[i]] = proxyFunction(anim, settings.publicFunctions[i]);
            }
            return obj;
        }
        function plugin() {
            return function () {
                var args = arguments;
                this.each(function () {
                    if (!$(this).data(dataName)) {
                        $(this).data(dataName, createPluginObject($(this), args));
                    } else {
                        if (args.length === 1 && $.isPlainObject(args[0])) {
                            $(this).data(dataName).settings(args[0]);
                        }
                    }
                });
                return proxyObject(this);
            };
        }
        function registerPlugin() {
            $.fn[settings.pluginName] = plugin();
        }
        return function () {
            registerPlugin();
            $(function () {
                $(settings.selector)[settings.pluginName]();
            });
            return null;
        }();
    };
}($);

Jellybo.SearchButton3 = function ($, Snap, mina) {
    var defaultSettings = {
        width: 450, height: 40,
        color_1: "#fff", color_2: "#fff",
        list_bg_color: "rgba(255,255,255,0.2)",
        line_stroke: 2, magnifier_stroke: 1.5,
        duration: 600, duration_colorChange: 300, duration_input: 400,
        placeholder: "SEARCH"
    };
    var eventsNames = {
        onSubmit: "event_submit",
        onItemSelect: "event_itemClick",
        onChange: "event_change",
        onItemHighlight: "event_itemHighlight",
        onOpen: "event_open",
        onClose: "event_close"
    };
    var eventNamesArray = [];
    for (var i in eventsNames) {
        eventNamesArray.push(i);
    }

    function extractListeners($e, s) {
        function listener(event, fn) {
            $e.on(event, function () {
                if ($.isFunction(fn)) {
                    fn.apply(this, arguments);
                } else {
                    window[fn].apply(this, arguments);
                }
            });
        }
        for (var i in s) {
            for (var j in eventsNames) {
                if (i.toString().toLowerCase() === j.toString().toLowerCase()) {
                    listener(eventsNames[j], s[i]);
                }
            }
        }
    }
    function hideSvg(e) {
        e.attr({
            visibility: "hidden"
        });
    }
    function showSvg(e) {
        e.attr({
            visibility: "visible"
        });
    }
    function extendArrayExcept(dest, src, except) {
        for (var i in src) {
            if ($.inArray(i, except) < 0) {
                dest[i] = src[i];
            }
        }
    }

    return function (e, c_settings) {
        var settings = {};
        $.extend(settings, defaultSettings);
        extendArrayExcept(settings, c_settings, eventNamesArray);

        var stroke = settings.line_stroke;
        var strokeoffset = stroke === 1 ? 1 : (stroke / 2);
        var height = settings.height;
        var width = settings.width;
        var h = height - (2 * strokeoffset);
        var circleHalfWidth = h / 2;
        var stroke2 = settings.magnifier_stroke;
        var w = settings.width - (circleHalfWidth * 2) - (strokeoffset * 2);
        var duration = settings.duration;

        var $parentElem;
        var $wrapperHtmlElem;
        var $svgHtmlElem;
        var $listWrapperElem;
        var $listElem;
        var $inputElem;
        var $buttonElem;
        var $svgElem;
        var $pathElem;
        var $circleElem;
        var $pathTotalLen;
        var $pathCircleLen;
        var $pathEndLineLen;
        var $state = 1;
        var $flags = {noClose: false};

        function getItemValue(e) {
            return e.find("span").text();
        }
        function setItemValue(e, value) {
            e.find("span").text(value);
        }
        function addListItem(value) {
            $listElem.append("<li class=\"item\"><span></span></li>");
            setItemValue($listElem.find("li").last(), value);
        }
        function emptyList() {
            $listElem.html("");
        }
        function setListItems(arr) {
            emptyList();
            for (var i in arr) {
                addListItem(arr[i]);
            }
        }
        function setInputValue(val) {
            $inputElem.val(val);
        }
        function getInputValue() {
            return $inputElem.val();
        }
        function drawHtml(e) {
            $parentElem = $(e);
            $parentElem.html("<div class=\"jellyboSearchButton003Wrapper\"><svg class=\"animation\"></svg><input class=\"input\"/><span class=\"button\"></span><div class=\"listWrapper\"><ul class=\"list\"></ul></div></div>");
            $svgHtmlElem = $parentElem.find("svg");
            $inputElem = $parentElem.find("input");
            $buttonElem = $parentElem.find("span");
            $listElem = $parentElem.find("ul");
            $listWrapperElem = $parentElem.find(".listWrapper");
            $wrapperHtmlElem = $parentElem.find(".searchBar");

            $wrapperHtmlElem.css("width", width);
            $wrapperHtmlElem.css("height", height);

            var left_offset = 10;

            $inputElem.css("width", width);
            $inputElem.css("height", height);
            $inputElem.css("padding-left", circleHalfWidth + left_offset);
            $inputElem.css("padding-right", 2 * circleHalfWidth);
            $inputElem.css("color", settings.color_1);

            $buttonElem.css("width", 2 * circleHalfWidth);
            $buttonElem.css("height", height);

            $listElem.css("min-width", w + circleHalfWidth - 1);

            $listWrapperElem.css("left", circleHalfWidth + Math.floor(strokeoffset + 1));
            $listElem.css("color", settings.color_1);
            $listWrapperElem.css("background", settings.list_bg_color);
            $listWrapperElem.css("top", settings.height);

            $inputElem.hide();
            $listWrapperElem.hide();
            $inputElem.attr("placeholder", settings.placeholder);
        }
        function drawSvgElem(e) {
            $svgElem = Snap(e[0]);
            $svgElem.attr({
                width: width, height: height,
                style: "display: inline-block; position: relative; "
            });
        }
        function drawBorderLine() {
            var start = (w + circleHalfWidth) + (strokeoffset) + "," + strokeoffset;
            var data = "M" + start + "a" + circleHalfWidth + "," + circleHalfWidth + ",0,0,0,0," + h + "a" + circleHalfWidth + "," + circleHalfWidth + ",0,1,0,0,-" + h + "l-" + w + ",0a" + circleHalfWidth + "," + circleHalfWidth + ",0,1,0,0," + h + "l" + (w + circleHalfWidth) + ",0";
            $pathElem = $svgElem.path(data);
            $pathTotalLen = $pathElem.getTotalLength();
            $pathCircleLen = (2 * Math.PI * (circleHalfWidth));
            $pathEndLineLen = Math.ceil(w + circleHalfWidth);
            $circleElem = $svgElem.circle(w + h / 2 + (strokeoffset), (h / 2) + (strokeoffset), circleHalfWidth);
            $circleElem.attr({
                stroke: settings.color_1,
                fill: 'none',
                strokeWidth: stroke
            });
            $pathElem.attr({
                stroke: settings.color_1,
                fill: 'none',
                strokeWidth: stroke,
                strokeDasharray: ($pathCircleLen) + "px " + ($pathTotalLen - $pathCircleLen) + "px",
                strokeDashoffset: "0px",
                strokeLinecap: "butt"
            });
            hideSvg($pathElem);
        }
        function drawMagnifier() {
            var q1 = 1;
            var q2 = 1;
            var q3 = 0;

            var xM = (w + h / 2) + (strokeoffset) + q2;
            var yM = (h / 2) + (strokeoffset) + q3;

            var hM = (2 * circleHalfWidth) - (circleHalfWidth / q1);
            var cR = (hM * 0.75) / 2;
            var pR = (hM * 0.25) + 1;

            var xM0 = xM - (hM / 2) + cR;
            var yM0 = yM - (hM / 2) + cR;

            var sincos45deg = 0.70710678118;

            var cP0 = (cR * sincos45deg);
            var cP1 = (cR * sincos45deg);

            var circle = $svgElem.circle(xM0, yM0, cR);
            var path = $svgElem.path("M" + (xM0 + cP0) + "," + (yM0 + cP1) + " l" + (pR) + "," + (pR));
            var shadow = $svgElem.filter(Snap.filter.shadow(0, 0, 1, settings.color_2, 0.5));
            path.attr({
                stroke: settings.color_2,
                fill: 'none',
                strokeWidth: stroke2,
                strokeLinecap: "round",
                filter: shadow
            });

            circle.attr({
                stroke: settings.color_2,
                fill: 'none',
                strokeWidth: stroke2,
                filter: shadow
            });
        }
        function calculatePosition(from, to, value) {
            return from + ((to - from) * value);
        }
        function openAnimation(next) {
            hideSvg($circleElem);
            showSvg($pathElem);
            $pathElem.animate({stroke: settings.color_2}, settings.duration_colorChange);
            setTimeout(function () {
                $inputElem.show();
                $inputElem.css({opacity: 0.0});
                $inputElem.animate({opacity: 1.0}, settings.duration_input);
            }, duration - settings.duration_input);
            Snap.animate(0, 1, function (value) {
                $pathElem.attr({'strokeDasharray':
                            calculatePosition($pathCircleLen, $pathEndLineLen, value)
                            + "px," +
                            calculatePosition($pathTotalLen - $pathCircleLen, $pathTotalLen - $pathEndLineLen, value) + "px"});
                $pathElem.attr({'strokeDashoffset': -calculatePosition(0, ($pathTotalLen - $pathEndLineLen), value) + "px"});

            }, duration, mina.easeinout, function () {
                $listWrapperElem.show();
                $inputElem.focus();
                next();
            });
        }
        function closeAnimation(next) {
            $listWrapperElem.hide();
            $inputElem.animate({opacity: 0.0}, settings.duration_input).promise().then(function () {
                $inputElem.hide();
            });
            setTimeout(function () {
                $pathElem.animate({stroke: settings.color_1}, settings.duration_colorChange);
            }, duration - settings.duration_colorChange);
            Snap.animate(0, 1, function (value) {
                $pathElem.attr({'strokeDasharray':
                            calculatePosition($pathEndLineLen, $pathCircleLen, value)
                            + "px," +
                            calculatePosition($pathTotalLen - $pathEndLineLen, $pathTotalLen - $pathCircleLen, value) + "px"});
                $pathElem.attr({'strokeDashoffset': -calculatePosition(($pathTotalLen - $pathEndLineLen), 0, value) + "px"});

            }, duration, mina.easeinout, function () {
                hideSvg($pathElem);
                showSvg($circleElem);
                next();
            });
        }
        function open() {
            if ($state === 1) {
                $state = 2;
                $parentElem.trigger(eventsNames.onOpen, [$($inputElem).val()]);
                openAnimation(function () {
                    $state = 0;
                });
            }
        }
        function close() {
            if ($state === 0) {
                $state = 3;
                $parentElem.trigger(eventsNames.onClose, [$($inputElem).val()]);
                closeAnimation(function () {
                    $state = 1;
                });
            }
        }
        function input() {
            var value = $inputElem.val();
            $parentElem.trigger(eventsNames.onChange, [value, false]);
        }
        function submit() {
            var active = null;
            $listElem.find("li").each(function () {
                if ($(this).hasClass("active")) {
                    active = getItemValue($(this));
                }
            });
            if (active !== null) {
                $inputElem.val(active);
                $parentElem.trigger(eventsNames.onItemSelect, [$($inputElem).val()]);
                $parentElem.trigger(eventsNames.onChange, [getInputValue(), true]);
            }
            $parentElem.trigger(eventsNames.onSubmit, [$($inputElem).val()]);

        }
        function downArrow() {
            var i = 0;
            var f = -1;
            $listElem.find("li").each(function () {
                if ($(this).hasClass("active")) {
                    f = i + 1;
                    $(this).removeClass("active");
                }
                i++;
            });
            if (f >= 0) {
                if (f >= i) {
                    f = i - 1;
                }
            } else {
                f = 0;
            }
            $listElem.find("li").eq(f).addClass("active");
            if ($listElem.find("li").length > 0) {
                $inputElem.val(getItemValue($listElem.find("li").eq(f)));
                $parentElem.trigger(eventsNames.onItemHighlight, getItemValue($listElem.find("li").eq(f)));
            }
        }
        function upArrow() {
            var i = 0;
            var f = -1;
            $listElem.find("li").each(function () {
                if ($(this).hasClass("active")) {
                    f = i - 1;
                    $(this).removeClass("active");
                }
                i++;
            });
            if (f >= 0) {
                if (f >= i) {
                    f = 0;
                }
            } else {
                f = 0;
            }
            $listElem.find("li").eq(f).addClass("active");
            if ($listElem.find("li").length > 0) {
                $inputElem.val(getItemValue($listElem.find("li").eq(f)));
                $parentElem.trigger(eventsNames.onItemHighlight, getItemValue($listElem.find("li").eq(f)));
            }
        }
        function listItemClick(e) {
            setInputValue(getItemValue(e));
            $parentElem.trigger(eventsNames.onItemSelect, [getItemValue(e)]);
            $parentElem.trigger(eventsNames.onChange, [getInputValue(), true]);
        }
        function setEvents() {
            $buttonElem.click(function () {
                if ($state === 1) {
                    open();
                } else {
                    $flags.noClose = true;
                    $inputElem.focus();
                    submit();
                }
            });
            $inputElem.blur(function (e) {
                e.preventDefault();
                setTimeout(function () {
                    if ($flags.noClose === false) {
                        close();
                    } else {
                        $flags.noClose = false;
                    }

                }, 300);
            });

            $inputElem.keypress(function (e) {
                if (e.which === 13) {
                    submit();
                }

            });
            $inputElem.keydown(function (e) {
                if (e.which === 38) {
                    e.preventDefault();
                    upArrow();
                }
                if (e.which === 40) {
                    e.preventDefault();
                    downArrow();
                }
            });
            $inputElem.on('input', function () {
                input();
            });
            $listElem.on("click", ".item span", function () {
                $flags.noClose = true;
                $inputElem.focus();
                listItemClick($(this).parent("li"));
            });

        }
        function setSettings(s) {
            extendArrayExcept(settings, s, eventNamesArray);
            extractListeners($parentElem, s);
        }

        return {
            init: function () {
                drawHtml(e);
                drawSvgElem($svgHtmlElem);
                drawBorderLine();
                drawMagnifier();

                extractListeners($parentElem, c_settings);
                setEvents();
            },
            setValue: setInputValue,
            getValue: getInputValue,
            emptyList: emptyList,
            addListItem: addListItem,
            setListItems: setListItems,
            settings: setSettings,
            open: function () {
                open();
            },
            close: function () {
                close();
            },
            clear: function () {
                emptyList();
                setInputValue("");
            }
        };
    };
}($, Snap, mina);

Jellybo.BootLoader({
    pluginName: "jellyboSearchButton003",
    animationFactory: Jellybo.SearchButton3,
    publicFunctions: ["getValue", "setValue", "emptyList", "addListItem", "setListItems", "open", "close", "clear"],
    selector: ".jellybo-SearchBar003",
    settingAttributes: ["width", "height", "onChange", "color_1", "color_2", "list_bg_color",
        "placeholder", "onSubmit", "onItemSelect", "onItemHighlight", "line_stroke", "magnifier_stroke",
        "onOpen", "onClose"]
});
