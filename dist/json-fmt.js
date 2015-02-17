(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.JSONFormatter = factory();
    }
})(this, function() {
    "use strict";

        // Numeric indexes for the nesting contexts
        // Assigned so (context & OBJ) matches both object and array contexts
    var OBJ = 1, KEY = 2, ARR = 3,

        // Default options
        defaults = {
            newline: "\n",
            indent: "  ",
            indentArray: false,
            indentObject: false,
            commaFirst: false,
            spaceAfterColon: false,
            spaceAfterComma: false,
            spaceBeforeColon: false,
            spacedArray: false,
            spacedObject: false,
            uppercaseExponential: false
        };

    /**
     * @class
     * @param {String} message
     * @param {Number} [index]  Adds " at index #" to the message
     * @classdesc Error class for JSON syntax errors
     */
    function JSONError(message, index) {
        if (!this) return new JSONError(message, index);

        if (typeof index === "number") {
            this.message = message + " at index " + index;
            this.index = index;
        } else this.message = message;
    }
    JSONError.prototype = new Error();
    JSONError.prototype.name = "JSONError";

    /**
     * Merges the given objects into the destination
     * @function
     * @param {Object} dest
     * @param {...Object} sources
     * @returns {Object}           Equals dest
     */
    function extend(dest) {
        for (var i = 1, source, prop; i < arguments.length;) {
            source = arguments[i++];
            if (source)
                for (var prop in source)
                    dest[prop] = source[prop];
        }

        return dest;
    }

    /**
     * @classdesc Class to format a JSON string
     * @class Defines the methods in the objects (uses local private variables,
     *        so the methods can't be defined in the prototype)
     * @param {Object} [options]
     */
    function JSONFormatter(options) {
        options = extend({}, JSONFormatter.MINI, options);

            // Regexes to look for tokens
        var value =  /["\-\dntf\{\[]/g,
            valend = /["\-\dntf\{\[\]]/g,
            ctrl =   /[:,\}\]]/g,
            string = /"/g,
            strend = /["\}]/g,

            strparse = /(?:\\"|[^"\t\r\n])*/g,
            numparse = /(?:0|[1-9]\d*)?(?:\.\d*)?(?:[eE](?:[+\-]?\d*)?)?/g,
            white = /[ \t\r\n]+/g,
            black = /[^ \t\r\n]/g,

            seqmap = { t: "true", f: "false", n: "null" },

            rest, result,
            nesting, context,
            propCount, props,
            indent, expecting,
            totalIndex;

        // Creates a new context
        function pushContext(ctx) {
            if (context) nesting.push(context);
            if (ctx & OBJ) { // Matches objects and arrays
                if (props != null) propCount.push(props);
                props = 0;
                if (ctx === OBJ && options.indentObject
                        || ctx === ARR && options.indentArray)
                    indent += options.indent;
            }
            context = ctx;
        }

        // Retrieves the previous context from the stack
        function popContext() {
            if (context === OBJ && options.indentObject
                    || context === ARR && options.indentArray)
                indent = indent.slice(0, -options.indent.length);

            if (context & OBJ)
                props = propCount.pop();
            context = nesting.pop();
            return context;
        }

        // Adds a JSON token to the result, adding spaces and
        // indentation when needed
        function addPart(part) {
            var add = "";
            if (context === KEY) popContext();
            else if (context & OBJ) {
                if (!props++) {
                    if (context === OBJ && options.indentObject || context === ARR && options.indentArray) {
                        add = options.newline + indent;
                        if (options.commaFirst)
                            add += " " + (options.spaceAfterComma ? " " : "");
                    } else if (context === OBJ && options.spacedObject || context === ARR && options.spacedArray)
                        add = " ";
                }
                if (context === OBJ) pushContext(KEY);
            }
            result += add + part;
        }

        /**
         * Parses a chunk of JSON string to the current result
         * @memberof JSONFormatter
         * @param {String} chunk
         * @throws {JSONError}       In case of syntax error
         * @returns {JSONFormatter}
         */
        this.append = function(chunk) {
            if (rest) {
                chunk = rest + chunk;
                rest = "";
            }

            var startIndex = expecting.lastIndex = 0,
                mark, match, part, hasProps;

            // Label! I'm so sorry :(
            out: while (startIndex < chunk.length && (match = expecting.exec(chunk))) {
                mark = match[0];
                if (startIndex + mark.length < expecting.lastIndex) {
                    black.lastIndex = startIndex;
                    black.exec(chunk);
                    if (black.lastIndex < expecting.lastIndex)
                        throw new JSONError("Syntax error", totalIndex + black.lastIndex);
                }
                startIndex = expecting.lastIndex;

                switch (mark) {
                    case "\"":
                        strparse.lastIndex = startIndex;
                        match = strparse.exec(chunk);

                        if (strparse.lastIndex === chunk.length) {
                            rest = startIndex > 1 ? chunk.slice(startIndex - 1) : chunk;
                            break out;
                        }

                        if (chunk[strparse.lastIndex] !== "\"")
                            throw new JSONError("End of string expected",
                                    totalIndex + strparse.lastIndex);

                        addPart(chunk.slice(startIndex - 1, startIndex = strparse.lastIndex + 1));
                        expecting = ctrl;
                        break;

                    case "t": case "f": case "n":
                        part = seqmap[mark];

                        if (chunk.length < startIndex + part.length - 1) {
                            rest = startIndex > 1 ? chunk.slice(startIndex - 1) : chunk;
                            break out;
                        }

                        if (chunk.substr(startIndex - 1, part.length) !== part)
                            throw new JSONError("Unknown sequence", totalIndex + startIndex - 1);

                        addPart(part);
                        startIndex += part.length - 1;
                        expecting = ctrl;
                        break;

                    case "-": case "0": case "1": case "2": case "3": case "4":
                    case "5": case "6": case "7": case "8": case "9":
                        numparse.lastIndex = startIndex - (mark !== "-");
                        match = numparse.exec(chunk);

                        if (numparse.lastIndex === chunk.length) {
                            rest = startIndex > 1 ? chunk.slice(startIndex - 1) : chunk;
                            break out;
                        }

                        part = chunk.slice(startIndex - 1, startIndex = numparse.lastIndex);
                        if (options.uppercaseExponential) {
                            if (part.indexOf("e") > -1) part = part.toUpperCase();
                        } else if (part.indexOf("E") > -1) part = part.toLowerCase();

                        addPart(part);
                        expecting = ctrl;
                        break;

                    case "{":
                        if (context === ARR) addPart("{");
                        else result += "{";
                        pushContext(OBJ);
                        expecting = strend;
                        break;

                    case "[":
                        if (context === ARR) addPart("[");
                        else result += "[";
                        pushContext(ARR);
                        expecting = valend;
                        break;

                    case "}":
                        if (context !== OBJ)
                            throw new JSONError("Unexpected \"}\"",
                                    totalIndex + expecting.lastIndex - 1);

                        hasProps = props > 0;
                        if (popContext() === KEY) popContext();
                        result += (hasProps && options.indentObject ? options.newline + indent
                                : (options.spacedObject ? " " : "")) + "}";
                        
                        expecting = ctrl;
                        break;

                    case "]":
                        if (context !== ARR)
                            throw new JSONError("Unexpected \"]\"",
                                    totalIndex + expecting.lastIndex - 1);

                        hasProps = props > 0;
                        if (popContext() === KEY) popContext();
                        result += (hasProps && options.indentArray ? options.newline + indent
                                : (options.spacedArray ? " " : "")) + "]";

                        expecting = ctrl;
                        break;

                    case ":":
                        if (context !== KEY)
                            throw new JSONError("Unexpected \":\"",
                                    totalIndex + expecting.lastIndex - 1);

                        expecting = value;
                        result += (options.spaceBeforeColon ? " " : "") + ":"
                                + (options.spaceAfterColon ? " " : "");
                        break;

                    case ",":
                        if (context !== OBJ && context !== ARR)
                            throw new JSONError("Unexpected \",\"",
                                    totalIndex + expecting.lastIndex - 1);

                        expecting = context === OBJ ? string : value;
                        if (context === OBJ && options.indentObject || options.indentArray)
                            result += options.commaFirst ? options.newline + indent + "," + (options.spaceAfterComma ? " " : "")
                                    : "," + options.newline + indent;
                        else result += "," + (options.spaceAfterComma ? " " : "");
                        break;

                    default:
                        // Should never get here...
                        break;
                }

                if (!context) expecting = white;
                expecting.lastIndex = startIndex;
            }

            if (!match) {
                black.lastIndex = startIndex;
                match = black.exec(chunk);
                if (match)
                    throw new JSONError("Syntax error", totalIndex + match.index);
            }

            totalIndex += chunk.length - rest.length;

            return this;
        };

        /**
         * Verifies that the current result is correct. Eventually parses
         * a last chunk of JSON string.
         * @param {String} [chunk]
         * @throws {JSONError}       In case of premature end of JSON
         * @returns {JSONFormatter}
         */
        this.end = function(chunk) {
            if (chunk) this.append(chunk);
            if (!result) this.append(" ");
            if (!result || context)
                throw new JSONError("Unexpected end of input", totalIndex);

            return this;
        };

        /**
         * Returns (and consumes) the current result so far
         * @returns {String}
         */
        this.flush = function() {
            var ret = result;
            result = "";
            return ret;
        };

        /**
         * Resets the formatter, throwing away the current state and result,
         * and eventually changing the current options
         * @param {Object} [opts]
         * @returns {JSONFormatter}
         */
        this.reset = function(opts) {
            rest = result = indent = "";
            nesting = [];
            propCount = [];
            context = props = null;
            expecting = value;
            totalIndex = 0;

            if (opts) options = extend(options, opts);
            return this;
        };

        this.reset();
    }

    // Minifyinf options
    JSONFormatter.MINI = extend({}, defaults);

    // Common prettifying options
    JSONFormatter.PRETTY = {
        newline: "\n",
        indent: "  ",
        indentArray: true,
        indentObject: true,
        commaFirst: false,
        spaceAfterColon: true,
        spaceAfterComma: true,
        spaceBeforeColon: false,
        spacedArray: false,
        spacedObject: false,
        uppercaseExponential: false
    };

    JSONFormatter.JSONError = JSONError;

    return JSONFormatter;
});