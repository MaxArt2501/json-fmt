(function(root, tests) {
    if (typeof define === "function" && define.amd)
        define(["expect", "json-fmt"], tests);
    else if (typeof exports === "object")
        tests(require("../util/expect.js"), require("../dist/json-fmt.js"));
    else tests(root.expect, root.JSONFormatter);
})(this, function(expect, JSONFormatter) {
"use strict";

function jsonify(source, asExpected, options) {
    var fmt = new JSONFormatter(options);
    fmt.end(source);
    expect(fmt.flush()).to.be(asExpected);

    return fmt;
}

function jsonErr(e) { expect(e.name).to.be("JSONError"); }

var bind = Function.prototype.bind
    ? function(obj, name) { return obj[name].bind(obj); }
    : function(obj, name) {
        return function() {
            return obj[name].apply(obj, arguments);
        };
    };

var complexObject = {
    perfect: [ 6, 28, 496 ],
    matrix: [[ 1, 0 ], [ 0, 1 ]],
    foo: true,
    meh: null,
    mixed: {
        test: "foo",
        list: []
    }
}, json = JSON.stringify(complexObject);

describe("JSONFormatter", function() {
    it("should normally minify JSON strings", function() {
        jsonify(" 1 ", "1");
        jsonify(" \" foo \" ", "\" foo \"");
        jsonify("\ttrue", "true");
        jsonify("[\n\t1,\n\t2\n]", "[1,2]");
        jsonify(" { \"foo\": 42 } ", "{\"foo\":42}");
        jsonify(json, json);
    });

    it("should throw errors on malformed JSON strings", function() {
        expect(jsonify).to.throwError(jsonErr);
        expect(jsonify).withArgs("1, 2", "1,2").to.throwError(jsonErr);
        expect(jsonify).withArgs("\"foo\"bar\"", "\"foo\"bar\"").to.throwError(jsonErr);
        expect(jsonify).withArgs("[1,2,]", "[1,2]").to.throwError(jsonErr);
        expect(jsonify).withArgs("{ foo: 42 }", "{\"foo\":42}").to.throwError(jsonErr);
        expect(jsonify).withArgs("{ \"foo\": 42 ]", "{\"foo\":42}").to.throwError(jsonErr);
        expect(jsonify).withArgs("{ \"foo\", \"bar\" ]", "[\"foo\",\"bar\"]").to.throwError(jsonErr);
    });

    it("should correctly reset its state", function() {
        var fmt = new JSONFormatter();
        fmt.append("null");
        fmt.reset().end("true");
        expect(fmt.flush()).to.be("true");
    });

    it("should perform completeness checks on end()", function() {
        var fmt = new JSONFormatter();
        fmt.end("true");
        expect(bind(fmt.reset(), "end")).to.throwError(jsonErr);
        expect(bind(fmt.reset(), "end")).withArgs("[1,2").to.throwError(jsonErr);
        expect(bind(fmt.reset(), "end")).withArgs(" \"foo").to.throwError(jsonErr);
        expect(bind(fmt.reset(), "end")).withArgs("{ \"foo\"").to.throwError(jsonErr);
    });

    it("should correctly elaborate chunks of JSON", function() {
        var fmt = new JSONFormatter();
        fmt.append("\"foo");
        fmt.end("bar\"");
        expect(fmt.flush()).to.be("\"foobar\"");

        fmt.reset();
        for (var i = 0; i*10 < json.length; i++)
            fmt.append(json.substr(i*10, 10));
        expect(fmt.flush()).to.be(json);
    });

    it("should consume the current result with flush()", function() {
        var fmt = new JSONFormatter();
        fmt.append("[ 1, 2");
        expect(fmt.flush()).to.be("[1,");
        expect(fmt.flush()).to.be("");
    });

    it("should change the current options with reset(options)", function() {
        var fmt = jsonify("[1, 2]", "[1,2]");

        fmt.reset({ spacedArray: true, spaceAfterComma: true }).end("[1, 2]");
        expect(fmt.flush()).to.be("[ 1, 2 ]");
    });
});

describe("Options", function() {
    it("`indentArray` should indent arrays", function() {
        jsonify("[1,2]", "[\n  1,\n  2\n]", { indentArray: true });
    });
    it("`indentObject` should indent objects", function() {
        jsonify("{\"foo\": 42}", "{\n  \"foo\":42\n}", { indentObject: true });
    });
    it("`indent` should change the indentation", function() {
        jsonify("[1,2]", "[\n    1,\n    2\n]", { indentArray: true, indent: "    " });
        jsonify("[1, 2, { \"foo\": 42 }]", "[\n\t1,\n\t2,\n\t{\n\t\t\"foo\":42\n\t}\n]",
                { indentArray: true, indentObject: true, indent: "\t" });
    });
    it("`newline` should change the newline sequence", function() {
        jsonify("[1, 2, { \"foo\": 42 }]", "[\r\n  1,\r\n  2,\r\n  {\r\n    \"foo\":42\r\n  }\r\n]",
                { indentArray: true, indentObject: true,  newline: "\r\n" });
    });
    it("`spacedArray` should put spaces before and after array brackets", function() {
        jsonify("[1, 2]", "[ 1,2 ]", { spacedArray: true });
        jsonify("[]", "[ ]", { spacedArray: true });
    });
    it("`spacedObject` should put spaces before and after object brackets", function() {
        jsonify("{\"foo\": 42}", "{ \"foo\":42 }", { spacedObject: true });
        jsonify("{}", "{ }", { spacedObject: true });
    });
    it("`spaceAfterComma` should put a space after commas when not indenting", function() {
        jsonify("[1,2]", "[1, 2]", { spaceAfterComma: true });
        jsonify("{\"foo\": 6,\"bar\": 28}", "{\"foo\":6, \"bar\":28}", { spaceAfterComma: true });
        jsonify("[1,2]", "[\n  1,\n  2\n]", { indentArray: true, spaceAfterComma: true });
    });
    it("`spaceAfterColon` should put a space after colons", function() {
        jsonify("{\"foo\":6,\"bar\":28}", "{\"foo\": 6,\"bar\": 28}", { spaceAfterColon: true });
    });
    it("`spaceBeforeColon` should put a space before colons", function() {
        jsonify("{\"foo\":6,\"bar\":28}", "{\"foo\" :6,\"bar\" :28}", { spaceBeforeColon: true });
    });
    it("`commaFirst` should put commas as the first character when indenting", function() {
        jsonify("{\"foo\":6,\"bar\":28}", "{\n   \"foo\":6\n  ,\"bar\":28\n}", { commaFirst: true, indentObject: true });
        jsonify("[1,2,3]", "[\n   1\n  ,2\n  ,3\n]", { commaFirst: true, indentArray: true });
        jsonify("{\"foo\":6,\"bar\":28}", "{\"foo\":6,\"bar\":28}", { commaFirst: true });
        jsonify("[1, 2, 3]", "[1,2,3]", { commaFirst: true });
    });
    it("`uppercaseExponential` should transform numbers' exponential notation accordingly", function() {
        jsonify("1e5", "1E5", { uppercaseExponential: true });
        jsonify("1E5", "1e5", { uppercaseExponential: false });
    });
});

// Tests on buffers
if (typeof Buffer !== "undefined") (function() {
    var json = "{ \"disapproval\": \"ಠ_ಠ\"}",
        expected = "{\"disapproval\":\"ಠ_ಠ\"}",
        bufUTF8 = new Buffer(json),
        bufUTF16le = new Buffer(json, "ucs2"),
        bufUTF16be = new Buffer(json, "ucs2"),
        bufUTF8BOM = Buffer.concat([ new Buffer("\xef\xbb\xbf", "binary"), bufUTF8 ]),
        bufUTF16leBOM = Buffer.concat([ new Buffer("\xff\xfe", "binary"), bufUTF16le ]),
        bufUTF16beBOM;

    // Converting to Big Endian
    for (var i = 0; i < bufUTF16be.length; i += 2)
        bufUTF16be.writeUInt16BE(bufUTF16be.readUInt16LE(i), i);
    bufUTF16beBOM = Buffer.concat([ new Buffer("\xfe\xff", "binary"), bufUTF16be ]);

    describe("Buffers", function() {
        it("should accept UTF8 buffers", function() {
            jsonify(bufUTF8, expected);
        });
        it("should accept UTF8 with BOM buffers", function() {
            jsonify(bufUTF8BOM, expected);
        });
        it("should accept UTF16 Little Endian buffers", function() {
            jsonify(bufUTF16le, expected);
        });
        it("should accept UTF16 Little Endian with BOM buffers", function() {
            jsonify(bufUTF16leBOM, expected);
        });
        it("should accept UTF16 Big Endian buffers", function() {
            jsonify(bufUTF16be, expected);
        });
        it("should accept UTF16 Big Endian with BOM buffers", function() {
            jsonify(bufUTF16beBOM, expected);
        });
        it("should handle broken UTF8 code points correctly", function() {
            var fmt = new JSONFormatter();
            fmt.append(bufUTF8.slice(0, 20));
            fmt.append(bufUTF8.slice(20, 23));
            fmt.end(bufUTF8.slice(23));
            expect(fmt.flush()).to.be(expected);
        });
        it("should handle broken UTF16 code points correctly", function() {
            var fmt = new JSONFormatter();
            fmt.append(bufUTF16le.slice(0, 27));
            fmt.end(bufUTF16le.slice(27));
            expect(fmt.flush()).to.be(expected);

            fmt.reset().append(bufUTF16be.slice(0, 27));
            fmt.end(bufUTF16be.slice(27));
            expect(fmt.flush()).to.be(expected);
        });
    });
})();

});