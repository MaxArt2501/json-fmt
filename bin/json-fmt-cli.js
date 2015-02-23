#! /usr/bin/env node

var JSONFormatter = require("../dist/json-fmt.js"),
    fs = require("fs");

var input = process.stdin,
    output = process.stdout,
    error = process.stderr;

var options = {}, baseOpts, file, dest,
    shortOpts = "i ia io nl sa so sc sac sbc cf ue p o h".split(" "),
    longOpts = "indent indent_array indent_object newline spaced_array spaced_object space_after_comma space_after_colon space_before_colon comma_first uppercase_exponential prettify output help".split(" "),
    newlines = { crlf: "\r\n", lfcr: "\n\r", cr: "\r", lf: "\n" };

for (var i = 2, arg, val; i < process.argv.length; i++) {
    arg = process.argv[i];

    if (arg[0] === "-") {

        if (arg[1] !== "-" && (val = longOpts[shortOpts.indexOf(arg.slice(1))]))
            arg = "--" + val;

        if (arg.slice(0, 2) === "--" && longOpts.indexOf(arg.slice(2)) > -1) {
            arg = arg.slice(2).replace(/_[a-z]/g, function(m) { return m[1].toUpperCase(); })
            switch (arg) {
                case "prettify": baseOpts = JSONFormatter.PRETTY; break;
                case "help": printUsage(); break;
                case "output":
                    if (i < process.argv.length - 1)
                        dest = process.argv[++i];
                    break;
                case "indent":
                    val = process.argv[i + 1];
                    if (typeof val === "string" && /^(?:\d+|[ \t]+|tab)$/i.test(val)) {
                        options.indent = val.toLowerCase() === "tab" ? "\t"
                                : /\d/.test(val) ? +val : val;
                        i++;
                    }
                    break;
                case "newline":
                    val = process.argv[i + 1];
                    if (typeof val === "string") {
                        options.newline = newlines[val.toLowerCase()] || val;
                        i++;
                    }
                    break;
                default: options[arg] = true;
            }
            
        } else printUsage(1, "Unknown option: " + arg);

    } else if (!file) file = arg;
    else printUsage(2, "Incorrect argument: " + arg);
}

if (baseOpts)
    Object.keys(baseOpts).forEach(function(key) {
        if (!(key in options)) options[key] = baseOpts[key];
    });

if (file) {
    input = fs.createReadStream(file);
    input.on("error", function(error) {
        var msg = "Error reading from source: " + error.message;
        if (error.code === "ENOENT")
            msg = "Can't open input file \"" + file + "\"";
        errorExit(10, msg);
    });
}

if (dest) {
    output = fs.createWriteStream(dest);
    output.on("error", function(error) {
        var msg = "Error writing to destination: " + error.message;
        if (error.code === "ENOENT")
            msg = "Can't open output file \"" + file + "\"";
        errorExit(11, msg);
    });
}

var total = 0, xformed = 0,
    encoding, remainder,
    fmt = new JSONFormatter(options);

input.on("data", function(chunk) {
    total += chunk.length;
    try {
        fmt.append(chunk);
    } catch (e) {
        errorExit(20, e.message + (e.name !== "JSONError" ? "\n" + e.stack : ""));
    }
    chunk = fmt.flush();
    xformed += chunk.length;
    output.write(chunk);
});
input.on("end", function() {
    try {
        fmt.end();
    } catch (e) {
        errorExit(21, e.message + (e.name !== "JSONError" ? "\n" + e.stack : ""));
    }
    process.exit();
});

function printUsage(code, errorMsg) {
    errorExit(code, (errorMsg ? errorMsg + "\n" : "")
            + fs.readFileSync(__dirname + "/usage", { encoding: "utf8" }));
}

function errorExit(code, errorMsg) {
    error.write("JSONFormatter - v" + JSONFormatter.version + "\n\n");
    if (errorMsg) error.write(errorMsg + "\n");
    process.exit(code || 0);
}