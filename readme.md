`json-fmt` - a JSON Formatter
=============================

Minify and prettify your JSONs

## What it is

The package `json-fmt` defines the class `JSONFormatter` for handling JSON strings, in order to give them a better presentation than the weak third argument of [`JSON.stringify`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify), or to minify them. No dependencies.

It also comes in CLI flavour, and there's a [gulp.js plugin](https://github.com/MaxArt2501/gulp-json-fmt/) and a [Grunt plugin](https://github.com/MaxArt2501/grunt-json-fmt). See the [changelog](changelog.md) to know the latest changes.

### What is *not* (yet)

* An object serializer: use `JSON.stringify` instead (there are [polyfills for IE7-](https://github.com/douglascrockford/JSON-js)), and eventually use the result with `JSONFormatter`.
* A syntax checker: although `JSONFormatter` *does* throw errors in case of malformed JSONs, it's not a fully fledged syntax checker (specifically, it doesn't thoroughly checks strings).

## Installation

Via `npm`:

```bash
$ npm install json-fmt
```

Use the option `-g` to get the CLI tool.

Via `bower`:

```bash
$ bower install json-fmt
```

In node.js/io.js:

```js
var JSONFormatter = require("json-fmt");
```

With an AMD loader (like [RequireJS](http://requirejs.org/)):

```js
require([ "json-fmt" ], function(JSONFormatter) {
    // ...
});
```

Simply as a global:

```html
<script src="json-fmt.js"></script>
```

## Usage

```js
// Creates a formatter with the default minifying options
var fmt = new JSONFormatter();

// Same as above
var fmt = new JSONFormatter(JSONFormatter.MINI);

// Creates a formatter with common prettifying options
var fmt = new JSONFormatter(JSONFormatter.PRETTY);

// Creates a formatter with some options overriding the usual
// minifying options
var fmt = new JSONFormatter({ indent: "\t", spaceBeforeColon: true });

// Elaborates a JSON string.
fmt.append(' { "foo": "bar", "test": 5 }');
console.log(fmt.flush()) // -> '{"foo":"bar","test":5}'

// Resets the formatter, so it can be reused
fmt.reset();

// Resets the formatter and changes some options
fmt.reset({ indentObject: true });

// Elaborates only a part of a JSON string
fmt.append('{"foo":"bar"');
console.log(fmt.flush());
// Displays the result so far ->
// {
//   "foo":"bar"

// Calling flush() again will result in the empty string
console.log(fmt.flush()); // -> ""

// Elaborates a last chunk of JSON string (optional) and checks for completeness
fmt.end(',"baz": [1, 2, 3]}');
console.log(fmt.flush());
// Displays the remaining part of the formatted JSON ->
// ,
//   "baz":[1,2,3]
// }
```

Note that in node.js/io.js `append()` and `end()` can accept a `Buffer` object too. The formatter will guess the used encoding. The only ones supported are UTF8, UTF16 Little Endian and UTF16 Big Endian, with or without BOM. If you expect other encodings, consider using conversions tool like [node-iconv](https://github.com/bnoordhuis/node-iconv) or [iconv-lite](https://github.com/ashtuchkin/iconv-lite).

It's safe to do as following, as long as the encoding is one of the above:

```js
var fs = require("fs"),
    JSONFormatter = require("json-fmt");

var fmt = new JSONFormatter(),
    stream = fs.createReadStream("somefile.json");

stream.on("data", function(chunk) {
    fmt.append(chunk);
});
```

The formatter will strip the BOM if it finds one, and will nicely handle broken UTF code points.

## Options

This is the set of accepted options, that are normally set to minify the JSON string.

* `newline` - default: `"\n"` (line feed)

  The new line sequence, used when indenting. The given value isn't checked.

* `indent` - default: `"  "` (two spaces)

  Indenting space. It's expected to be a string of spaces or tabs only, but no check is done about it. If a number is provided, the indentation space is set to that amount of spaces (up to 40).

* `indentArray` - default: `false`

  When set to `false`, arrays are rendered in one line; when set to `true`, array items are rendered one per line, and properly indented.

* `indentObject` - default: `false`

  When set to `false`, objects are rendered in one line; when set to `true`, object properties are rendered one per line, and properly indented.

* `spacedArray` - default: `false`

  When set to `true`, puts a space after the opening bracket and before the ending bracket when `indentArray` is `false`; or puts a space between the bracket in case of an empty array (`"[ ]"`).

* `spacedObject` - default: `false`

  When set to `true`, puts a space after the opening bracket and before the ending bracket when `indentObject` is `false`; or puts a space between the bracket in case of an empty object (`"{ }"`).

* `spaceAfterComma` - default: `false`

  Puts a space after the comma when `indentObject` and/or `indentArray` are set to `true` (e.g. `"[1, 2, 3]"` or `"{"a":1, "b":2}"`).

* `spaceAfterColon` - default: `false`

  Puts a space after the colon (before object property values).

* `spaceBeforeColon` - default: `false`

  Puts a space before the colon (after object property keys). Looks odd if `spaceAfterColon` is `false`...

* `commaFirst` - default: `false`

  Puts the comma as the first character of a new line when indenting objects and arrays. Examples:
  
  ```js
  [
      1
    , 2
    , 100
  ]
  
  {
      "foo": 5
    , "bar": 10
  }
  ```

* `uppercaseExponential` - default: `false`

  When rendering numbers in exponential format, the `e` character is transformed into `E`; otherwise, it's always rendered as lowercase.

## Command Line Interface (CLI)

When installed globally with npm, a CLI command `json-fmt` is created, providing a tool to transform JSON files and streams. See [usage](bin/usage) for more informations.

## License

MIT. See [LICENSE](LICENSE).
