`json-fmt` - a JSON Formatter
=============================

Minify and prettify your JSONs

## What it is

The package `json-fmt` defined the class `JSONFormatter` for handling JSON strings, in order to give them a better presentation than the weak third argument of [`JSON.stringify`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify), or to minify them.

### What is *not* (yet)

* An object serializer: use `JSON.stringify` instead (there are polyfills for IE7-), and eventually use the result with `JSONFormatter`.
* A syntax checker: although `JSONFormatter` *does* throw errors in case of malformed JSONs, it's not a fully fledged syntax checker (specifically, it doesn't thoroughly checks strings).

## Installation

Via `npm`:

```bash
$ npm install json-fmt
```

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

// Elaborates a JSON string
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

// Elaborates a last chunk of JSON string (optional) and checks for completeness
fmt.end(',"baz": [1, 2, 3]}');
console.log(fmt.flush());
// Displays the remaining part of the formatted JSON ->
// ,
//   "baz":[1,2,3]
// }
```

## Options

This is the set of accepted options, that are normally set to minify the JSON string.

* `newline` - default: `"\n"` (line feed)

  The new line sequence, used when indenting.

* `indent` - default: `"  "` (two spaces)

  Indenting space. It's expected to be a string of spaces or tabs only, but no check is done about it.

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

## License

MIT. See [LICENSE](LICENSE).