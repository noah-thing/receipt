#!/usr/bin/env node
import { createRequire as __cr } from 'module'; const require = __cr(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/commander/lib/error.js
var require_error = __commonJS({
  "node_modules/commander/lib/error.js"(exports) {
    "use strict";
    var CommanderError2 = class extends Error {
      /**
       * Constructs the CommanderError class
       * @param {number} exitCode suggested exit code which could be used with process.exit
       * @param {string} code an id string representing the error
       * @param {string} message human-readable description of the error
       */
      constructor(exitCode, code, message) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
        this.code = code;
        this.exitCode = exitCode;
        this.nestedError = void 0;
      }
    };
    var InvalidArgumentError2 = class extends CommanderError2 {
      /**
       * Constructs the InvalidArgumentError class
       * @param {string} [message] explanation of why argument is invalid
       */
      constructor(message) {
        super(1, "commander.invalidArgument", message);
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
      }
    };
    exports.CommanderError = CommanderError2;
    exports.InvalidArgumentError = InvalidArgumentError2;
  }
});

// node_modules/commander/lib/argument.js
var require_argument = __commonJS({
  "node_modules/commander/lib/argument.js"(exports) {
    "use strict";
    var { InvalidArgumentError: InvalidArgumentError2 } = require_error();
    var Argument2 = class {
      /**
       * Initialize a new command argument with the given name and description.
       * The default is that the argument is required, and you can explicitly
       * indicate this with <> around the name. Put [] around the name for an optional argument.
       *
       * @param {string} name
       * @param {string} [description]
       */
      constructor(name, description) {
        this.description = description || "";
        this.variadic = false;
        this.parseArg = void 0;
        this.defaultValue = void 0;
        this.defaultValueDescription = void 0;
        this.argChoices = void 0;
        switch (name[0]) {
          case "<":
            this.required = true;
            this._name = name.slice(1, -1);
            break;
          case "[":
            this.required = false;
            this._name = name.slice(1, -1);
            break;
          default:
            this.required = true;
            this._name = name;
            break;
        }
        if (this._name.length > 3 && this._name.slice(-3) === "...") {
          this.variadic = true;
          this._name = this._name.slice(0, -3);
        }
      }
      /**
       * Return argument name.
       *
       * @return {string}
       */
      name() {
        return this._name;
      }
      /**
       * @package
       */
      _concatValue(value, previous) {
        if (previous === this.defaultValue || !Array.isArray(previous)) {
          return [value];
        }
        return previous.concat(value);
      }
      /**
       * Set the default value, and optionally supply the description to be displayed in the help.
       *
       * @param {*} value
       * @param {string} [description]
       * @return {Argument}
       */
      default(value, description) {
        this.defaultValue = value;
        this.defaultValueDescription = description;
        return this;
      }
      /**
       * Set the custom handler for processing CLI command arguments into argument values.
       *
       * @param {Function} [fn]
       * @return {Argument}
       */
      argParser(fn) {
        this.parseArg = fn;
        return this;
      }
      /**
       * Only allow argument value to be one of choices.
       *
       * @param {string[]} values
       * @return {Argument}
       */
      choices(values) {
        this.argChoices = values.slice();
        this.parseArg = (arg, previous) => {
          if (!this.argChoices.includes(arg)) {
            throw new InvalidArgumentError2(
              `Allowed choices are ${this.argChoices.join(", ")}.`
            );
          }
          if (this.variadic) {
            return this._concatValue(arg, previous);
          }
          return arg;
        };
        return this;
      }
      /**
       * Make argument required.
       *
       * @returns {Argument}
       */
      argRequired() {
        this.required = true;
        return this;
      }
      /**
       * Make argument optional.
       *
       * @returns {Argument}
       */
      argOptional() {
        this.required = false;
        return this;
      }
    };
    function humanReadableArgName(arg) {
      const nameOutput = arg.name() + (arg.variadic === true ? "..." : "");
      return arg.required ? "<" + nameOutput + ">" : "[" + nameOutput + "]";
    }
    exports.Argument = Argument2;
    exports.humanReadableArgName = humanReadableArgName;
  }
});

// node_modules/commander/lib/help.js
var require_help = __commonJS({
  "node_modules/commander/lib/help.js"(exports) {
    "use strict";
    var { humanReadableArgName } = require_argument();
    var Help2 = class {
      constructor() {
        this.helpWidth = void 0;
        this.sortSubcommands = false;
        this.sortOptions = false;
        this.showGlobalOptions = false;
      }
      /**
       * Get an array of the visible subcommands. Includes a placeholder for the implicit help command, if there is one.
       *
       * @param {Command} cmd
       * @returns {Command[]}
       */
      visibleCommands(cmd) {
        const visibleCommands = cmd.commands.filter((cmd2) => !cmd2._hidden);
        const helpCommand = cmd._getHelpCommand();
        if (helpCommand && !helpCommand._hidden) {
          visibleCommands.push(helpCommand);
        }
        if (this.sortSubcommands) {
          visibleCommands.sort((a, b) => {
            return a.name().localeCompare(b.name());
          });
        }
        return visibleCommands;
      }
      /**
       * Compare options for sort.
       *
       * @param {Option} a
       * @param {Option} b
       * @returns {number}
       */
      compareOptions(a, b) {
        const getSortKey = (option) => {
          return option.short ? option.short.replace(/^-/, "") : option.long.replace(/^--/, "");
        };
        return getSortKey(a).localeCompare(getSortKey(b));
      }
      /**
       * Get an array of the visible options. Includes a placeholder for the implicit help option, if there is one.
       *
       * @param {Command} cmd
       * @returns {Option[]}
       */
      visibleOptions(cmd) {
        const visibleOptions = cmd.options.filter((option) => !option.hidden);
        const helpOption = cmd._getHelpOption();
        if (helpOption && !helpOption.hidden) {
          const removeShort = helpOption.short && cmd._findOption(helpOption.short);
          const removeLong = helpOption.long && cmd._findOption(helpOption.long);
          if (!removeShort && !removeLong) {
            visibleOptions.push(helpOption);
          } else if (helpOption.long && !removeLong) {
            visibleOptions.push(
              cmd.createOption(helpOption.long, helpOption.description)
            );
          } else if (helpOption.short && !removeShort) {
            visibleOptions.push(
              cmd.createOption(helpOption.short, helpOption.description)
            );
          }
        }
        if (this.sortOptions) {
          visibleOptions.sort(this.compareOptions);
        }
        return visibleOptions;
      }
      /**
       * Get an array of the visible global options. (Not including help.)
       *
       * @param {Command} cmd
       * @returns {Option[]}
       */
      visibleGlobalOptions(cmd) {
        if (!this.showGlobalOptions) return [];
        const globalOptions = [];
        for (let ancestorCmd = cmd.parent; ancestorCmd; ancestorCmd = ancestorCmd.parent) {
          const visibleOptions = ancestorCmd.options.filter(
            (option) => !option.hidden
          );
          globalOptions.push(...visibleOptions);
        }
        if (this.sortOptions) {
          globalOptions.sort(this.compareOptions);
        }
        return globalOptions;
      }
      /**
       * Get an array of the arguments if any have a description.
       *
       * @param {Command} cmd
       * @returns {Argument[]}
       */
      visibleArguments(cmd) {
        if (cmd._argsDescription) {
          cmd.registeredArguments.forEach((argument) => {
            argument.description = argument.description || cmd._argsDescription[argument.name()] || "";
          });
        }
        if (cmd.registeredArguments.find((argument) => argument.description)) {
          return cmd.registeredArguments;
        }
        return [];
      }
      /**
       * Get the command term to show in the list of subcommands.
       *
       * @param {Command} cmd
       * @returns {string}
       */
      subcommandTerm(cmd) {
        const args = cmd.registeredArguments.map((arg) => humanReadableArgName(arg)).join(" ");
        return cmd._name + (cmd._aliases[0] ? "|" + cmd._aliases[0] : "") + (cmd.options.length ? " [options]" : "") + // simplistic check for non-help option
        (args ? " " + args : "");
      }
      /**
       * Get the option term to show in the list of options.
       *
       * @param {Option} option
       * @returns {string}
       */
      optionTerm(option) {
        return option.flags;
      }
      /**
       * Get the argument term to show in the list of arguments.
       *
       * @param {Argument} argument
       * @returns {string}
       */
      argumentTerm(argument) {
        return argument.name();
      }
      /**
       * Get the longest command term length.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {number}
       */
      longestSubcommandTermLength(cmd, helper) {
        return helper.visibleCommands(cmd).reduce((max, command) => {
          return Math.max(max, helper.subcommandTerm(command).length);
        }, 0);
      }
      /**
       * Get the longest option term length.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {number}
       */
      longestOptionTermLength(cmd, helper) {
        return helper.visibleOptions(cmd).reduce((max, option) => {
          return Math.max(max, helper.optionTerm(option).length);
        }, 0);
      }
      /**
       * Get the longest global option term length.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {number}
       */
      longestGlobalOptionTermLength(cmd, helper) {
        return helper.visibleGlobalOptions(cmd).reduce((max, option) => {
          return Math.max(max, helper.optionTerm(option).length);
        }, 0);
      }
      /**
       * Get the longest argument term length.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {number}
       */
      longestArgumentTermLength(cmd, helper) {
        return helper.visibleArguments(cmd).reduce((max, argument) => {
          return Math.max(max, helper.argumentTerm(argument).length);
        }, 0);
      }
      /**
       * Get the command usage to be displayed at the top of the built-in help.
       *
       * @param {Command} cmd
       * @returns {string}
       */
      commandUsage(cmd) {
        let cmdName = cmd._name;
        if (cmd._aliases[0]) {
          cmdName = cmdName + "|" + cmd._aliases[0];
        }
        let ancestorCmdNames = "";
        for (let ancestorCmd = cmd.parent; ancestorCmd; ancestorCmd = ancestorCmd.parent) {
          ancestorCmdNames = ancestorCmd.name() + " " + ancestorCmdNames;
        }
        return ancestorCmdNames + cmdName + " " + cmd.usage();
      }
      /**
       * Get the description for the command.
       *
       * @param {Command} cmd
       * @returns {string}
       */
      commandDescription(cmd) {
        return cmd.description();
      }
      /**
       * Get the subcommand summary to show in the list of subcommands.
       * (Fallback to description for backwards compatibility.)
       *
       * @param {Command} cmd
       * @returns {string}
       */
      subcommandDescription(cmd) {
        return cmd.summary() || cmd.description();
      }
      /**
       * Get the option description to show in the list of options.
       *
       * @param {Option} option
       * @return {string}
       */
      optionDescription(option) {
        const extraInfo = [];
        if (option.argChoices) {
          extraInfo.push(
            // use stringify to match the display of the default value
            `choices: ${option.argChoices.map((choice) => JSON.stringify(choice)).join(", ")}`
          );
        }
        if (option.defaultValue !== void 0) {
          const showDefault = option.required || option.optional || option.isBoolean() && typeof option.defaultValue === "boolean";
          if (showDefault) {
            extraInfo.push(
              `default: ${option.defaultValueDescription || JSON.stringify(option.defaultValue)}`
            );
          }
        }
        if (option.presetArg !== void 0 && option.optional) {
          extraInfo.push(`preset: ${JSON.stringify(option.presetArg)}`);
        }
        if (option.envVar !== void 0) {
          extraInfo.push(`env: ${option.envVar}`);
        }
        if (extraInfo.length > 0) {
          return `${option.description} (${extraInfo.join(", ")})`;
        }
        return option.description;
      }
      /**
       * Get the argument description to show in the list of arguments.
       *
       * @param {Argument} argument
       * @return {string}
       */
      argumentDescription(argument) {
        const extraInfo = [];
        if (argument.argChoices) {
          extraInfo.push(
            // use stringify to match the display of the default value
            `choices: ${argument.argChoices.map((choice) => JSON.stringify(choice)).join(", ")}`
          );
        }
        if (argument.defaultValue !== void 0) {
          extraInfo.push(
            `default: ${argument.defaultValueDescription || JSON.stringify(argument.defaultValue)}`
          );
        }
        if (extraInfo.length > 0) {
          const extraDescripton = `(${extraInfo.join(", ")})`;
          if (argument.description) {
            return `${argument.description} ${extraDescripton}`;
          }
          return extraDescripton;
        }
        return argument.description;
      }
      /**
       * Generate the built-in help text.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {string}
       */
      formatHelp(cmd, helper) {
        const termWidth = helper.padWidth(cmd, helper);
        const helpWidth = helper.helpWidth || 80;
        const itemIndentWidth = 2;
        const itemSeparatorWidth = 2;
        function formatItem(term, description) {
          if (description) {
            const fullText = `${term.padEnd(termWidth + itemSeparatorWidth)}${description}`;
            return helper.wrap(
              fullText,
              helpWidth - itemIndentWidth,
              termWidth + itemSeparatorWidth
            );
          }
          return term;
        }
        function formatList(textArray) {
          return textArray.join("\n").replace(/^/gm, " ".repeat(itemIndentWidth));
        }
        let output = [`Usage: ${helper.commandUsage(cmd)}`, ""];
        const commandDescription = helper.commandDescription(cmd);
        if (commandDescription.length > 0) {
          output = output.concat([
            helper.wrap(commandDescription, helpWidth, 0),
            ""
          ]);
        }
        const argumentList = helper.visibleArguments(cmd).map((argument) => {
          return formatItem(
            helper.argumentTerm(argument),
            helper.argumentDescription(argument)
          );
        });
        if (argumentList.length > 0) {
          output = output.concat(["Arguments:", formatList(argumentList), ""]);
        }
        const optionList = helper.visibleOptions(cmd).map((option) => {
          return formatItem(
            helper.optionTerm(option),
            helper.optionDescription(option)
          );
        });
        if (optionList.length > 0) {
          output = output.concat(["Options:", formatList(optionList), ""]);
        }
        if (this.showGlobalOptions) {
          const globalOptionList = helper.visibleGlobalOptions(cmd).map((option) => {
            return formatItem(
              helper.optionTerm(option),
              helper.optionDescription(option)
            );
          });
          if (globalOptionList.length > 0) {
            output = output.concat([
              "Global Options:",
              formatList(globalOptionList),
              ""
            ]);
          }
        }
        const commandList = helper.visibleCommands(cmd).map((cmd2) => {
          return formatItem(
            helper.subcommandTerm(cmd2),
            helper.subcommandDescription(cmd2)
          );
        });
        if (commandList.length > 0) {
          output = output.concat(["Commands:", formatList(commandList), ""]);
        }
        return output.join("\n");
      }
      /**
       * Calculate the pad width from the maximum term length.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {number}
       */
      padWidth(cmd, helper) {
        return Math.max(
          helper.longestOptionTermLength(cmd, helper),
          helper.longestGlobalOptionTermLength(cmd, helper),
          helper.longestSubcommandTermLength(cmd, helper),
          helper.longestArgumentTermLength(cmd, helper)
        );
      }
      /**
       * Wrap the given string to width characters per line, with lines after the first indented.
       * Do not wrap if insufficient room for wrapping (minColumnWidth), or string is manually formatted.
       *
       * @param {string} str
       * @param {number} width
       * @param {number} indent
       * @param {number} [minColumnWidth=40]
       * @return {string}
       *
       */
      wrap(str2, width, indent, minColumnWidth = 40) {
        const indents = " \\f\\t\\v\xA0\u1680\u2000-\u200A\u202F\u205F\u3000\uFEFF";
        const manualIndent = new RegExp(`[\\n][${indents}]+`);
        if (str2.match(manualIndent)) return str2;
        const columnWidth = width - indent;
        if (columnWidth < minColumnWidth) return str2;
        const leadingStr = str2.slice(0, indent);
        const columnText = str2.slice(indent).replace("\r\n", "\n");
        const indentString = " ".repeat(indent);
        const zeroWidthSpace = "\u200B";
        const breaks = `\\s${zeroWidthSpace}`;
        const regex = new RegExp(
          `
|.{1,${columnWidth - 1}}([${breaks}]|$)|[^${breaks}]+?([${breaks}]|$)`,
          "g"
        );
        const lines = columnText.match(regex) || [];
        return leadingStr + lines.map((line, i) => {
          if (line === "\n") return "";
          return (i > 0 ? indentString : "") + line.trimEnd();
        }).join("\n");
      }
    };
    exports.Help = Help2;
  }
});

// node_modules/commander/lib/option.js
var require_option = __commonJS({
  "node_modules/commander/lib/option.js"(exports) {
    "use strict";
    var { InvalidArgumentError: InvalidArgumentError2 } = require_error();
    var Option2 = class {
      /**
       * Initialize a new `Option` with the given `flags` and `description`.
       *
       * @param {string} flags
       * @param {string} [description]
       */
      constructor(flags, description) {
        this.flags = flags;
        this.description = description || "";
        this.required = flags.includes("<");
        this.optional = flags.includes("[");
        this.variadic = /\w\.\.\.[>\]]$/.test(flags);
        this.mandatory = false;
        const optionFlags = splitOptionFlags(flags);
        this.short = optionFlags.shortFlag;
        this.long = optionFlags.longFlag;
        this.negate = false;
        if (this.long) {
          this.negate = this.long.startsWith("--no-");
        }
        this.defaultValue = void 0;
        this.defaultValueDescription = void 0;
        this.presetArg = void 0;
        this.envVar = void 0;
        this.parseArg = void 0;
        this.hidden = false;
        this.argChoices = void 0;
        this.conflictsWith = [];
        this.implied = void 0;
      }
      /**
       * Set the default value, and optionally supply the description to be displayed in the help.
       *
       * @param {*} value
       * @param {string} [description]
       * @return {Option}
       */
      default(value, description) {
        this.defaultValue = value;
        this.defaultValueDescription = description;
        return this;
      }
      /**
       * Preset to use when option used without option-argument, especially optional but also boolean and negated.
       * The custom processing (parseArg) is called.
       *
       * @example
       * new Option('--color').default('GREYSCALE').preset('RGB');
       * new Option('--donate [amount]').preset('20').argParser(parseFloat);
       *
       * @param {*} arg
       * @return {Option}
       */
      preset(arg) {
        this.presetArg = arg;
        return this;
      }
      /**
       * Add option name(s) that conflict with this option.
       * An error will be displayed if conflicting options are found during parsing.
       *
       * @example
       * new Option('--rgb').conflicts('cmyk');
       * new Option('--js').conflicts(['ts', 'jsx']);
       *
       * @param {(string | string[])} names
       * @return {Option}
       */
      conflicts(names) {
        this.conflictsWith = this.conflictsWith.concat(names);
        return this;
      }
      /**
       * Specify implied option values for when this option is set and the implied options are not.
       *
       * The custom processing (parseArg) is not called on the implied values.
       *
       * @example
       * program
       *   .addOption(new Option('--log', 'write logging information to file'))
       *   .addOption(new Option('--trace', 'log extra details').implies({ log: 'trace.txt' }));
       *
       * @param {object} impliedOptionValues
       * @return {Option}
       */
      implies(impliedOptionValues) {
        let newImplied = impliedOptionValues;
        if (typeof impliedOptionValues === "string") {
          newImplied = { [impliedOptionValues]: true };
        }
        this.implied = Object.assign(this.implied || {}, newImplied);
        return this;
      }
      /**
       * Set environment variable to check for option value.
       *
       * An environment variable is only used if when processed the current option value is
       * undefined, or the source of the current value is 'default' or 'config' or 'env'.
       *
       * @param {string} name
       * @return {Option}
       */
      env(name) {
        this.envVar = name;
        return this;
      }
      /**
       * Set the custom handler for processing CLI option arguments into option values.
       *
       * @param {Function} [fn]
       * @return {Option}
       */
      argParser(fn) {
        this.parseArg = fn;
        return this;
      }
      /**
       * Whether the option is mandatory and must have a value after parsing.
       *
       * @param {boolean} [mandatory=true]
       * @return {Option}
       */
      makeOptionMandatory(mandatory = true) {
        this.mandatory = !!mandatory;
        return this;
      }
      /**
       * Hide option in help.
       *
       * @param {boolean} [hide=true]
       * @return {Option}
       */
      hideHelp(hide = true) {
        this.hidden = !!hide;
        return this;
      }
      /**
       * @package
       */
      _concatValue(value, previous) {
        if (previous === this.defaultValue || !Array.isArray(previous)) {
          return [value];
        }
        return previous.concat(value);
      }
      /**
       * Only allow option value to be one of choices.
       *
       * @param {string[]} values
       * @return {Option}
       */
      choices(values) {
        this.argChoices = values.slice();
        this.parseArg = (arg, previous) => {
          if (!this.argChoices.includes(arg)) {
            throw new InvalidArgumentError2(
              `Allowed choices are ${this.argChoices.join(", ")}.`
            );
          }
          if (this.variadic) {
            return this._concatValue(arg, previous);
          }
          return arg;
        };
        return this;
      }
      /**
       * Return option name.
       *
       * @return {string}
       */
      name() {
        if (this.long) {
          return this.long.replace(/^--/, "");
        }
        return this.short.replace(/^-/, "");
      }
      /**
       * Return option name, in a camelcase format that can be used
       * as a object attribute key.
       *
       * @return {string}
       */
      attributeName() {
        return camelcase(this.name().replace(/^no-/, ""));
      }
      /**
       * Check if `arg` matches the short or long flag.
       *
       * @param {string} arg
       * @return {boolean}
       * @package
       */
      is(arg) {
        return this.short === arg || this.long === arg;
      }
      /**
       * Return whether a boolean option.
       *
       * Options are one of boolean, negated, required argument, or optional argument.
       *
       * @return {boolean}
       * @package
       */
      isBoolean() {
        return !this.required && !this.optional && !this.negate;
      }
    };
    var DualOptions = class {
      /**
       * @param {Option[]} options
       */
      constructor(options) {
        this.positiveOptions = /* @__PURE__ */ new Map();
        this.negativeOptions = /* @__PURE__ */ new Map();
        this.dualOptions = /* @__PURE__ */ new Set();
        options.forEach((option) => {
          if (option.negate) {
            this.negativeOptions.set(option.attributeName(), option);
          } else {
            this.positiveOptions.set(option.attributeName(), option);
          }
        });
        this.negativeOptions.forEach((value, key) => {
          if (this.positiveOptions.has(key)) {
            this.dualOptions.add(key);
          }
        });
      }
      /**
       * Did the value come from the option, and not from possible matching dual option?
       *
       * @param {*} value
       * @param {Option} option
       * @returns {boolean}
       */
      valueFromOption(value, option) {
        const optionKey = option.attributeName();
        if (!this.dualOptions.has(optionKey)) return true;
        const preset = this.negativeOptions.get(optionKey).presetArg;
        const negativeValue = preset !== void 0 ? preset : false;
        return option.negate === (negativeValue === value);
      }
    };
    function camelcase(str2) {
      return str2.split("-").reduce((str3, word) => {
        return str3 + word[0].toUpperCase() + word.slice(1);
      });
    }
    function splitOptionFlags(flags) {
      let shortFlag;
      let longFlag;
      const flagParts = flags.split(/[ |,]+/);
      if (flagParts.length > 1 && !/^[[<]/.test(flagParts[1]))
        shortFlag = flagParts.shift();
      longFlag = flagParts.shift();
      if (!shortFlag && /^-[^-]$/.test(longFlag)) {
        shortFlag = longFlag;
        longFlag = void 0;
      }
      return { shortFlag, longFlag };
    }
    exports.Option = Option2;
    exports.DualOptions = DualOptions;
  }
});

// node_modules/commander/lib/suggestSimilar.js
var require_suggestSimilar = __commonJS({
  "node_modules/commander/lib/suggestSimilar.js"(exports) {
    "use strict";
    var maxDistance = 3;
    function editDistance(a, b) {
      if (Math.abs(a.length - b.length) > maxDistance)
        return Math.max(a.length, b.length);
      const d = [];
      for (let i = 0; i <= a.length; i++) {
        d[i] = [i];
      }
      for (let j = 0; j <= b.length; j++) {
        d[0][j] = j;
      }
      for (let j = 1; j <= b.length; j++) {
        for (let i = 1; i <= a.length; i++) {
          let cost = 1;
          if (a[i - 1] === b[j - 1]) {
            cost = 0;
          } else {
            cost = 1;
          }
          d[i][j] = Math.min(
            d[i - 1][j] + 1,
            // deletion
            d[i][j - 1] + 1,
            // insertion
            d[i - 1][j - 1] + cost
            // substitution
          );
          if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
            d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
          }
        }
      }
      return d[a.length][b.length];
    }
    function suggestSimilar(word, candidates) {
      if (!candidates || candidates.length === 0) return "";
      candidates = Array.from(new Set(candidates));
      const searchingOptions = word.startsWith("--");
      if (searchingOptions) {
        word = word.slice(2);
        candidates = candidates.map((candidate) => candidate.slice(2));
      }
      let similar = [];
      let bestDistance = maxDistance;
      const minSimilarity = 0.4;
      candidates.forEach((candidate) => {
        if (candidate.length <= 1) return;
        const distance = editDistance(word, candidate);
        const length = Math.max(word.length, candidate.length);
        const similarity = (length - distance) / length;
        if (similarity > minSimilarity) {
          if (distance < bestDistance) {
            bestDistance = distance;
            similar = [candidate];
          } else if (distance === bestDistance) {
            similar.push(candidate);
          }
        }
      });
      similar.sort((a, b) => a.localeCompare(b));
      if (searchingOptions) {
        similar = similar.map((candidate) => `--${candidate}`);
      }
      if (similar.length > 1) {
        return `
(Did you mean one of ${similar.join(", ")}?)`;
      }
      if (similar.length === 1) {
        return `
(Did you mean ${similar[0]}?)`;
      }
      return "";
    }
    exports.suggestSimilar = suggestSimilar;
  }
});

// node_modules/commander/lib/command.js
var require_command = __commonJS({
  "node_modules/commander/lib/command.js"(exports) {
    "use strict";
    var EventEmitter = __require("events").EventEmitter;
    var childProcess = __require("child_process");
    var path = __require("path");
    var fs = __require("fs");
    var process2 = __require("process");
    var { Argument: Argument2, humanReadableArgName } = require_argument();
    var { CommanderError: CommanderError2 } = require_error();
    var { Help: Help2 } = require_help();
    var { Option: Option2, DualOptions } = require_option();
    var { suggestSimilar } = require_suggestSimilar();
    var Command2 = class _Command extends EventEmitter {
      /**
       * Initialize a new `Command`.
       *
       * @param {string} [name]
       */
      constructor(name) {
        super();
        this.commands = [];
        this.options = [];
        this.parent = null;
        this._allowUnknownOption = false;
        this._allowExcessArguments = true;
        this.registeredArguments = [];
        this._args = this.registeredArguments;
        this.args = [];
        this.rawArgs = [];
        this.processedArgs = [];
        this._scriptPath = null;
        this._name = name || "";
        this._optionValues = {};
        this._optionValueSources = {};
        this._storeOptionsAsProperties = false;
        this._actionHandler = null;
        this._executableHandler = false;
        this._executableFile = null;
        this._executableDir = null;
        this._defaultCommandName = null;
        this._exitCallback = null;
        this._aliases = [];
        this._combineFlagAndOptionalValue = true;
        this._description = "";
        this._summary = "";
        this._argsDescription = void 0;
        this._enablePositionalOptions = false;
        this._passThroughOptions = false;
        this._lifeCycleHooks = {};
        this._showHelpAfterError = false;
        this._showSuggestionAfterError = true;
        this._outputConfiguration = {
          writeOut: (str2) => process2.stdout.write(str2),
          writeErr: (str2) => process2.stderr.write(str2),
          getOutHelpWidth: () => process2.stdout.isTTY ? process2.stdout.columns : void 0,
          getErrHelpWidth: () => process2.stderr.isTTY ? process2.stderr.columns : void 0,
          outputError: (str2, write) => write(str2)
        };
        this._hidden = false;
        this._helpOption = void 0;
        this._addImplicitHelpCommand = void 0;
        this._helpCommand = void 0;
        this._helpConfiguration = {};
      }
      /**
       * Copy settings that are useful to have in common across root command and subcommands.
       *
       * (Used internally when adding a command using `.command()` so subcommands inherit parent settings.)
       *
       * @param {Command} sourceCommand
       * @return {Command} `this` command for chaining
       */
      copyInheritedSettings(sourceCommand) {
        this._outputConfiguration = sourceCommand._outputConfiguration;
        this._helpOption = sourceCommand._helpOption;
        this._helpCommand = sourceCommand._helpCommand;
        this._helpConfiguration = sourceCommand._helpConfiguration;
        this._exitCallback = sourceCommand._exitCallback;
        this._storeOptionsAsProperties = sourceCommand._storeOptionsAsProperties;
        this._combineFlagAndOptionalValue = sourceCommand._combineFlagAndOptionalValue;
        this._allowExcessArguments = sourceCommand._allowExcessArguments;
        this._enablePositionalOptions = sourceCommand._enablePositionalOptions;
        this._showHelpAfterError = sourceCommand._showHelpAfterError;
        this._showSuggestionAfterError = sourceCommand._showSuggestionAfterError;
        return this;
      }
      /**
       * @returns {Command[]}
       * @private
       */
      _getCommandAndAncestors() {
        const result = [];
        for (let command = this; command; command = command.parent) {
          result.push(command);
        }
        return result;
      }
      /**
       * Define a command.
       *
       * There are two styles of command: pay attention to where to put the description.
       *
       * @example
       * // Command implemented using action handler (description is supplied separately to `.command`)
       * program
       *   .command('clone <source> [destination]')
       *   .description('clone a repository into a newly created directory')
       *   .action((source, destination) => {
       *     console.log('clone command called');
       *   });
       *
       * // Command implemented using separate executable file (description is second parameter to `.command`)
       * program
       *   .command('start <service>', 'start named service')
       *   .command('stop [service]', 'stop named service, or all if no name supplied');
       *
       * @param {string} nameAndArgs - command name and arguments, args are `<required>` or `[optional]` and last may also be `variadic...`
       * @param {(object | string)} [actionOptsOrExecDesc] - configuration options (for action), or description (for executable)
       * @param {object} [execOpts] - configuration options (for executable)
       * @return {Command} returns new command for action handler, or `this` for executable command
       */
      command(nameAndArgs, actionOptsOrExecDesc, execOpts) {
        let desc = actionOptsOrExecDesc;
        let opts = execOpts;
        if (typeof desc === "object" && desc !== null) {
          opts = desc;
          desc = null;
        }
        opts = opts || {};
        const [, name, args] = nameAndArgs.match(/([^ ]+) *(.*)/);
        const cmd = this.createCommand(name);
        if (desc) {
          cmd.description(desc);
          cmd._executableHandler = true;
        }
        if (opts.isDefault) this._defaultCommandName = cmd._name;
        cmd._hidden = !!(opts.noHelp || opts.hidden);
        cmd._executableFile = opts.executableFile || null;
        if (args) cmd.arguments(args);
        this._registerCommand(cmd);
        cmd.parent = this;
        cmd.copyInheritedSettings(this);
        if (desc) return this;
        return cmd;
      }
      /**
       * Factory routine to create a new unattached command.
       *
       * See .command() for creating an attached subcommand, which uses this routine to
       * create the command. You can override createCommand to customise subcommands.
       *
       * @param {string} [name]
       * @return {Command} new command
       */
      createCommand(name) {
        return new _Command(name);
      }
      /**
       * You can customise the help with a subclass of Help by overriding createHelp,
       * or by overriding Help properties using configureHelp().
       *
       * @return {Help}
       */
      createHelp() {
        return Object.assign(new Help2(), this.configureHelp());
      }
      /**
       * You can customise the help by overriding Help properties using configureHelp(),
       * or with a subclass of Help by overriding createHelp().
       *
       * @param {object} [configuration] - configuration options
       * @return {(Command | object)} `this` command for chaining, or stored configuration
       */
      configureHelp(configuration) {
        if (configuration === void 0) return this._helpConfiguration;
        this._helpConfiguration = configuration;
        return this;
      }
      /**
       * The default output goes to stdout and stderr. You can customise this for special
       * applications. You can also customise the display of errors by overriding outputError.
       *
       * The configuration properties are all functions:
       *
       *     // functions to change where being written, stdout and stderr
       *     writeOut(str)
       *     writeErr(str)
       *     // matching functions to specify width for wrapping help
       *     getOutHelpWidth()
       *     getErrHelpWidth()
       *     // functions based on what is being written out
       *     outputError(str, write) // used for displaying errors, and not used for displaying help
       *
       * @param {object} [configuration] - configuration options
       * @return {(Command | object)} `this` command for chaining, or stored configuration
       */
      configureOutput(configuration) {
        if (configuration === void 0) return this._outputConfiguration;
        Object.assign(this._outputConfiguration, configuration);
        return this;
      }
      /**
       * Display the help or a custom message after an error occurs.
       *
       * @param {(boolean|string)} [displayHelp]
       * @return {Command} `this` command for chaining
       */
      showHelpAfterError(displayHelp = true) {
        if (typeof displayHelp !== "string") displayHelp = !!displayHelp;
        this._showHelpAfterError = displayHelp;
        return this;
      }
      /**
       * Display suggestion of similar commands for unknown commands, or options for unknown options.
       *
       * @param {boolean} [displaySuggestion]
       * @return {Command} `this` command for chaining
       */
      showSuggestionAfterError(displaySuggestion = true) {
        this._showSuggestionAfterError = !!displaySuggestion;
        return this;
      }
      /**
       * Add a prepared subcommand.
       *
       * See .command() for creating an attached subcommand which inherits settings from its parent.
       *
       * @param {Command} cmd - new subcommand
       * @param {object} [opts] - configuration options
       * @return {Command} `this` command for chaining
       */
      addCommand(cmd, opts) {
        if (!cmd._name) {
          throw new Error(`Command passed to .addCommand() must have a name
- specify the name in Command constructor or using .name()`);
        }
        opts = opts || {};
        if (opts.isDefault) this._defaultCommandName = cmd._name;
        if (opts.noHelp || opts.hidden) cmd._hidden = true;
        this._registerCommand(cmd);
        cmd.parent = this;
        cmd._checkForBrokenPassThrough();
        return this;
      }
      /**
       * Factory routine to create a new unattached argument.
       *
       * See .argument() for creating an attached argument, which uses this routine to
       * create the argument. You can override createArgument to return a custom argument.
       *
       * @param {string} name
       * @param {string} [description]
       * @return {Argument} new argument
       */
      createArgument(name, description) {
        return new Argument2(name, description);
      }
      /**
       * Define argument syntax for command.
       *
       * The default is that the argument is required, and you can explicitly
       * indicate this with <> around the name. Put [] around the name for an optional argument.
       *
       * @example
       * program.argument('<input-file>');
       * program.argument('[output-file]');
       *
       * @param {string} name
       * @param {string} [description]
       * @param {(Function|*)} [fn] - custom argument processing function
       * @param {*} [defaultValue]
       * @return {Command} `this` command for chaining
       */
      argument(name, description, fn, defaultValue) {
        const argument = this.createArgument(name, description);
        if (typeof fn === "function") {
          argument.default(defaultValue).argParser(fn);
        } else {
          argument.default(fn);
        }
        this.addArgument(argument);
        return this;
      }
      /**
       * Define argument syntax for command, adding multiple at once (without descriptions).
       *
       * See also .argument().
       *
       * @example
       * program.arguments('<cmd> [env]');
       *
       * @param {string} names
       * @return {Command} `this` command for chaining
       */
      arguments(names) {
        names.trim().split(/ +/).forEach((detail) => {
          this.argument(detail);
        });
        return this;
      }
      /**
       * Define argument syntax for command, adding a prepared argument.
       *
       * @param {Argument} argument
       * @return {Command} `this` command for chaining
       */
      addArgument(argument) {
        const previousArgument = this.registeredArguments.slice(-1)[0];
        if (previousArgument && previousArgument.variadic) {
          throw new Error(
            `only the last argument can be variadic '${previousArgument.name()}'`
          );
        }
        if (argument.required && argument.defaultValue !== void 0 && argument.parseArg === void 0) {
          throw new Error(
            `a default value for a required argument is never used: '${argument.name()}'`
          );
        }
        this.registeredArguments.push(argument);
        return this;
      }
      /**
       * Customise or override default help command. By default a help command is automatically added if your command has subcommands.
       *
       * @example
       *    program.helpCommand('help [cmd]');
       *    program.helpCommand('help [cmd]', 'show help');
       *    program.helpCommand(false); // suppress default help command
       *    program.helpCommand(true); // add help command even if no subcommands
       *
       * @param {string|boolean} enableOrNameAndArgs - enable with custom name and/or arguments, or boolean to override whether added
       * @param {string} [description] - custom description
       * @return {Command} `this` command for chaining
       */
      helpCommand(enableOrNameAndArgs, description) {
        if (typeof enableOrNameAndArgs === "boolean") {
          this._addImplicitHelpCommand = enableOrNameAndArgs;
          return this;
        }
        enableOrNameAndArgs = enableOrNameAndArgs ?? "help [command]";
        const [, helpName, helpArgs] = enableOrNameAndArgs.match(/([^ ]+) *(.*)/);
        const helpDescription = description ?? "display help for command";
        const helpCommand = this.createCommand(helpName);
        helpCommand.helpOption(false);
        if (helpArgs) helpCommand.arguments(helpArgs);
        if (helpDescription) helpCommand.description(helpDescription);
        this._addImplicitHelpCommand = true;
        this._helpCommand = helpCommand;
        return this;
      }
      /**
       * Add prepared custom help command.
       *
       * @param {(Command|string|boolean)} helpCommand - custom help command, or deprecated enableOrNameAndArgs as for `.helpCommand()`
       * @param {string} [deprecatedDescription] - deprecated custom description used with custom name only
       * @return {Command} `this` command for chaining
       */
      addHelpCommand(helpCommand, deprecatedDescription) {
        if (typeof helpCommand !== "object") {
          this.helpCommand(helpCommand, deprecatedDescription);
          return this;
        }
        this._addImplicitHelpCommand = true;
        this._helpCommand = helpCommand;
        return this;
      }
      /**
       * Lazy create help command.
       *
       * @return {(Command|null)}
       * @package
       */
      _getHelpCommand() {
        const hasImplicitHelpCommand = this._addImplicitHelpCommand ?? (this.commands.length && !this._actionHandler && !this._findCommand("help"));
        if (hasImplicitHelpCommand) {
          if (this._helpCommand === void 0) {
            this.helpCommand(void 0, void 0);
          }
          return this._helpCommand;
        }
        return null;
      }
      /**
       * Add hook for life cycle event.
       *
       * @param {string} event
       * @param {Function} listener
       * @return {Command} `this` command for chaining
       */
      hook(event, listener) {
        const allowedValues = ["preSubcommand", "preAction", "postAction"];
        if (!allowedValues.includes(event)) {
          throw new Error(`Unexpected value for event passed to hook : '${event}'.
Expecting one of '${allowedValues.join("', '")}'`);
        }
        if (this._lifeCycleHooks[event]) {
          this._lifeCycleHooks[event].push(listener);
        } else {
          this._lifeCycleHooks[event] = [listener];
        }
        return this;
      }
      /**
       * Register callback to use as replacement for calling process.exit.
       *
       * @param {Function} [fn] optional callback which will be passed a CommanderError, defaults to throwing
       * @return {Command} `this` command for chaining
       */
      exitOverride(fn) {
        if (fn) {
          this._exitCallback = fn;
        } else {
          this._exitCallback = (err) => {
            if (err.code !== "commander.executeSubCommandAsync") {
              throw err;
            } else {
            }
          };
        }
        return this;
      }
      /**
       * Call process.exit, and _exitCallback if defined.
       *
       * @param {number} exitCode exit code for using with process.exit
       * @param {string} code an id string representing the error
       * @param {string} message human-readable description of the error
       * @return never
       * @private
       */
      _exit(exitCode, code, message) {
        if (this._exitCallback) {
          this._exitCallback(new CommanderError2(exitCode, code, message));
        }
        process2.exit(exitCode);
      }
      /**
       * Register callback `fn` for the command.
       *
       * @example
       * program
       *   .command('serve')
       *   .description('start service')
       *   .action(function() {
       *      // do work here
       *   });
       *
       * @param {Function} fn
       * @return {Command} `this` command for chaining
       */
      action(fn) {
        const listener = (args) => {
          const expectedArgsCount = this.registeredArguments.length;
          const actionArgs = args.slice(0, expectedArgsCount);
          if (this._storeOptionsAsProperties) {
            actionArgs[expectedArgsCount] = this;
          } else {
            actionArgs[expectedArgsCount] = this.opts();
          }
          actionArgs.push(this);
          return fn.apply(this, actionArgs);
        };
        this._actionHandler = listener;
        return this;
      }
      /**
       * Factory routine to create a new unattached option.
       *
       * See .option() for creating an attached option, which uses this routine to
       * create the option. You can override createOption to return a custom option.
       *
       * @param {string} flags
       * @param {string} [description]
       * @return {Option} new option
       */
      createOption(flags, description) {
        return new Option2(flags, description);
      }
      /**
       * Wrap parseArgs to catch 'commander.invalidArgument'.
       *
       * @param {(Option | Argument)} target
       * @param {string} value
       * @param {*} previous
       * @param {string} invalidArgumentMessage
       * @private
       */
      _callParseArg(target, value, previous, invalidArgumentMessage) {
        try {
          return target.parseArg(value, previous);
        } catch (err) {
          if (err.code === "commander.invalidArgument") {
            const message = `${invalidArgumentMessage} ${err.message}`;
            this.error(message, { exitCode: err.exitCode, code: err.code });
          }
          throw err;
        }
      }
      /**
       * Check for option flag conflicts.
       * Register option if no conflicts found, or throw on conflict.
       *
       * @param {Option} option
       * @private
       */
      _registerOption(option) {
        const matchingOption = option.short && this._findOption(option.short) || option.long && this._findOption(option.long);
        if (matchingOption) {
          const matchingFlag = option.long && this._findOption(option.long) ? option.long : option.short;
          throw new Error(`Cannot add option '${option.flags}'${this._name && ` to command '${this._name}'`} due to conflicting flag '${matchingFlag}'
-  already used by option '${matchingOption.flags}'`);
        }
        this.options.push(option);
      }
      /**
       * Check for command name and alias conflicts with existing commands.
       * Register command if no conflicts found, or throw on conflict.
       *
       * @param {Command} command
       * @private
       */
      _registerCommand(command) {
        const knownBy = (cmd) => {
          return [cmd.name()].concat(cmd.aliases());
        };
        const alreadyUsed = knownBy(command).find(
          (name) => this._findCommand(name)
        );
        if (alreadyUsed) {
          const existingCmd = knownBy(this._findCommand(alreadyUsed)).join("|");
          const newCmd = knownBy(command).join("|");
          throw new Error(
            `cannot add command '${newCmd}' as already have command '${existingCmd}'`
          );
        }
        this.commands.push(command);
      }
      /**
       * Add an option.
       *
       * @param {Option} option
       * @return {Command} `this` command for chaining
       */
      addOption(option) {
        this._registerOption(option);
        const oname = option.name();
        const name = option.attributeName();
        if (option.negate) {
          const positiveLongFlag = option.long.replace(/^--no-/, "--");
          if (!this._findOption(positiveLongFlag)) {
            this.setOptionValueWithSource(
              name,
              option.defaultValue === void 0 ? true : option.defaultValue,
              "default"
            );
          }
        } else if (option.defaultValue !== void 0) {
          this.setOptionValueWithSource(name, option.defaultValue, "default");
        }
        const handleOptionValue = (val, invalidValueMessage, valueSource) => {
          if (val == null && option.presetArg !== void 0) {
            val = option.presetArg;
          }
          const oldValue = this.getOptionValue(name);
          if (val !== null && option.parseArg) {
            val = this._callParseArg(option, val, oldValue, invalidValueMessage);
          } else if (val !== null && option.variadic) {
            val = option._concatValue(val, oldValue);
          }
          if (val == null) {
            if (option.negate) {
              val = false;
            } else if (option.isBoolean() || option.optional) {
              val = true;
            } else {
              val = "";
            }
          }
          this.setOptionValueWithSource(name, val, valueSource);
        };
        this.on("option:" + oname, (val) => {
          const invalidValueMessage = `error: option '${option.flags}' argument '${val}' is invalid.`;
          handleOptionValue(val, invalidValueMessage, "cli");
        });
        if (option.envVar) {
          this.on("optionEnv:" + oname, (val) => {
            const invalidValueMessage = `error: option '${option.flags}' value '${val}' from env '${option.envVar}' is invalid.`;
            handleOptionValue(val, invalidValueMessage, "env");
          });
        }
        return this;
      }
      /**
       * Internal implementation shared by .option() and .requiredOption()
       *
       * @return {Command} `this` command for chaining
       * @private
       */
      _optionEx(config, flags, description, fn, defaultValue) {
        if (typeof flags === "object" && flags instanceof Option2) {
          throw new Error(
            "To add an Option object use addOption() instead of option() or requiredOption()"
          );
        }
        const option = this.createOption(flags, description);
        option.makeOptionMandatory(!!config.mandatory);
        if (typeof fn === "function") {
          option.default(defaultValue).argParser(fn);
        } else if (fn instanceof RegExp) {
          const regex = fn;
          fn = (val, def) => {
            const m = regex.exec(val);
            return m ? m[0] : def;
          };
          option.default(defaultValue).argParser(fn);
        } else {
          option.default(fn);
        }
        return this.addOption(option);
      }
      /**
       * Define option with `flags`, `description`, and optional argument parsing function or `defaultValue` or both.
       *
       * The `flags` string contains the short and/or long flags, separated by comma, a pipe or space. A required
       * option-argument is indicated by `<>` and an optional option-argument by `[]`.
       *
       * See the README for more details, and see also addOption() and requiredOption().
       *
       * @example
       * program
       *     .option('-p, --pepper', 'add pepper')
       *     .option('-p, --pizza-type <TYPE>', 'type of pizza') // required option-argument
       *     .option('-c, --cheese [CHEESE]', 'add extra cheese', 'mozzarella') // optional option-argument with default
       *     .option('-t, --tip <VALUE>', 'add tip to purchase cost', parseFloat) // custom parse function
       *
       * @param {string} flags
       * @param {string} [description]
       * @param {(Function|*)} [parseArg] - custom option processing function or default value
       * @param {*} [defaultValue]
       * @return {Command} `this` command for chaining
       */
      option(flags, description, parseArg, defaultValue) {
        return this._optionEx({}, flags, description, parseArg, defaultValue);
      }
      /**
       * Add a required option which must have a value after parsing. This usually means
       * the option must be specified on the command line. (Otherwise the same as .option().)
       *
       * The `flags` string contains the short and/or long flags, separated by comma, a pipe or space.
       *
       * @param {string} flags
       * @param {string} [description]
       * @param {(Function|*)} [parseArg] - custom option processing function or default value
       * @param {*} [defaultValue]
       * @return {Command} `this` command for chaining
       */
      requiredOption(flags, description, parseArg, defaultValue) {
        return this._optionEx(
          { mandatory: true },
          flags,
          description,
          parseArg,
          defaultValue
        );
      }
      /**
       * Alter parsing of short flags with optional values.
       *
       * @example
       * // for `.option('-f,--flag [value]'):
       * program.combineFlagAndOptionalValue(true);  // `-f80` is treated like `--flag=80`, this is the default behaviour
       * program.combineFlagAndOptionalValue(false) // `-fb` is treated like `-f -b`
       *
       * @param {boolean} [combine] - if `true` or omitted, an optional value can be specified directly after the flag.
       * @return {Command} `this` command for chaining
       */
      combineFlagAndOptionalValue(combine = true) {
        this._combineFlagAndOptionalValue = !!combine;
        return this;
      }
      /**
       * Allow unknown options on the command line.
       *
       * @param {boolean} [allowUnknown] - if `true` or omitted, no error will be thrown for unknown options.
       * @return {Command} `this` command for chaining
       */
      allowUnknownOption(allowUnknown = true) {
        this._allowUnknownOption = !!allowUnknown;
        return this;
      }
      /**
       * Allow excess command-arguments on the command line. Pass false to make excess arguments an error.
       *
       * @param {boolean} [allowExcess] - if `true` or omitted, no error will be thrown for excess arguments.
       * @return {Command} `this` command for chaining
       */
      allowExcessArguments(allowExcess = true) {
        this._allowExcessArguments = !!allowExcess;
        return this;
      }
      /**
       * Enable positional options. Positional means global options are specified before subcommands which lets
       * subcommands reuse the same option names, and also enables subcommands to turn on passThroughOptions.
       * The default behaviour is non-positional and global options may appear anywhere on the command line.
       *
       * @param {boolean} [positional]
       * @return {Command} `this` command for chaining
       */
      enablePositionalOptions(positional = true) {
        this._enablePositionalOptions = !!positional;
        return this;
      }
      /**
       * Pass through options that come after command-arguments rather than treat them as command-options,
       * so actual command-options come before command-arguments. Turning this on for a subcommand requires
       * positional options to have been enabled on the program (parent commands).
       * The default behaviour is non-positional and options may appear before or after command-arguments.
       *
       * @param {boolean} [passThrough] for unknown options.
       * @return {Command} `this` command for chaining
       */
      passThroughOptions(passThrough = true) {
        this._passThroughOptions = !!passThrough;
        this._checkForBrokenPassThrough();
        return this;
      }
      /**
       * @private
       */
      _checkForBrokenPassThrough() {
        if (this.parent && this._passThroughOptions && !this.parent._enablePositionalOptions) {
          throw new Error(
            `passThroughOptions cannot be used for '${this._name}' without turning on enablePositionalOptions for parent command(s)`
          );
        }
      }
      /**
       * Whether to store option values as properties on command object,
       * or store separately (specify false). In both cases the option values can be accessed using .opts().
       *
       * @param {boolean} [storeAsProperties=true]
       * @return {Command} `this` command for chaining
       */
      storeOptionsAsProperties(storeAsProperties = true) {
        if (this.options.length) {
          throw new Error("call .storeOptionsAsProperties() before adding options");
        }
        if (Object.keys(this._optionValues).length) {
          throw new Error(
            "call .storeOptionsAsProperties() before setting option values"
          );
        }
        this._storeOptionsAsProperties = !!storeAsProperties;
        return this;
      }
      /**
       * Retrieve option value.
       *
       * @param {string} key
       * @return {object} value
       */
      getOptionValue(key) {
        if (this._storeOptionsAsProperties) {
          return this[key];
        }
        return this._optionValues[key];
      }
      /**
       * Store option value.
       *
       * @param {string} key
       * @param {object} value
       * @return {Command} `this` command for chaining
       */
      setOptionValue(key, value) {
        return this.setOptionValueWithSource(key, value, void 0);
      }
      /**
       * Store option value and where the value came from.
       *
       * @param {string} key
       * @param {object} value
       * @param {string} source - expected values are default/config/env/cli/implied
       * @return {Command} `this` command for chaining
       */
      setOptionValueWithSource(key, value, source) {
        if (this._storeOptionsAsProperties) {
          this[key] = value;
        } else {
          this._optionValues[key] = value;
        }
        this._optionValueSources[key] = source;
        return this;
      }
      /**
       * Get source of option value.
       * Expected values are default | config | env | cli | implied
       *
       * @param {string} key
       * @return {string}
       */
      getOptionValueSource(key) {
        return this._optionValueSources[key];
      }
      /**
       * Get source of option value. See also .optsWithGlobals().
       * Expected values are default | config | env | cli | implied
       *
       * @param {string} key
       * @return {string}
       */
      getOptionValueSourceWithGlobals(key) {
        let source;
        this._getCommandAndAncestors().forEach((cmd) => {
          if (cmd.getOptionValueSource(key) !== void 0) {
            source = cmd.getOptionValueSource(key);
          }
        });
        return source;
      }
      /**
       * Get user arguments from implied or explicit arguments.
       * Side-effects: set _scriptPath if args included script. Used for default program name, and subcommand searches.
       *
       * @private
       */
      _prepareUserArgs(argv, parseOptions) {
        if (argv !== void 0 && !Array.isArray(argv)) {
          throw new Error("first parameter to parse must be array or undefined");
        }
        parseOptions = parseOptions || {};
        if (argv === void 0 && parseOptions.from === void 0) {
          if (process2.versions?.electron) {
            parseOptions.from = "electron";
          }
          const execArgv = process2.execArgv ?? [];
          if (execArgv.includes("-e") || execArgv.includes("--eval") || execArgv.includes("-p") || execArgv.includes("--print")) {
            parseOptions.from = "eval";
          }
        }
        if (argv === void 0) {
          argv = process2.argv;
        }
        this.rawArgs = argv.slice();
        let userArgs;
        switch (parseOptions.from) {
          case void 0:
          case "node":
            this._scriptPath = argv[1];
            userArgs = argv.slice(2);
            break;
          case "electron":
            if (process2.defaultApp) {
              this._scriptPath = argv[1];
              userArgs = argv.slice(2);
            } else {
              userArgs = argv.slice(1);
            }
            break;
          case "user":
            userArgs = argv.slice(0);
            break;
          case "eval":
            userArgs = argv.slice(1);
            break;
          default:
            throw new Error(
              `unexpected parse option { from: '${parseOptions.from}' }`
            );
        }
        if (!this._name && this._scriptPath)
          this.nameFromFilename(this._scriptPath);
        this._name = this._name || "program";
        return userArgs;
      }
      /**
       * Parse `argv`, setting options and invoking commands when defined.
       *
       * Use parseAsync instead of parse if any of your action handlers are async.
       *
       * Call with no parameters to parse `process.argv`. Detects Electron and special node options like `node --eval`. Easy mode!
       *
       * Or call with an array of strings to parse, and optionally where the user arguments start by specifying where the arguments are `from`:
       * - `'node'`: default, `argv[0]` is the application and `argv[1]` is the script being run, with user arguments after that
       * - `'electron'`: `argv[0]` is the application and `argv[1]` varies depending on whether the electron application is packaged
       * - `'user'`: just user arguments
       *
       * @example
       * program.parse(); // parse process.argv and auto-detect electron and special node flags
       * program.parse(process.argv); // assume argv[0] is app and argv[1] is script
       * program.parse(my-args, { from: 'user' }); // just user supplied arguments, nothing special about argv[0]
       *
       * @param {string[]} [argv] - optional, defaults to process.argv
       * @param {object} [parseOptions] - optionally specify style of options with from: node/user/electron
       * @param {string} [parseOptions.from] - where the args are from: 'node', 'user', 'electron'
       * @return {Command} `this` command for chaining
       */
      parse(argv, parseOptions) {
        const userArgs = this._prepareUserArgs(argv, parseOptions);
        this._parseCommand([], userArgs);
        return this;
      }
      /**
       * Parse `argv`, setting options and invoking commands when defined.
       *
       * Call with no parameters to parse `process.argv`. Detects Electron and special node options like `node --eval`. Easy mode!
       *
       * Or call with an array of strings to parse, and optionally where the user arguments start by specifying where the arguments are `from`:
       * - `'node'`: default, `argv[0]` is the application and `argv[1]` is the script being run, with user arguments after that
       * - `'electron'`: `argv[0]` is the application and `argv[1]` varies depending on whether the electron application is packaged
       * - `'user'`: just user arguments
       *
       * @example
       * await program.parseAsync(); // parse process.argv and auto-detect electron and special node flags
       * await program.parseAsync(process.argv); // assume argv[0] is app and argv[1] is script
       * await program.parseAsync(my-args, { from: 'user' }); // just user supplied arguments, nothing special about argv[0]
       *
       * @param {string[]} [argv]
       * @param {object} [parseOptions]
       * @param {string} parseOptions.from - where the args are from: 'node', 'user', 'electron'
       * @return {Promise}
       */
      async parseAsync(argv, parseOptions) {
        const userArgs = this._prepareUserArgs(argv, parseOptions);
        await this._parseCommand([], userArgs);
        return this;
      }
      /**
       * Execute a sub-command executable.
       *
       * @private
       */
      _executeSubCommand(subcommand, args) {
        args = args.slice();
        let launchWithNode = false;
        const sourceExt = [".js", ".ts", ".tsx", ".mjs", ".cjs"];
        function findFile(baseDir, baseName) {
          const localBin = path.resolve(baseDir, baseName);
          if (fs.existsSync(localBin)) return localBin;
          if (sourceExt.includes(path.extname(baseName))) return void 0;
          const foundExt = sourceExt.find(
            (ext) => fs.existsSync(`${localBin}${ext}`)
          );
          if (foundExt) return `${localBin}${foundExt}`;
          return void 0;
        }
        this._checkForMissingMandatoryOptions();
        this._checkForConflictingOptions();
        let executableFile = subcommand._executableFile || `${this._name}-${subcommand._name}`;
        let executableDir = this._executableDir || "";
        if (this._scriptPath) {
          let resolvedScriptPath;
          try {
            resolvedScriptPath = fs.realpathSync(this._scriptPath);
          } catch (err) {
            resolvedScriptPath = this._scriptPath;
          }
          executableDir = path.resolve(
            path.dirname(resolvedScriptPath),
            executableDir
          );
        }
        if (executableDir) {
          let localFile = findFile(executableDir, executableFile);
          if (!localFile && !subcommand._executableFile && this._scriptPath) {
            const legacyName = path.basename(
              this._scriptPath,
              path.extname(this._scriptPath)
            );
            if (legacyName !== this._name) {
              localFile = findFile(
                executableDir,
                `${legacyName}-${subcommand._name}`
              );
            }
          }
          executableFile = localFile || executableFile;
        }
        launchWithNode = sourceExt.includes(path.extname(executableFile));
        let proc;
        if (process2.platform !== "win32") {
          if (launchWithNode) {
            args.unshift(executableFile);
            args = incrementNodeInspectorPort(process2.execArgv).concat(args);
            proc = childProcess.spawn(process2.argv[0], args, { stdio: "inherit" });
          } else {
            proc = childProcess.spawn(executableFile, args, { stdio: "inherit" });
          }
        } else {
          args.unshift(executableFile);
          args = incrementNodeInspectorPort(process2.execArgv).concat(args);
          proc = childProcess.spawn(process2.execPath, args, { stdio: "inherit" });
        }
        if (!proc.killed) {
          const signals = ["SIGUSR1", "SIGUSR2", "SIGTERM", "SIGINT", "SIGHUP"];
          signals.forEach((signal) => {
            process2.on(signal, () => {
              if (proc.killed === false && proc.exitCode === null) {
                proc.kill(signal);
              }
            });
          });
        }
        const exitCallback = this._exitCallback;
        proc.on("close", (code) => {
          code = code ?? 1;
          if (!exitCallback) {
            process2.exit(code);
          } else {
            exitCallback(
              new CommanderError2(
                code,
                "commander.executeSubCommandAsync",
                "(close)"
              )
            );
          }
        });
        proc.on("error", (err) => {
          if (err.code === "ENOENT") {
            const executableDirMessage = executableDir ? `searched for local subcommand relative to directory '${executableDir}'` : "no directory for search for local subcommand, use .executableDir() to supply a custom directory";
            const executableMissing = `'${executableFile}' does not exist
 - if '${subcommand._name}' is not meant to be an executable command, remove description parameter from '.command()' and use '.description()' instead
 - if the default executable name is not suitable, use the executableFile option to supply a custom name or path
 - ${executableDirMessage}`;
            throw new Error(executableMissing);
          } else if (err.code === "EACCES") {
            throw new Error(`'${executableFile}' not executable`);
          }
          if (!exitCallback) {
            process2.exit(1);
          } else {
            const wrappedError = new CommanderError2(
              1,
              "commander.executeSubCommandAsync",
              "(error)"
            );
            wrappedError.nestedError = err;
            exitCallback(wrappedError);
          }
        });
        this.runningCommand = proc;
      }
      /**
       * @private
       */
      _dispatchSubcommand(commandName, operands, unknown) {
        const subCommand = this._findCommand(commandName);
        if (!subCommand) this.help({ error: true });
        let promiseChain;
        promiseChain = this._chainOrCallSubCommandHook(
          promiseChain,
          subCommand,
          "preSubcommand"
        );
        promiseChain = this._chainOrCall(promiseChain, () => {
          if (subCommand._executableHandler) {
            this._executeSubCommand(subCommand, operands.concat(unknown));
          } else {
            return subCommand._parseCommand(operands, unknown);
          }
        });
        return promiseChain;
      }
      /**
       * Invoke help directly if possible, or dispatch if necessary.
       * e.g. help foo
       *
       * @private
       */
      _dispatchHelpCommand(subcommandName) {
        if (!subcommandName) {
          this.help();
        }
        const subCommand = this._findCommand(subcommandName);
        if (subCommand && !subCommand._executableHandler) {
          subCommand.help();
        }
        return this._dispatchSubcommand(
          subcommandName,
          [],
          [this._getHelpOption()?.long ?? this._getHelpOption()?.short ?? "--help"]
        );
      }
      /**
       * Check this.args against expected this.registeredArguments.
       *
       * @private
       */
      _checkNumberOfArguments() {
        this.registeredArguments.forEach((arg, i) => {
          if (arg.required && this.args[i] == null) {
            this.missingArgument(arg.name());
          }
        });
        if (this.registeredArguments.length > 0 && this.registeredArguments[this.registeredArguments.length - 1].variadic) {
          return;
        }
        if (this.args.length > this.registeredArguments.length) {
          this._excessArguments(this.args);
        }
      }
      /**
       * Process this.args using this.registeredArguments and save as this.processedArgs!
       *
       * @private
       */
      _processArguments() {
        const myParseArg = (argument, value, previous) => {
          let parsedValue = value;
          if (value !== null && argument.parseArg) {
            const invalidValueMessage = `error: command-argument value '${value}' is invalid for argument '${argument.name()}'.`;
            parsedValue = this._callParseArg(
              argument,
              value,
              previous,
              invalidValueMessage
            );
          }
          return parsedValue;
        };
        this._checkNumberOfArguments();
        const processedArgs = [];
        this.registeredArguments.forEach((declaredArg, index) => {
          let value = declaredArg.defaultValue;
          if (declaredArg.variadic) {
            if (index < this.args.length) {
              value = this.args.slice(index);
              if (declaredArg.parseArg) {
                value = value.reduce((processed, v) => {
                  return myParseArg(declaredArg, v, processed);
                }, declaredArg.defaultValue);
              }
            } else if (value === void 0) {
              value = [];
            }
          } else if (index < this.args.length) {
            value = this.args[index];
            if (declaredArg.parseArg) {
              value = myParseArg(declaredArg, value, declaredArg.defaultValue);
            }
          }
          processedArgs[index] = value;
        });
        this.processedArgs = processedArgs;
      }
      /**
       * Once we have a promise we chain, but call synchronously until then.
       *
       * @param {(Promise|undefined)} promise
       * @param {Function} fn
       * @return {(Promise|undefined)}
       * @private
       */
      _chainOrCall(promise, fn) {
        if (promise && promise.then && typeof promise.then === "function") {
          return promise.then(() => fn());
        }
        return fn();
      }
      /**
       *
       * @param {(Promise|undefined)} promise
       * @param {string} event
       * @return {(Promise|undefined)}
       * @private
       */
      _chainOrCallHooks(promise, event) {
        let result = promise;
        const hooks = [];
        this._getCommandAndAncestors().reverse().filter((cmd) => cmd._lifeCycleHooks[event] !== void 0).forEach((hookedCommand) => {
          hookedCommand._lifeCycleHooks[event].forEach((callback) => {
            hooks.push({ hookedCommand, callback });
          });
        });
        if (event === "postAction") {
          hooks.reverse();
        }
        hooks.forEach((hookDetail) => {
          result = this._chainOrCall(result, () => {
            return hookDetail.callback(hookDetail.hookedCommand, this);
          });
        });
        return result;
      }
      /**
       *
       * @param {(Promise|undefined)} promise
       * @param {Command} subCommand
       * @param {string} event
       * @return {(Promise|undefined)}
       * @private
       */
      _chainOrCallSubCommandHook(promise, subCommand, event) {
        let result = promise;
        if (this._lifeCycleHooks[event] !== void 0) {
          this._lifeCycleHooks[event].forEach((hook) => {
            result = this._chainOrCall(result, () => {
              return hook(this, subCommand);
            });
          });
        }
        return result;
      }
      /**
       * Process arguments in context of this command.
       * Returns action result, in case it is a promise.
       *
       * @private
       */
      _parseCommand(operands, unknown) {
        const parsed = this.parseOptions(unknown);
        this._parseOptionsEnv();
        this._parseOptionsImplied();
        operands = operands.concat(parsed.operands);
        unknown = parsed.unknown;
        this.args = operands.concat(unknown);
        if (operands && this._findCommand(operands[0])) {
          return this._dispatchSubcommand(operands[0], operands.slice(1), unknown);
        }
        if (this._getHelpCommand() && operands[0] === this._getHelpCommand().name()) {
          return this._dispatchHelpCommand(operands[1]);
        }
        if (this._defaultCommandName) {
          this._outputHelpIfRequested(unknown);
          return this._dispatchSubcommand(
            this._defaultCommandName,
            operands,
            unknown
          );
        }
        if (this.commands.length && this.args.length === 0 && !this._actionHandler && !this._defaultCommandName) {
          this.help({ error: true });
        }
        this._outputHelpIfRequested(parsed.unknown);
        this._checkForMissingMandatoryOptions();
        this._checkForConflictingOptions();
        const checkForUnknownOptions = () => {
          if (parsed.unknown.length > 0) {
            this.unknownOption(parsed.unknown[0]);
          }
        };
        const commandEvent = `command:${this.name()}`;
        if (this._actionHandler) {
          checkForUnknownOptions();
          this._processArguments();
          let promiseChain;
          promiseChain = this._chainOrCallHooks(promiseChain, "preAction");
          promiseChain = this._chainOrCall(
            promiseChain,
            () => this._actionHandler(this.processedArgs)
          );
          if (this.parent) {
            promiseChain = this._chainOrCall(promiseChain, () => {
              this.parent.emit(commandEvent, operands, unknown);
            });
          }
          promiseChain = this._chainOrCallHooks(promiseChain, "postAction");
          return promiseChain;
        }
        if (this.parent && this.parent.listenerCount(commandEvent)) {
          checkForUnknownOptions();
          this._processArguments();
          this.parent.emit(commandEvent, operands, unknown);
        } else if (operands.length) {
          if (this._findCommand("*")) {
            return this._dispatchSubcommand("*", operands, unknown);
          }
          if (this.listenerCount("command:*")) {
            this.emit("command:*", operands, unknown);
          } else if (this.commands.length) {
            this.unknownCommand();
          } else {
            checkForUnknownOptions();
            this._processArguments();
          }
        } else if (this.commands.length) {
          checkForUnknownOptions();
          this.help({ error: true });
        } else {
          checkForUnknownOptions();
          this._processArguments();
        }
      }
      /**
       * Find matching command.
       *
       * @private
       * @return {Command | undefined}
       */
      _findCommand(name) {
        if (!name) return void 0;
        return this.commands.find(
          (cmd) => cmd._name === name || cmd._aliases.includes(name)
        );
      }
      /**
       * Return an option matching `arg` if any.
       *
       * @param {string} arg
       * @return {Option}
       * @package
       */
      _findOption(arg) {
        return this.options.find((option) => option.is(arg));
      }
      /**
       * Display an error message if a mandatory option does not have a value.
       * Called after checking for help flags in leaf subcommand.
       *
       * @private
       */
      _checkForMissingMandatoryOptions() {
        this._getCommandAndAncestors().forEach((cmd) => {
          cmd.options.forEach((anOption) => {
            if (anOption.mandatory && cmd.getOptionValue(anOption.attributeName()) === void 0) {
              cmd.missingMandatoryOptionValue(anOption);
            }
          });
        });
      }
      /**
       * Display an error message if conflicting options are used together in this.
       *
       * @private
       */
      _checkForConflictingLocalOptions() {
        const definedNonDefaultOptions = this.options.filter((option) => {
          const optionKey = option.attributeName();
          if (this.getOptionValue(optionKey) === void 0) {
            return false;
          }
          return this.getOptionValueSource(optionKey) !== "default";
        });
        const optionsWithConflicting = definedNonDefaultOptions.filter(
          (option) => option.conflictsWith.length > 0
        );
        optionsWithConflicting.forEach((option) => {
          const conflictingAndDefined = definedNonDefaultOptions.find(
            (defined) => option.conflictsWith.includes(defined.attributeName())
          );
          if (conflictingAndDefined) {
            this._conflictingOption(option, conflictingAndDefined);
          }
        });
      }
      /**
       * Display an error message if conflicting options are used together.
       * Called after checking for help flags in leaf subcommand.
       *
       * @private
       */
      _checkForConflictingOptions() {
        this._getCommandAndAncestors().forEach((cmd) => {
          cmd._checkForConflictingLocalOptions();
        });
      }
      /**
       * Parse options from `argv` removing known options,
       * and return argv split into operands and unknown arguments.
       *
       * Examples:
       *
       *     argv => operands, unknown
       *     --known kkk op => [op], []
       *     op --known kkk => [op], []
       *     sub --unknown uuu op => [sub], [--unknown uuu op]
       *     sub -- --unknown uuu op => [sub --unknown uuu op], []
       *
       * @param {string[]} argv
       * @return {{operands: string[], unknown: string[]}}
       */
      parseOptions(argv) {
        const operands = [];
        const unknown = [];
        let dest = operands;
        const args = argv.slice();
        function maybeOption(arg) {
          return arg.length > 1 && arg[0] === "-";
        }
        let activeVariadicOption = null;
        while (args.length) {
          const arg = args.shift();
          if (arg === "--") {
            if (dest === unknown) dest.push(arg);
            dest.push(...args);
            break;
          }
          if (activeVariadicOption && !maybeOption(arg)) {
            this.emit(`option:${activeVariadicOption.name()}`, arg);
            continue;
          }
          activeVariadicOption = null;
          if (maybeOption(arg)) {
            const option = this._findOption(arg);
            if (option) {
              if (option.required) {
                const value = args.shift();
                if (value === void 0) this.optionMissingArgument(option);
                this.emit(`option:${option.name()}`, value);
              } else if (option.optional) {
                let value = null;
                if (args.length > 0 && !maybeOption(args[0])) {
                  value = args.shift();
                }
                this.emit(`option:${option.name()}`, value);
              } else {
                this.emit(`option:${option.name()}`);
              }
              activeVariadicOption = option.variadic ? option : null;
              continue;
            }
          }
          if (arg.length > 2 && arg[0] === "-" && arg[1] !== "-") {
            const option = this._findOption(`-${arg[1]}`);
            if (option) {
              if (option.required || option.optional && this._combineFlagAndOptionalValue) {
                this.emit(`option:${option.name()}`, arg.slice(2));
              } else {
                this.emit(`option:${option.name()}`);
                args.unshift(`-${arg.slice(2)}`);
              }
              continue;
            }
          }
          if (/^--[^=]+=/.test(arg)) {
            const index = arg.indexOf("=");
            const option = this._findOption(arg.slice(0, index));
            if (option && (option.required || option.optional)) {
              this.emit(`option:${option.name()}`, arg.slice(index + 1));
              continue;
            }
          }
          if (maybeOption(arg)) {
            dest = unknown;
          }
          if ((this._enablePositionalOptions || this._passThroughOptions) && operands.length === 0 && unknown.length === 0) {
            if (this._findCommand(arg)) {
              operands.push(arg);
              if (args.length > 0) unknown.push(...args);
              break;
            } else if (this._getHelpCommand() && arg === this._getHelpCommand().name()) {
              operands.push(arg);
              if (args.length > 0) operands.push(...args);
              break;
            } else if (this._defaultCommandName) {
              unknown.push(arg);
              if (args.length > 0) unknown.push(...args);
              break;
            }
          }
          if (this._passThroughOptions) {
            dest.push(arg);
            if (args.length > 0) dest.push(...args);
            break;
          }
          dest.push(arg);
        }
        return { operands, unknown };
      }
      /**
       * Return an object containing local option values as key-value pairs.
       *
       * @return {object}
       */
      opts() {
        if (this._storeOptionsAsProperties) {
          const result = {};
          const len = this.options.length;
          for (let i = 0; i < len; i++) {
            const key = this.options[i].attributeName();
            result[key] = key === this._versionOptionName ? this._version : this[key];
          }
          return result;
        }
        return this._optionValues;
      }
      /**
       * Return an object containing merged local and global option values as key-value pairs.
       *
       * @return {object}
       */
      optsWithGlobals() {
        return this._getCommandAndAncestors().reduce(
          (combinedOptions, cmd) => Object.assign(combinedOptions, cmd.opts()),
          {}
        );
      }
      /**
       * Display error message and exit (or call exitOverride).
       *
       * @param {string} message
       * @param {object} [errorOptions]
       * @param {string} [errorOptions.code] - an id string representing the error
       * @param {number} [errorOptions.exitCode] - used with process.exit
       */
      error(message, errorOptions) {
        this._outputConfiguration.outputError(
          `${message}
`,
          this._outputConfiguration.writeErr
        );
        if (typeof this._showHelpAfterError === "string") {
          this._outputConfiguration.writeErr(`${this._showHelpAfterError}
`);
        } else if (this._showHelpAfterError) {
          this._outputConfiguration.writeErr("\n");
          this.outputHelp({ error: true });
        }
        const config = errorOptions || {};
        const exitCode = config.exitCode || 1;
        const code = config.code || "commander.error";
        this._exit(exitCode, code, message);
      }
      /**
       * Apply any option related environment variables, if option does
       * not have a value from cli or client code.
       *
       * @private
       */
      _parseOptionsEnv() {
        this.options.forEach((option) => {
          if (option.envVar && option.envVar in process2.env) {
            const optionKey = option.attributeName();
            if (this.getOptionValue(optionKey) === void 0 || ["default", "config", "env"].includes(
              this.getOptionValueSource(optionKey)
            )) {
              if (option.required || option.optional) {
                this.emit(`optionEnv:${option.name()}`, process2.env[option.envVar]);
              } else {
                this.emit(`optionEnv:${option.name()}`);
              }
            }
          }
        });
      }
      /**
       * Apply any implied option values, if option is undefined or default value.
       *
       * @private
       */
      _parseOptionsImplied() {
        const dualHelper = new DualOptions(this.options);
        const hasCustomOptionValue = (optionKey) => {
          return this.getOptionValue(optionKey) !== void 0 && !["default", "implied"].includes(this.getOptionValueSource(optionKey));
        };
        this.options.filter(
          (option) => option.implied !== void 0 && hasCustomOptionValue(option.attributeName()) && dualHelper.valueFromOption(
            this.getOptionValue(option.attributeName()),
            option
          )
        ).forEach((option) => {
          Object.keys(option.implied).filter((impliedKey) => !hasCustomOptionValue(impliedKey)).forEach((impliedKey) => {
            this.setOptionValueWithSource(
              impliedKey,
              option.implied[impliedKey],
              "implied"
            );
          });
        });
      }
      /**
       * Argument `name` is missing.
       *
       * @param {string} name
       * @private
       */
      missingArgument(name) {
        const message = `error: missing required argument '${name}'`;
        this.error(message, { code: "commander.missingArgument" });
      }
      /**
       * `Option` is missing an argument.
       *
       * @param {Option} option
       * @private
       */
      optionMissingArgument(option) {
        const message = `error: option '${option.flags}' argument missing`;
        this.error(message, { code: "commander.optionMissingArgument" });
      }
      /**
       * `Option` does not have a value, and is a mandatory option.
       *
       * @param {Option} option
       * @private
       */
      missingMandatoryOptionValue(option) {
        const message = `error: required option '${option.flags}' not specified`;
        this.error(message, { code: "commander.missingMandatoryOptionValue" });
      }
      /**
       * `Option` conflicts with another option.
       *
       * @param {Option} option
       * @param {Option} conflictingOption
       * @private
       */
      _conflictingOption(option, conflictingOption) {
        const findBestOptionFromValue = (option2) => {
          const optionKey = option2.attributeName();
          const optionValue = this.getOptionValue(optionKey);
          const negativeOption = this.options.find(
            (target) => target.negate && optionKey === target.attributeName()
          );
          const positiveOption = this.options.find(
            (target) => !target.negate && optionKey === target.attributeName()
          );
          if (negativeOption && (negativeOption.presetArg === void 0 && optionValue === false || negativeOption.presetArg !== void 0 && optionValue === negativeOption.presetArg)) {
            return negativeOption;
          }
          return positiveOption || option2;
        };
        const getErrorMessage = (option2) => {
          const bestOption = findBestOptionFromValue(option2);
          const optionKey = bestOption.attributeName();
          const source = this.getOptionValueSource(optionKey);
          if (source === "env") {
            return `environment variable '${bestOption.envVar}'`;
          }
          return `option '${bestOption.flags}'`;
        };
        const message = `error: ${getErrorMessage(option)} cannot be used with ${getErrorMessage(conflictingOption)}`;
        this.error(message, { code: "commander.conflictingOption" });
      }
      /**
       * Unknown option `flag`.
       *
       * @param {string} flag
       * @private
       */
      unknownOption(flag) {
        if (this._allowUnknownOption) return;
        let suggestion = "";
        if (flag.startsWith("--") && this._showSuggestionAfterError) {
          let candidateFlags = [];
          let command = this;
          do {
            const moreFlags = command.createHelp().visibleOptions(command).filter((option) => option.long).map((option) => option.long);
            candidateFlags = candidateFlags.concat(moreFlags);
            command = command.parent;
          } while (command && !command._enablePositionalOptions);
          suggestion = suggestSimilar(flag, candidateFlags);
        }
        const message = `error: unknown option '${flag}'${suggestion}`;
        this.error(message, { code: "commander.unknownOption" });
      }
      /**
       * Excess arguments, more than expected.
       *
       * @param {string[]} receivedArgs
       * @private
       */
      _excessArguments(receivedArgs) {
        if (this._allowExcessArguments) return;
        const expected = this.registeredArguments.length;
        const s = expected === 1 ? "" : "s";
        const forSubcommand = this.parent ? ` for '${this.name()}'` : "";
        const message = `error: too many arguments${forSubcommand}. Expected ${expected} argument${s} but got ${receivedArgs.length}.`;
        this.error(message, { code: "commander.excessArguments" });
      }
      /**
       * Unknown command.
       *
       * @private
       */
      unknownCommand() {
        const unknownName = this.args[0];
        let suggestion = "";
        if (this._showSuggestionAfterError) {
          const candidateNames = [];
          this.createHelp().visibleCommands(this).forEach((command) => {
            candidateNames.push(command.name());
            if (command.alias()) candidateNames.push(command.alias());
          });
          suggestion = suggestSimilar(unknownName, candidateNames);
        }
        const message = `error: unknown command '${unknownName}'${suggestion}`;
        this.error(message, { code: "commander.unknownCommand" });
      }
      /**
       * Get or set the program version.
       *
       * This method auto-registers the "-V, --version" option which will print the version number.
       *
       * You can optionally supply the flags and description to override the defaults.
       *
       * @param {string} [str]
       * @param {string} [flags]
       * @param {string} [description]
       * @return {(this | string | undefined)} `this` command for chaining, or version string if no arguments
       */
      version(str2, flags, description) {
        if (str2 === void 0) return this._version;
        this._version = str2;
        flags = flags || "-V, --version";
        description = description || "output the version number";
        const versionOption = this.createOption(flags, description);
        this._versionOptionName = versionOption.attributeName();
        this._registerOption(versionOption);
        this.on("option:" + versionOption.name(), () => {
          this._outputConfiguration.writeOut(`${str2}
`);
          this._exit(0, "commander.version", str2);
        });
        return this;
      }
      /**
       * Set the description.
       *
       * @param {string} [str]
       * @param {object} [argsDescription]
       * @return {(string|Command)}
       */
      description(str2, argsDescription) {
        if (str2 === void 0 && argsDescription === void 0)
          return this._description;
        this._description = str2;
        if (argsDescription) {
          this._argsDescription = argsDescription;
        }
        return this;
      }
      /**
       * Set the summary. Used when listed as subcommand of parent.
       *
       * @param {string} [str]
       * @return {(string|Command)}
       */
      summary(str2) {
        if (str2 === void 0) return this._summary;
        this._summary = str2;
        return this;
      }
      /**
       * Set an alias for the command.
       *
       * You may call more than once to add multiple aliases. Only the first alias is shown in the auto-generated help.
       *
       * @param {string} [alias]
       * @return {(string|Command)}
       */
      alias(alias) {
        if (alias === void 0) return this._aliases[0];
        let command = this;
        if (this.commands.length !== 0 && this.commands[this.commands.length - 1]._executableHandler) {
          command = this.commands[this.commands.length - 1];
        }
        if (alias === command._name)
          throw new Error("Command alias can't be the same as its name");
        const matchingCommand = this.parent?._findCommand(alias);
        if (matchingCommand) {
          const existingCmd = [matchingCommand.name()].concat(matchingCommand.aliases()).join("|");
          throw new Error(
            `cannot add alias '${alias}' to command '${this.name()}' as already have command '${existingCmd}'`
          );
        }
        command._aliases.push(alias);
        return this;
      }
      /**
       * Set aliases for the command.
       *
       * Only the first alias is shown in the auto-generated help.
       *
       * @param {string[]} [aliases]
       * @return {(string[]|Command)}
       */
      aliases(aliases) {
        if (aliases === void 0) return this._aliases;
        aliases.forEach((alias) => this.alias(alias));
        return this;
      }
      /**
       * Set / get the command usage `str`.
       *
       * @param {string} [str]
       * @return {(string|Command)}
       */
      usage(str2) {
        if (str2 === void 0) {
          if (this._usage) return this._usage;
          const args = this.registeredArguments.map((arg) => {
            return humanReadableArgName(arg);
          });
          return [].concat(
            this.options.length || this._helpOption !== null ? "[options]" : [],
            this.commands.length ? "[command]" : [],
            this.registeredArguments.length ? args : []
          ).join(" ");
        }
        this._usage = str2;
        return this;
      }
      /**
       * Get or set the name of the command.
       *
       * @param {string} [str]
       * @return {(string|Command)}
       */
      name(str2) {
        if (str2 === void 0) return this._name;
        this._name = str2;
        return this;
      }
      /**
       * Set the name of the command from script filename, such as process.argv[1],
       * or require.main.filename, or __filename.
       *
       * (Used internally and public although not documented in README.)
       *
       * @example
       * program.nameFromFilename(require.main.filename);
       *
       * @param {string} filename
       * @return {Command}
       */
      nameFromFilename(filename) {
        this._name = path.basename(filename, path.extname(filename));
        return this;
      }
      /**
       * Get or set the directory for searching for executable subcommands of this command.
       *
       * @example
       * program.executableDir(__dirname);
       * // or
       * program.executableDir('subcommands');
       *
       * @param {string} [path]
       * @return {(string|null|Command)}
       */
      executableDir(path2) {
        if (path2 === void 0) return this._executableDir;
        this._executableDir = path2;
        return this;
      }
      /**
       * Return program help documentation.
       *
       * @param {{ error: boolean }} [contextOptions] - pass {error:true} to wrap for stderr instead of stdout
       * @return {string}
       */
      helpInformation(contextOptions) {
        const helper = this.createHelp();
        if (helper.helpWidth === void 0) {
          helper.helpWidth = contextOptions && contextOptions.error ? this._outputConfiguration.getErrHelpWidth() : this._outputConfiguration.getOutHelpWidth();
        }
        return helper.formatHelp(this, helper);
      }
      /**
       * @private
       */
      _getHelpContext(contextOptions) {
        contextOptions = contextOptions || {};
        const context = { error: !!contextOptions.error };
        let write;
        if (context.error) {
          write = (arg) => this._outputConfiguration.writeErr(arg);
        } else {
          write = (arg) => this._outputConfiguration.writeOut(arg);
        }
        context.write = contextOptions.write || write;
        context.command = this;
        return context;
      }
      /**
       * Output help information for this command.
       *
       * Outputs built-in help, and custom text added using `.addHelpText()`.
       *
       * @param {{ error: boolean } | Function} [contextOptions] - pass {error:true} to write to stderr instead of stdout
       */
      outputHelp(contextOptions) {
        let deprecatedCallback;
        if (typeof contextOptions === "function") {
          deprecatedCallback = contextOptions;
          contextOptions = void 0;
        }
        const context = this._getHelpContext(contextOptions);
        this._getCommandAndAncestors().reverse().forEach((command) => command.emit("beforeAllHelp", context));
        this.emit("beforeHelp", context);
        let helpInformation = this.helpInformation(context);
        if (deprecatedCallback) {
          helpInformation = deprecatedCallback(helpInformation);
          if (typeof helpInformation !== "string" && !Buffer.isBuffer(helpInformation)) {
            throw new Error("outputHelp callback must return a string or a Buffer");
          }
        }
        context.write(helpInformation);
        if (this._getHelpOption()?.long) {
          this.emit(this._getHelpOption().long);
        }
        this.emit("afterHelp", context);
        this._getCommandAndAncestors().forEach(
          (command) => command.emit("afterAllHelp", context)
        );
      }
      /**
       * You can pass in flags and a description to customise the built-in help option.
       * Pass in false to disable the built-in help option.
       *
       * @example
       * program.helpOption('-?, --help' 'show help'); // customise
       * program.helpOption(false); // disable
       *
       * @param {(string | boolean)} flags
       * @param {string} [description]
       * @return {Command} `this` command for chaining
       */
      helpOption(flags, description) {
        if (typeof flags === "boolean") {
          if (flags) {
            this._helpOption = this._helpOption ?? void 0;
          } else {
            this._helpOption = null;
          }
          return this;
        }
        flags = flags ?? "-h, --help";
        description = description ?? "display help for command";
        this._helpOption = this.createOption(flags, description);
        return this;
      }
      /**
       * Lazy create help option.
       * Returns null if has been disabled with .helpOption(false).
       *
       * @returns {(Option | null)} the help option
       * @package
       */
      _getHelpOption() {
        if (this._helpOption === void 0) {
          this.helpOption(void 0, void 0);
        }
        return this._helpOption;
      }
      /**
       * Supply your own option to use for the built-in help option.
       * This is an alternative to using helpOption() to customise the flags and description etc.
       *
       * @param {Option} option
       * @return {Command} `this` command for chaining
       */
      addHelpOption(option) {
        this._helpOption = option;
        return this;
      }
      /**
       * Output help information and exit.
       *
       * Outputs built-in help, and custom text added using `.addHelpText()`.
       *
       * @param {{ error: boolean }} [contextOptions] - pass {error:true} to write to stderr instead of stdout
       */
      help(contextOptions) {
        this.outputHelp(contextOptions);
        let exitCode = process2.exitCode || 0;
        if (exitCode === 0 && contextOptions && typeof contextOptions !== "function" && contextOptions.error) {
          exitCode = 1;
        }
        this._exit(exitCode, "commander.help", "(outputHelp)");
      }
      /**
       * Add additional text to be displayed with the built-in help.
       *
       * Position is 'before' or 'after' to affect just this command,
       * and 'beforeAll' or 'afterAll' to affect this command and all its subcommands.
       *
       * @param {string} position - before or after built-in help
       * @param {(string | Function)} text - string to add, or a function returning a string
       * @return {Command} `this` command for chaining
       */
      addHelpText(position, text) {
        const allowedValues = ["beforeAll", "before", "after", "afterAll"];
        if (!allowedValues.includes(position)) {
          throw new Error(`Unexpected value for position to addHelpText.
Expecting one of '${allowedValues.join("', '")}'`);
        }
        const helpEvent = `${position}Help`;
        this.on(helpEvent, (context) => {
          let helpStr;
          if (typeof text === "function") {
            helpStr = text({ error: context.error, command: context.command });
          } else {
            helpStr = text;
          }
          if (helpStr) {
            context.write(`${helpStr}
`);
          }
        });
        return this;
      }
      /**
       * Output help information if help flags specified
       *
       * @param {Array} args - array of options to search for help flags
       * @private
       */
      _outputHelpIfRequested(args) {
        const helpOption = this._getHelpOption();
        const helpRequested = helpOption && args.find((arg) => helpOption.is(arg));
        if (helpRequested) {
          this.outputHelp();
          this._exit(0, "commander.helpDisplayed", "(outputHelp)");
        }
      }
    };
    function incrementNodeInspectorPort(args) {
      return args.map((arg) => {
        if (!arg.startsWith("--inspect")) {
          return arg;
        }
        let debugOption;
        let debugHost = "127.0.0.1";
        let debugPort = "9229";
        let match;
        if ((match = arg.match(/^(--inspect(-brk)?)$/)) !== null) {
          debugOption = match[1];
        } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+)$/)) !== null) {
          debugOption = match[1];
          if (/^\d+$/.test(match[3])) {
            debugPort = match[3];
          } else {
            debugHost = match[3];
          }
        } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+):(\d+)$/)) !== null) {
          debugOption = match[1];
          debugHost = match[3];
          debugPort = match[4];
        }
        if (debugOption && debugPort !== "0") {
          return `${debugOption}=${debugHost}:${parseInt(debugPort) + 1}`;
        }
        return arg;
      });
    }
    exports.Command = Command2;
  }
});

// node_modules/commander/index.js
var require_commander = __commonJS({
  "node_modules/commander/index.js"(exports) {
    "use strict";
    var { Argument: Argument2 } = require_argument();
    var { Command: Command2 } = require_command();
    var { CommanderError: CommanderError2, InvalidArgumentError: InvalidArgumentError2 } = require_error();
    var { Help: Help2 } = require_help();
    var { Option: Option2 } = require_option();
    exports.program = new Command2();
    exports.createCommand = (name) => new Command2(name);
    exports.createOption = (flags, description) => new Option2(flags, description);
    exports.createArgument = (name, description) => new Argument2(name, description);
    exports.Command = Command2;
    exports.Option = Option2;
    exports.Argument = Argument2;
    exports.Help = Help2;
    exports.CommanderError = CommanderError2;
    exports.InvalidArgumentError = InvalidArgumentError2;
    exports.InvalidOptionArgumentError = InvalidArgumentError2;
  }
});

// node_modules/picocolors/picocolors.js
var require_picocolors = __commonJS({
  "node_modules/picocolors/picocolors.js"(exports, module) {
    "use strict";
    var p = process || {};
    var argv = p.argv || [];
    var env = p.env || {};
    var isColorSupported = !(!!env.NO_COLOR || argv.includes("--no-color")) && (!!env.FORCE_COLOR || argv.includes("--color") || p.platform === "win32" || (p.stdout || {}).isTTY && env.TERM !== "dumb" || !!env.CI);
    var formatter = (open, close, replace = open) => (input) => {
      let string = "" + input, index = string.indexOf(close, open.length);
      return ~index ? open + replaceClose(string, close, replace, index) + close : open + string + close;
    };
    var replaceClose = (string, close, replace, index) => {
      let result = "", cursor = 0;
      do {
        result += string.substring(cursor, index) + replace;
        cursor = index + close.length;
        index = string.indexOf(close, cursor);
      } while (~index);
      return result + string.substring(cursor);
    };
    var createColors = (enabled = isColorSupported) => {
      let f = enabled ? formatter : () => String;
      return {
        isColorSupported: enabled,
        reset: f("\x1B[0m", "\x1B[0m"),
        bold: f("\x1B[1m", "\x1B[22m", "\x1B[22m\x1B[1m"),
        dim: f("\x1B[2m", "\x1B[22m", "\x1B[22m\x1B[2m"),
        italic: f("\x1B[3m", "\x1B[23m"),
        underline: f("\x1B[4m", "\x1B[24m"),
        inverse: f("\x1B[7m", "\x1B[27m"),
        hidden: f("\x1B[8m", "\x1B[28m"),
        strikethrough: f("\x1B[9m", "\x1B[29m"),
        black: f("\x1B[30m", "\x1B[39m"),
        red: f("\x1B[31m", "\x1B[39m"),
        green: f("\x1B[32m", "\x1B[39m"),
        yellow: f("\x1B[33m", "\x1B[39m"),
        blue: f("\x1B[34m", "\x1B[39m"),
        magenta: f("\x1B[35m", "\x1B[39m"),
        cyan: f("\x1B[36m", "\x1B[39m"),
        white: f("\x1B[37m", "\x1B[39m"),
        gray: f("\x1B[90m", "\x1B[39m"),
        bgBlack: f("\x1B[40m", "\x1B[49m"),
        bgRed: f("\x1B[41m", "\x1B[49m"),
        bgGreen: f("\x1B[42m", "\x1B[49m"),
        bgYellow: f("\x1B[43m", "\x1B[49m"),
        bgBlue: f("\x1B[44m", "\x1B[49m"),
        bgMagenta: f("\x1B[45m", "\x1B[49m"),
        bgCyan: f("\x1B[46m", "\x1B[49m"),
        bgWhite: f("\x1B[47m", "\x1B[49m"),
        blackBright: f("\x1B[90m", "\x1B[39m"),
        redBright: f("\x1B[91m", "\x1B[39m"),
        greenBright: f("\x1B[92m", "\x1B[39m"),
        yellowBright: f("\x1B[93m", "\x1B[39m"),
        blueBright: f("\x1B[94m", "\x1B[39m"),
        magentaBright: f("\x1B[95m", "\x1B[39m"),
        cyanBright: f("\x1B[96m", "\x1B[39m"),
        whiteBright: f("\x1B[97m", "\x1B[39m"),
        bgBlackBright: f("\x1B[100m", "\x1B[49m"),
        bgRedBright: f("\x1B[101m", "\x1B[49m"),
        bgGreenBright: f("\x1B[102m", "\x1B[49m"),
        bgYellowBright: f("\x1B[103m", "\x1B[49m"),
        bgBlueBright: f("\x1B[104m", "\x1B[49m"),
        bgMagentaBright: f("\x1B[105m", "\x1B[49m"),
        bgCyanBright: f("\x1B[106m", "\x1B[49m"),
        bgWhiteBright: f("\x1B[107m", "\x1B[49m")
      };
    };
    module.exports = createColors();
    module.exports.createColors = createColors;
  }
});

// src/cli.ts
import { writeFileSync as writeFileSync2 } from "fs";
import { spawn } from "child_process";

// node_modules/commander/esm.mjs
var import_index = __toESM(require_commander(), 1);
var {
  program,
  createCommand,
  createArgument,
  createOption,
  CommanderError,
  InvalidArgumentError,
  InvalidOptionArgumentError,
  // deprecated old name
  Command,
  Argument,
  Option,
  Help
} = import_index.default;

// src/cli.ts
var import_picocolors2 = __toESM(require_picocolors(), 1);

// src/pricing.ts
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// src/prices.json
var prices_default = {
  _meta: {
    updated: "2026-06",
    currency: "USD",
    note: "Best-effort public list prices in USD per 1,000,000 tokens. Prices change and your negotiated rate may differ. Override any of these by dropping a .receipt/prices.json in your repo; it is merged over these defaults. Unverified entries are marked verified:false and flagged on the receipt."
  },
  models: {
    "claude-opus-4-8": { input: 15, output: 75, tools: { web_search_requests: 0.01 } },
    "claude-opus-4-7": { input: 15, output: 75, tools: { web_search_requests: 0.01 } },
    "claude-opus-4-1": { input: 15, output: 75 },
    "claude-opus-4": { input: 15, output: 75 },
    "claude-sonnet-4-6": { input: 3, output: 15, tools: { web_search_requests: 0.01 } },
    "claude-sonnet-4-5": { input: 3, output: 15 },
    "claude-sonnet-4": { input: 3, output: 15 },
    "claude-haiku-4-5": { input: 1, output: 5 },
    "claude-3-7-sonnet": { input: 3, output: 15 },
    "claude-3-5-sonnet": { input: 3, output: 15 },
    "claude-3-5-haiku": { input: 0.8, output: 4 },
    "claude-3-opus": { input: 15, output: 75 },
    "claude-3-haiku": { input: 0.25, output: 1.25 },
    "claude-fable-5": { input: 3, output: 15, verified: false },
    "gpt-4o": { input: 2.5, output: 10, cacheRead: 1.25 },
    "gpt-4o-mini": { input: 0.15, output: 0.6, cacheRead: 0.075 },
    "gpt-4.1": { input: 2, output: 8, cacheRead: 0.5 },
    "gpt-4.1-mini": { input: 0.4, output: 1.6, cacheRead: 0.1 },
    "gpt-4.1-nano": { input: 0.1, output: 0.4, cacheRead: 0.025 },
    o3: { input: 2, output: 8, cacheRead: 0.5, verified: false },
    "o4-mini": { input: 1.1, output: 4.4, cacheRead: 0.275, verified: false },
    "gpt-4-turbo": { input: 10, output: 30 },
    "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
    "gemini-2.5-pro": { input: 1.25, output: 10, verified: false },
    "gemini-2.5-flash": { input: 0.3, output: 2.5, verified: false },
    "gemini-2.0-flash": { input: 0.1, output: 0.4, verified: false },
    haiku: { input: 1, output: 5 },
    sonnet: { input: 3, output: 15 },
    opus: { input: 15, output: 75 }
  },
  prefixes: [
    { match: "claude-opus", model: "claude-opus-4-8" },
    { match: "claude-sonnet", model: "claude-sonnet-4-6" },
    { match: "claude-haiku", model: "claude-haiku-4-5" },
    { match: "claude-3-5-sonnet", model: "claude-3-5-sonnet" },
    { match: "gpt-4o-mini", model: "gpt-4o-mini" },
    { match: "gpt-4o", model: "gpt-4o" },
    { match: "gpt-4.1-mini", model: "gpt-4.1-mini" },
    { match: "gpt-4.1", model: "gpt-4.1" },
    { match: "gemini-2.5-pro", model: "gemini-2.5-pro" },
    { match: "gemini-2.5-flash", model: "gemini-2.5-flash" }
  ]
};

// src/pricing.ts
var CACHE_READ_MULT = 0.1;
var CACHE_WRITE_5M_MULT = 1.25;
var CACHE_WRITE_1H_MULT = 2;
var Pricing = class _Pricing {
  book;
  constructor(book) {
    this.book = book;
  }
  /**
   * Load the bundled price book, then merge an optional repo override from
   * `.receipt/prices.json`. The override wins key by key, so a team can fix
   * one model's price without restating the whole table.
   */
  static load(repoRoot2) {
    const base = structuredClone(prices_default);
    if (repoRoot2) {
      const overridePath = join(repoRoot2, ".receipt", "prices.json");
      if (existsSync(overridePath)) {
        try {
          const override = JSON.parse(readFileSync(overridePath, "utf8"));
          base.models = { ...base.models, ...override.models };
          if (override.prefixes) base.prefixes = override.prefixes;
          if (override._meta) base._meta = { ...base._meta, ...override._meta };
        } catch (err) {
          throw new Error(
            `Could not parse ${overridePath}: ${err.message}`
          );
        }
      }
    }
    return new _Pricing(base);
  }
  currency() {
    return this.book._meta?.currency ?? "USD";
  }
  /** The "as-of" date stamped on the price book, shown in the receipt footer. */
  updated() {
    return this.book._meta?.updated;
  }
  /** Resolve a model id to its price card, trying exact match then prefixes. */
  priceFor(model) {
    const exact = this.book.models[model];
    if (exact) return exact;
    for (const rule of this.book.prefixes ?? []) {
      if (model.startsWith(rule.match)) {
        const target = this.book.models[rule.model];
        if (target) return target;
      }
    }
    return void 0;
  }
  isVerified(model) {
    const price = this.priceFor(model);
    return price ? price.verified !== false : false;
  }
  /**
   * Cost in USD for one metered call. Returns `null` when the model is
   * unknown, so the caller can surface "unpriced" rather than invent a zero.
   */
  cost(entry) {
    const price = this.priceFor(entry.model);
    if (!price) return null;
    const perM = (tokens2, rate) => tokens2 / 1e6 * rate;
    let usd = 0;
    usd += perM(entry.inputTokens, price.input);
    usd += perM(entry.outputTokens, price.output);
    usd += perM(entry.cacheReadTokens, price.cacheRead ?? price.input * CACHE_READ_MULT);
    usd += perM(
      entry.cacheWrite5mTokens,
      price.cacheWrite5m ?? price.input * CACHE_WRITE_5M_MULT
    );
    usd += perM(
      entry.cacheWrite1hTokens,
      price.cacheWrite1h ?? price.input * CACHE_WRITE_1H_MULT
    );
    for (const [tool, count] of Object.entries(entry.toolCalls ?? {})) {
      const rate = price.tools?.[tool];
      if (rate) usd += count * rate;
    }
    return usd;
  }
};
function providerOf(model) {
  const m = model.toLowerCase();
  if (m.includes("claude") || m === "opus" || m === "sonnet" || m === "haiku" || m.includes("fable"))
    return "anthropic";
  if (m.startsWith("gpt") || m.startsWith("o1") || m.startsWith("o3") || m.startsWith("o4"))
    return "openai";
  if (m.includes("gemini")) return "google";
  return "unknown";
}

// src/git.ts
import { execFileSync } from "child_process";
import { existsSync as existsSync2 } from "fs";
import { dirname, join as join2, resolve } from "path";
function git(args, cwd) {
  try {
    return execFileSync("git", args, {
      cwd,
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8"
    }).trim();
  } catch {
    return void 0;
  }
}
function findRepoRoot(start = process.cwd()) {
  let dir = resolve(start);
  for (; ; ) {
    if (existsSync2(join2(dir, ".git"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return resolve(start);
    dir = parent;
  }
}
function currentBranch(cwd = process.cwd()) {
  const b = git(["rev-parse", "--abbrev-ref", "HEAD"], cwd);
  return b && b !== "HEAD" ? b : void 0;
}
function currentSha(cwd = process.cwd()) {
  return git(["rev-parse", "HEAD"], cwd);
}
function repoSlug(cwd = process.cwd()) {
  const url = git(["config", "--get", "remote.origin.url"], cwd);
  if (!url) return void 0;
  const m = url.match(/[:/]([^/:]+\/[^/]+?)(?:\.git)?$/);
  return m ? m[1] : void 0;
}
function commitsInRange(base, branch, cwd = process.cwd()) {
  const out = git(["rev-list", `${base}..${branch}`], cwd);
  if (!out) return [];
  return out.split("\n").filter(Boolean);
}
function mergeBaseDate(base, branch, cwd = process.cwd()) {
  const sha = git(["merge-base", base, branch], cwd);
  if (!sha) return void 0;
  return git(["show", "-s", "--format=%cI", sha], cwd);
}

// src/ledger.ts
import { appendFileSync, existsSync as existsSync3, mkdirSync, readFileSync as readFileSync2 } from "fs";
import { dirname as dirname2, join as join3 } from "path";
function ledgerPath(repoRoot2) {
  return process.env.RECEIPT_LEDGER || join3(repoRoot2, ".receipt", "ledger.jsonl");
}
function append(repoRoot2, entry) {
  const path = ledgerPath(repoRoot2);
  mkdirSync(dirname2(path), { recursive: true });
  appendFileSync(path, JSON.stringify(entry) + "\n", "utf8");
}
function readLedger(path) {
  if (!existsSync3(path)) return [];
  const out = [];
  for (const line of readFileSync2(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      out.push(JSON.parse(trimmed));
    } catch {
    }
  }
  return out;
}
function knownRequestIds(path) {
  const ids = /* @__PURE__ */ new Set();
  for (const e of readLedger(path)) {
    if (e.requestId) ids.add(e.requestId);
  }
  return ids;
}

// src/config.ts
import { existsSync as existsSync4, mkdirSync as mkdirSync2, readFileSync as readFileSync3, writeFileSync } from "fs";
import { dirname as dirname3, join as join4 } from "path";
function configPath(repoRoot2) {
  return join4(repoRoot2, ".receipt", "config.json");
}
function loadConfig(repoRoot2) {
  const path = configPath(repoRoot2);
  if (!existsSync4(path)) return {};
  try {
    return JSON.parse(readFileSync3(path, "utf8"));
  } catch {
    return {};
  }
}
function saveConfig(repoRoot2, config) {
  const path = configPath(repoRoot2);
  mkdirSync2(dirname3(path), { recursive: true });
  writeFileSync(path, JSON.stringify(config, null, 2) + "\n", "utf8");
}

// src/receipt.ts
function selectEntries(entries, opts) {
  const { branch, sinceTs, untilTs, rangeShas } = opts;
  const sinceMs = sinceTs ? new Date(sinceTs).getTime() : void 0;
  const untilMs = untilTs ? new Date(untilTs).getTime() : void 0;
  return entries.filter((e) => {
    const t = new Date(e.ts).getTime();
    if (sinceMs !== void 0 && t < sinceMs) return false;
    if (untilMs !== void 0 && t >= untilMs) return false;
    if (!branch && !rangeShas) return true;
    const shaHit = rangeShas && e.git?.sha ? rangeShas.has(e.git.sha) : false;
    const branchHit = branch ? e.git?.branch === branch : false;
    if (!branch && rangeShas) return shaHit;
    if (branch && !rangeShas) return branchHit;
    return shaHit || branchHit;
  });
}
function buildReceipt(selected, opts = {}) {
  const byModelMap = /* @__PURE__ */ new Map();
  const toolTotals = {};
  const unpriced = /* @__PURE__ */ new Set();
  let total = 0;
  let totalTokens2 = 0;
  let retries = 0;
  let first;
  let last;
  for (const e of selected) {
    const r = byModelMap.get(e.model) ?? {
      model: e.model,
      provider: e.provider,
      calls: 0,
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      costUsd: 0,
      priced: true
    };
    r.calls += 1;
    r.inputTokens += e.inputTokens;
    r.outputTokens += e.outputTokens;
    r.cacheReadTokens += e.cacheReadTokens;
    r.cacheWriteTokens += e.cacheWrite5mTokens + e.cacheWrite1hTokens;
    if (e.costUsd === null) {
      r.priced = false;
      unpriced.add(e.model);
    } else {
      r.costUsd += e.costUsd;
      total += e.costUsd;
    }
    totalTokens2 += e.inputTokens + e.outputTokens + e.cacheReadTokens + e.cacheWrite5mTokens + e.cacheWrite1hTokens;
    retries += e.retries ?? 0;
    for (const [tool, count] of Object.entries(e.toolCalls ?? {})) {
      toolTotals[tool] = (toolTotals[tool] ?? 0) + count;
    }
    if (!first || e.ts < first) first = e.ts;
    if (!last || e.ts > last) last = e.ts;
    byModelMap.set(e.model, r);
  }
  const byModel = [...byModelMap.values()].sort((a, b) => b.costUsd - a.costUsd);
  return {
    total,
    unpricedModels: [...unpriced],
    totalTokens: totalTokens2,
    entryCount: selected.length,
    retries,
    byModel,
    toolTotals,
    firstTs: first,
    lastTs: last,
    branch: opts.branch,
    base: opts.base,
    currency: opts.currency ?? "USD"
  };
}

// src/util.ts
function money(usd, currency = "USD") {
  const symbol = currency === "USD" ? "$" : "";
  const suffix = currency === "USD" ? "" : ` ${currency}`;
  if (usd === 0) return `${symbol}0.00${suffix}`;
  const abs = Math.abs(usd);
  const dp = abs < 0.01 ? 4 : abs < 0.1 ? 3 : 2;
  return `${symbol}${usd.toFixed(dp)}${suffix}`;
}
function tokens(n) {
  if (n < 1e3) return String(n);
  if (n < 1e6) return `${(n / 1e3).toFixed(n < 1e4 ? 1 : 0)}k`;
  return `${(n / 1e6).toFixed(1)}M`;
}
var BARS = ["\u2581", "\u2582", "\u2583", "\u2584", "\u2585", "\u2586", "\u2587", "\u2588"];
function sparkline(values) {
  if (values.length === 0) return "";
  const max = Math.max(...values);
  if (max === 0) return BARS[0].repeat(values.length);
  return values.map((v) => {
    const idx = Math.min(BARS.length - 1, Math.round(v / max * (BARS.length - 1)));
    return BARS[idx];
  }).join("");
}
function timeBuckets(timestamps, values, maxBuckets = 16) {
  if (timestamps.length === 0) return [];
  const times = timestamps.map((t) => new Date(t).getTime());
  const min = Math.min(...times);
  const max = Math.max(...times);
  const span = max - min;
  const n = Math.max(1, Math.min(maxBuckets, timestamps.length));
  const buckets = new Array(n).fill(0);
  for (let i = 0; i < times.length; i++) {
    const frac = span === 0 ? 0 : (times[i] - min) / span;
    const idx = Math.min(n - 1, Math.floor(frac * n));
    buckets[idx] += values[i];
  }
  return buckets;
}
function progressBar(fraction, width = 20) {
  const f = Math.max(0, Math.min(1, fraction));
  const filled = Math.round(f * width);
  return "\u2588".repeat(filled) + "\u2591".repeat(width - filled);
}
function pct(fraction) {
  return `${Math.round(fraction * 100)}%`;
}

// src/render.ts
var COMMENT_MARKER = "<!-- receipt:v1 -->";
var PROVIDER_BADGE = {
  anthropic: "\u25C6",
  openai: "\u25CB",
  google: "\u25B3",
  unknown: "\xB7"
};
function renderMarkdown(receipt, opts = {}) {
  const { currency } = receipt;
  const lines = [];
  lines.push(COMMENT_MARKER);
  const scope = receipt.branch ? ` \u2014 \`${receipt.branch}\`` : "";
  lines.push(`### \u{1F9FE} Receipt${scope}`);
  lines.push("");
  if (receipt.entryCount === 0) {
    lines.push("No AI usage recorded for this branch yet.");
    lines.push("");
    lines.push(footer(opts));
    return lines.join("\n");
  }
  const head = [
    `**${money(receipt.total, currency)}**`,
    `${tokens(receipt.totalTokens)} tokens`,
    `${receipt.entryCount} calls`
  ];
  if (receipt.retries > 0) head.push(`${receipt.retries} retries`);
  lines.push(head.join(" \xB7 "));
  lines.push("");
  if (opts.budget?.perPr) {
    const frac = receipt.total / opts.budget.perPr;
    const flag = frac > 1 ? "\u{1F534}" : frac > 0.8 ? "\u{1F7E1}" : "\u{1F7E2}";
    const verdict = frac > 1 ? `over budget by ${money(receipt.total - opts.budget.perPr, currency)}` : `${money(opts.budget.perPr - receipt.total, currency)} left`;
    lines.push(
      `${flag} \`${progressBar(frac)}\` ${pct(frac)} of ${money(opts.budget.perPr, currency)} budget \u2014 ${verdict}`
    );
    lines.push("");
  }
  if (opts.medianPr && opts.medianPr > 0) {
    const ratio = receipt.total / opts.medianPr;
    const word = ratio >= 1 ? "more" : "less";
    lines.push(`This PR cost **${ratio.toFixed(1)}\xD7** ${word} than your median PR (${money(opts.medianPr, currency)}).`);
    lines.push("");
  }
  lines.push("| Model | Calls | Input | Output | Cache | Cost |");
  lines.push("| --- | --: | --: | --: | --: | --: |");
  for (const m of receipt.byModel) {
    const badge = PROVIDER_BADGE[m.provider] ?? "\xB7";
    const cost = m.priced ? money(m.costUsd, currency) : "\u2014";
    lines.push(
      `| ${badge} \`${m.model}\` | ${m.calls} | ${tokens(m.inputTokens)} | ${tokens(m.outputTokens)} | ${tokens(m.cacheReadTokens + m.cacheWriteTokens)} | ${cost} |`
    );
  }
  lines.push("");
  if (opts.series && opts.series.length > 1) {
    const buckets = timeBuckets(
      opts.series.map((s) => s.ts),
      opts.series.map((s) => s.cost)
    );
    if (buckets.length > 1) {
      lines.push(`Spend over time \`${sparkline(buckets)}\``);
      lines.push("");
    }
  }
  const tools = Object.entries(receipt.toolTotals).filter(([, n]) => n > 0);
  if (tools.length > 0) {
    lines.push(
      "Tool calls: " + tools.map(([t, n]) => `${n}\xD7 ${t.replace(/_/g, " ")}`).join(", ")
    );
    lines.push("");
  }
  if (receipt.unpricedModels.length > 0) {
    lines.push(
      `> \u26A0\uFE0F No price on file for ${receipt.unpricedModels.map((m) => `\`${m}\``).join(", ")}; their tokens are counted but not costed. Add them to \`.receipt/prices.json\`.`
    );
    lines.push("");
  }
  lines.push(footer(opts));
  return lines.join("\n");
}
function footer(opts) {
  const url = opts.repoUrl ?? "https://github.com/noah-thing/receipt";
  const priced = opts.priceUpdated ? ` \xB7 prices as of ${opts.priceUpdated}` : "";
  return `<sub>\u{1F9FE} [Receipt](${url}) \xB7 measured from real token usage${priced}</sub>`;
}
function renderText(receipt) {
  const c = receipt.currency;
  const out = [];
  const scope = receipt.branch ? ` (${receipt.branch})` : "";
  out.push(`Receipt${scope}`);
  out.push(
    `${money(receipt.total, c)}  \xB7  ${tokens(receipt.totalTokens)} tokens  \xB7  ${receipt.entryCount} calls` + (receipt.retries ? `  \xB7  ${receipt.retries} retries` : "")
  );
  out.push("");
  const nameW = Math.max(5, ...receipt.byModel.map((m) => m.model.length));
  out.push(
    `${"model".padEnd(nameW)}  ${"calls".padStart(6)}  ${"in".padStart(7)}  ${"out".padStart(7)}  ${"cache".padStart(7)}  ${"cost".padStart(9)}`
  );
  for (const m of receipt.byModel) {
    const cost = m.priced ? money(m.costUsd, c) : "\u2014";
    out.push(
      `${m.model.padEnd(nameW)}  ${String(m.calls).padStart(6)}  ${tokens(m.inputTokens).padStart(7)}  ${tokens(m.outputTokens).padStart(7)}  ${tokens(m.cacheReadTokens + m.cacheWriteTokens).padStart(7)}  ${cost.padStart(9)}`
    );
  }
  if (receipt.unpricedModels.length > 0) {
    out.push("");
    out.push(`unpriced: ${receipt.unpricedModels.join(", ")} (counted, not costed)`);
  }
  return out.join("\n");
}

// src/context.ts
import { readFileSync as readFileSync4 } from "fs";
function resolveContext(repoRoot2, flags) {
  const env = process.env;
  const inActions = env.GITHUB_ACTIONS === "true";
  let pr = flags.pr ? Number(flags.pr) : void 0;
  let branch = flags.branch;
  if (inActions) {
    if (!pr && env.GITHUB_EVENT_PATH) {
      try {
        const event = JSON.parse(readFileSync4(env.GITHUB_EVENT_PATH, "utf8"));
        if (event.pull_request?.number) pr = event.pull_request.number;
        else if (event.number) pr = event.number;
      } catch {
      }
    }
    branch ??= env.GITHUB_HEAD_REF || void 0;
  }
  branch ??= currentBranch(repoRoot2);
  return {
    repo: flags.repo ?? env.GITHUB_REPOSITORY ?? repoSlug(repoRoot2),
    token: flags.token ?? env.GITHUB_TOKEN ?? env.GH_TOKEN,
    pr,
    branch,
    base: flags.base ?? env.GITHUB_BASE_REF ?? "main"
  };
}
function rangeFor(repoRoot2, base, branch) {
  if (!branch) return { shas: /* @__PURE__ */ new Set() };
  const shas = new Set(commitsInRange(base, branch, repoRoot2));
  const sinceTs = mergeBaseDate(base, branch, repoRoot2);
  return { shas, sinceTs };
}

// src/importers/claude-code.ts
import { createInterface } from "readline";
import { createReadStream, existsSync as existsSync5, readdirSync, statSync } from "fs";
import { homedir } from "os";
import { join as join5 } from "path";
function defaultClaudeDir() {
  return join5(homedir(), ".claude", "projects");
}
function* jsonlFiles(dir) {
  if (!existsSync5(dir)) return;
  for (const name of readdirSync(dir)) {
    const full = join5(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      yield* jsonlFiles(full);
    } else if (name.endsWith(".jsonl")) {
      yield full;
    }
  }
}
function insideRepo(cwd, root) {
  if (!cwd) return false;
  return cwd === root || cwd.startsWith(root.endsWith("/") ? root : root + "/");
}
async function importClaudeCode(opts) {
  const dir = opts.dir ?? defaultClaudeDir();
  const sinceMs = opts.sinceTs ? new Date(opts.sinceTs).getTime() : void 0;
  const seen = opts.seen ?? /* @__PURE__ */ new Set();
  const out = [];
  const dedupeWithin = /* @__PURE__ */ new Set();
  for (const file of jsonlFiles(dir)) {
    const rl = createInterface({
      input: createReadStream(file, { encoding: "utf8" }),
      crlfDelay: Infinity
    });
    for await (const line of rl) {
      if (!line.includes('"usage"')) continue;
      let o;
      try {
        o = JSON.parse(line);
      } catch {
        continue;
      }
      const usage = o.message?.usage;
      const model = o.message?.model;
      if (!usage || !model || model === "<synthetic>") continue;
      if (o.type && o.type !== "assistant") continue;
      if (!opts.all && opts.repoRoot && !insideRepo(o.cwd, opts.repoRoot)) continue;
      const branch = o.gitBranch && o.gitBranch !== "HEAD" ? o.gitBranch : void 0;
      if (opts.branch && branch !== opts.branch) continue;
      const ts = o.timestamp ?? (/* @__PURE__ */ new Date(0)).toISOString();
      if (sinceMs !== void 0 && new Date(ts).getTime() < sinceMs) continue;
      const id = o.requestId;
      if (id) {
        if (seen.has(id) || dedupeWithin.has(id)) continue;
        dedupeWithin.add(id);
      }
      const cacheWrite5m = usage.cache_creation?.ephemeral_5m_input_tokens ?? (usage.cache_creation ? 0 : usage.cache_creation_input_tokens ?? 0);
      const cacheWrite1h = usage.cache_creation?.ephemeral_1h_input_tokens ?? 0;
      const toolCalls = {};
      const web = usage.server_tool_use?.web_search_requests ?? 0;
      const fetch2 = usage.server_tool_use?.web_fetch_requests ?? 0;
      if (web > 0) toolCalls.web_search_requests = web;
      if (fetch2 > 0) toolCalls.web_fetch_requests = fetch2;
      const partial = {
        model,
        inputTokens: usage.input_tokens ?? 0,
        outputTokens: usage.output_tokens ?? 0,
        cacheReadTokens: usage.cache_read_input_tokens ?? 0,
        cacheWrite5mTokens: cacheWrite5m,
        cacheWrite1hTokens: cacheWrite1h,
        toolCalls: Object.keys(toolCalls).length ? toolCalls : void 0
      };
      out.push({
        ts,
        source: "claude-code",
        provider: providerOf(model),
        costUsd: opts.pricing.cost(partial),
        ...partial,
        requestId: id,
        git: { branch, repo: opts.repo }
      });
    }
  }
  out.sort((a, b) => a.ts.localeCompare(b.ts));
  return out;
}

// src/importers/generic.ts
import { readFileSync as readFileSync5 } from "fs";
function num(o, ...keys) {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return 0;
}
function str(o, ...keys) {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v) return v;
  }
  return void 0;
}
function importGeneric(filePath, pricing, defaults = {}) {
  const raw = readFileSync5(filePath, "utf8").trim();
  let rows;
  if (raw.startsWith("[")) {
    rows = JSON.parse(raw);
  } else {
    rows = raw.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => JSON.parse(l));
  }
  const out = [];
  for (const row of rows) {
    const u = typeof row.usage === "object" && row.usage ? row.usage : row;
    const model = str(row, "model", "model_id") ?? "unknown";
    const inputTokens = num(u, "input_tokens", "inputTokens", "prompt_tokens", "promptTokens");
    const outputTokens = num(
      u,
      "output_tokens",
      "outputTokens",
      "completion_tokens",
      "completionTokens"
    );
    const details = typeof u.prompt_tokens_details === "object" && u.prompt_tokens_details ? u.prompt_tokens_details : {};
    const cacheReadTokens = num(u, "cache_read_input_tokens", "cacheReadTokens", "cached_tokens") || num(details, "cached_tokens");
    const cacheWrite5mTokens = num(u, "cache_creation_input_tokens", "cacheWriteTokens");
    if (inputTokens + outputTokens + cacheReadTokens + cacheWrite5mTokens === 0) continue;
    const partial = {
      model,
      inputTokens,
      outputTokens,
      cacheReadTokens,
      cacheWrite5mTokens,
      cacheWrite1hTokens: 0,
      toolCalls: void 0
    };
    out.push({
      ts: str(row, "ts", "timestamp", "created_at", "createdAt") ?? (/* @__PURE__ */ new Date()).toISOString(),
      source: defaults.source ?? "generic",
      provider: providerOf(model),
      costUsd: pricing.cost(partial),
      ...partial,
      requestId: str(row, "requestId", "request_id", "id"),
      label: str(row, "label", "task", "name"),
      git: {
        branch: str(row, "branch", "gitBranch"),
        sha: str(row, "sha", "commit"),
        repo: defaults.repo
      }
    });
  }
  out.sort((a, b) => a.ts.localeCompare(b.ts));
  return out;
}

// src/proxy.ts
var import_picocolors = __toESM(require_picocolors(), 1);
import { createServer } from "http";
var STRIP_HEADERS = /* @__PURE__ */ new Set([
  "host",
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "content-length",
  "accept-encoding"
]);
function routeUpstream(path, opts) {
  if (path.startsWith("/v1/messages")) return { base: opts.anthropicUrl, provider: "anthropic" };
  if (path.startsWith("/v1/chat/completions") || path.startsWith("/v1/completions") || path.startsWith("/v1/responses") || path.startsWith("/v1/embeddings")) {
    return { base: opts.openaiUrl, provider: "openai" };
  }
  return { base: opts.target ?? opts.anthropicUrl, provider: "unknown" };
}
function readBody(req) {
  return new Promise((resolve2, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve2(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}
function parseAnthropic(body, contentType) {
  const u = {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWrite5mTokens: 0,
    cacheWrite1hTokens: 0
  };
  const applyUsage = (usage) => {
    if (typeof usage.input_tokens === "number") u.inputTokens = usage.input_tokens;
    if (typeof usage.output_tokens === "number") u.outputTokens = usage.output_tokens;
    if (typeof usage.cache_read_input_tokens === "number")
      u.cacheReadTokens = usage.cache_read_input_tokens;
    const cc = usage.cache_creation;
    if (cc && typeof cc === "object") {
      u.cacheWrite5mTokens = cc.ephemeral_5m_input_tokens ?? 0;
      u.cacheWrite1hTokens = cc.ephemeral_1h_input_tokens ?? 0;
    } else if (typeof usage.cache_creation_input_tokens === "number") {
      u.cacheWrite5mTokens = usage.cache_creation_input_tokens;
    }
    const web = usage.server_tool_use?.web_search_requests ?? 0;
    if (web > 0) u.toolCalls = { ...u.toolCalls ?? {}, web_search_requests: web };
  };
  try {
    if (contentType.includes("event-stream")) {
      for (const line of body.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const json = line.slice(5).trim();
        if (!json || json === "[DONE]") continue;
        let evt;
        try {
          evt = JSON.parse(json);
        } catch {
          continue;
        }
        if (evt.type === "message_start" && evt.message) {
          u.model = evt.message.model;
          if (evt.message.usage) applyUsage(evt.message.usage);
        } else if (evt.type === "message_delta" && evt.usage) {
          if (typeof evt.usage.output_tokens === "number") u.outputTokens = evt.usage.output_tokens;
        }
      }
    } else {
      const o = JSON.parse(body);
      u.model = o.model;
      if (o.usage) applyUsage(o.usage);
    }
  } catch {
    return void 0;
  }
  return u.model ? u : void 0;
}
function parseOpenAI(body, contentType) {
  const u = {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWrite5mTokens: 0,
    cacheWrite1hTokens: 0
  };
  const applyUsage = (usage) => {
    const cached = usage.prompt_tokens_details?.cached_tokens ?? 0;
    u.inputTokens = (usage.prompt_tokens ?? usage.input_tokens ?? 0) - cached;
    u.cacheReadTokens = cached;
    u.outputTokens = usage.completion_tokens ?? usage.output_tokens ?? 0;
  };
  try {
    if (contentType.includes("event-stream")) {
      for (const line of body.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const json = line.slice(5).trim();
        if (!json || json === "[DONE]") continue;
        let evt;
        try {
          evt = JSON.parse(json);
        } catch {
          continue;
        }
        if (evt.model) u.model = evt.model;
        if (evt.usage) applyUsage(evt.usage);
        if (evt.response?.usage) applyUsage(evt.response.usage);
      }
    } else {
      const o = JSON.parse(body);
      u.model = o.model;
      const usage = o.usage ?? o.response?.usage;
      if (usage) applyUsage(usage);
    }
  } catch {
    return void 0;
  }
  return u.model && u.inputTokens + u.outputTokens > 0 ? u : void 0;
}
function startProxy(opts) {
  let gitCache;
  const git2 = () => {
    const now = Date.now();
    if (!gitCache || now - gitCache.at > 5e3) {
      gitCache = {
        branch: currentBranch(opts.repoRoot),
        sha: currentSha(opts.repoRoot),
        repo: repoSlug(opts.repoRoot),
        at: now
      };
    }
    return gitCache;
  };
  const handler = async (req, res) => {
    const path = req.url ?? "/";
    const { base, provider } = routeUpstream(path, opts);
    const reqBody = await readBody(req);
    const headers2 = {};
    for (const [k, v] of Object.entries(req.headers)) {
      if (STRIP_HEADERS.has(k.toLowerCase())) continue;
      if (Array.isArray(v)) headers2[k] = v.join(", ");
      else if (v != null) headers2[k] = v;
    }
    headers2["accept-encoding"] = "identity";
    let upstream;
    try {
      upstream = await fetch(base + path, {
        method: req.method,
        headers: headers2,
        body: reqBody.length ? reqBody : void 0
      });
    } catch (err) {
      res.writeHead(502, { "content-type": "text/plain" });
      res.end(`receipt proxy: upstream error: ${err.message}`);
      return;
    }
    const resHeaders = {};
    upstream.headers.forEach((value, key) => {
      if (STRIP_HEADERS.has(key.toLowerCase())) return;
      resHeaders[key] = value;
    });
    res.writeHead(upstream.status, resHeaders);
    const contentType = upstream.headers.get("content-type") ?? "";
    const collected = [];
    if (upstream.body) {
      const reader = upstream.body.getReader();
      for (; ; ) {
        const { done, value } = await reader.read();
        if (done) break;
        const buf = Buffer.from(value);
        collected.push(buf);
        res.write(buf);
      }
    }
    res.end();
    if (upstream.status < 200 || upstream.status >= 300) return;
    const text = Buffer.concat(collected).toString("utf8");
    const parsed = provider === "openai" ? parseOpenAI(text, contentType) : provider === "anthropic" ? parseAnthropic(text, contentType) : parseAnthropic(text, contentType) ?? parseOpenAI(text, contentType);
    if (!parsed || !parsed.model) return;
    const g = git2();
    const partial = {
      model: parsed.model,
      inputTokens: parsed.inputTokens,
      outputTokens: parsed.outputTokens,
      cacheReadTokens: parsed.cacheReadTokens,
      cacheWrite5mTokens: parsed.cacheWrite5mTokens,
      cacheWrite1hTokens: parsed.cacheWrite1hTokens,
      toolCalls: parsed.toolCalls
    };
    const entry = {
      ts: (/* @__PURE__ */ new Date()).toISOString(),
      source: "proxy",
      provider: providerOf(parsed.model),
      costUsd: opts.pricing.cost(partial),
      ...partial,
      git: { branch: g.branch, sha: g.sha, repo: g.repo }
    };
    append(opts.repoRoot, entry);
    if (!opts.quiet) {
      const cost = entry.costUsd === null ? import_picocolors.default.yellow("unpriced") : import_picocolors.default.green(money(entry.costUsd));
      process.stderr.write(
        `${import_picocolors.default.dim((/* @__PURE__ */ new Date()).toLocaleTimeString())} ${import_picocolors.default.cyan(parsed.model)} ${tokens(parsed.inputTokens)}\u2192${tokens(parsed.outputTokens)} ${cost}${g.branch ? import_picocolors.default.dim(` (${g.branch})`) : ""}
`
      );
    }
  };
  return new Promise((resolve2) => {
    const server = createServer((req, res) => {
      handler(req, res).catch((err) => {
        if (!res.headersSent) res.writeHead(500);
        res.end(`receipt proxy error: ${err.message}`);
      });
    });
    server.listen(opts.port, () => resolve2({ close: () => server.close() }));
  });
}

// src/dashboard.ts
import { createServer as createServer2 } from "http";
import { readFileSync as readFileSync6 } from "fs";
import { dirname as dirname4, join as join6 } from "path";
import { fileURLToPath } from "url";
var totalTokens = (e) => e.inputTokens + e.outputTokens + e.cacheReadTokens + e.cacheWrite5mTokens + e.cacheWrite1hTokens;
function buildDashboardData(entries, config = {}) {
  const daily = /* @__PURE__ */ new Map();
  const byModel = /* @__PURE__ */ new Map();
  const byBranch = /* @__PURE__ */ new Map();
  const byProvider = /* @__PURE__ */ new Map();
  let cost = 0;
  let tokens2 = 0;
  let first;
  let last;
  for (const e of entries) {
    const c = e.costUsd ?? 0;
    const tk = totalTokens(e);
    cost += c;
    tokens2 += tk;
    if (!first || e.ts < first) first = e.ts;
    if (!last || e.ts > last) last = e.ts;
    const day = e.ts.slice(0, 10);
    const d = daily.get(day) ?? { cost: 0, tokens: 0, calls: 0 };
    d.cost += c;
    d.tokens += tk;
    d.calls += 1;
    daily.set(day, d);
    const m = byModel.get(e.model) ?? { provider: e.provider, cost: 0, tokens: 0, calls: 0 };
    m.cost += c;
    m.tokens += tk;
    m.calls += 1;
    byModel.set(e.model, m);
    const branch = e.git?.branch ?? "(unknown)";
    const b = byBranch.get(branch) ?? { cost: 0, calls: 0 };
    b.cost += c;
    b.calls += 1;
    byBranch.set(branch, b);
    byProvider.set(e.provider, (byProvider.get(e.provider) ?? 0) + c);
  }
  return {
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    currency: config.currency ?? "USD",
    budget: config.budget,
    totals: { cost, tokens: tokens2, calls: entries.length, firstTs: first, lastTs: last },
    daily: [...daily.entries()].map(([date, v]) => ({ date, ...v })).sort((a, b) => a.date.localeCompare(b.date)),
    byModel: [...byModel.entries()].map(([model, v]) => ({ model, ...v })).sort((a, b) => b.cost - a.cost),
    byBranch: [...byBranch.entries()].map(([branch, v]) => ({ branch, ...v })).sort((a, b) => b.cost - a.cost).slice(0, 20),
    byProvider: [...byProvider.entries()].map(([provider, cost2]) => ({ provider, cost: cost2 })).sort((a, b) => b.cost - a.cost),
    topCalls: [...entries].filter((e) => e.costUsd !== null).sort((a, b) => (b.costUsd ?? 0) - (a.costUsd ?? 0)).slice(0, 12).map((e) => ({
      ts: e.ts,
      model: e.model,
      cost: e.costUsd ?? 0,
      tokens: totalTokens(e),
      branch: e.git?.branch
    }))
  };
}
function templatePath() {
  const here = dirname4(fileURLToPath(import.meta.url));
  for (const candidate of [
    join6(here, "..", "dashboard", "template.html"),
    join6(here, "dashboard", "template.html")
  ]) {
    try {
      readFileSync6(candidate);
      return candidate;
    } catch {
    }
  }
  throw new Error("Could not locate dashboard/template.html");
}
function renderDashboardHtml(data) {
  const tpl = readFileSync6(templatePath(), "utf8");
  return tpl.replace("/*__RECEIPT_DATA__*/", `window.__RECEIPT__ = ${JSON.stringify(data)};`);
}
function serveDashboard(repoRoot2, port) {
  const entries = readLedger(ledgerPath(repoRoot2));
  const data = buildDashboardData(entries, loadConfig(repoRoot2));
  const html = renderDashboardHtml(data);
  return new Promise((resolve2) => {
    const server = createServer2((_req, res) => {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(html);
    });
    server.listen(port, () => {
      resolve2({ url: `http://localhost:${port}`, close: () => server.close() });
    });
  });
}

// src/github.ts
var API = "https://api.github.com";
function headers(token) {
  return {
    authorization: `Bearer ${token}`,
    accept: "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
    "user-agent": "receipt",
    "content-type": "application/json"
  };
}
async function gh(token, path, init = {}) {
  const res = await fetch(API + path, { ...init, headers: { ...headers(token), ...init.headers ?? {} } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${res.status} ${res.statusText} on ${path}: ${text.slice(0, 300)}`);
  }
  if (res.status === 204) return void 0;
  return res.json();
}
async function findPrForBranch(ctx, branch) {
  const owner = ctx.repo.split("/")[0];
  const pulls = await gh(
    ctx.token,
    `/repos/${ctx.repo}/pulls?state=open&head=${owner}:${encodeURIComponent(branch)}&per_page=1`
  );
  return pulls[0]?.number;
}
async function findExistingComment(ctx, pr) {
  for (let page = 1; page <= 5; page++) {
    const comments = await gh(
      ctx.token,
      `/repos/${ctx.repo}/issues/${pr}/comments?per_page=100&page=${page}`
    );
    const hit = comments.find((c) => c.body?.includes(COMMENT_MARKER));
    if (hit) return hit.id;
    if (comments.length < 100) break;
  }
  return void 0;
}
async function postReceipt(ctx, pr, body) {
  const existing = await findExistingComment(ctx, pr);
  if (existing) {
    const updated = await gh(ctx.token, `/repos/${ctx.repo}/issues/comments/${existing}`, {
      method: "PATCH",
      body: JSON.stringify({ body })
    });
    return { action: "updated", url: updated.html_url };
  }
  const created = await gh(ctx.token, `/repos/${ctx.repo}/issues/${pr}/comments`, {
    method: "POST",
    body: JSON.stringify({ body })
  });
  return { action: "created", url: created.html_url };
}

// src/cli.ts
var program2 = new Command();
program2.name("receipt").description("See exactly what your AI coding agent cost \u2014 itemized on every pull request.").version("0.1.0");
function repoRoot() {
  return findRepoRoot();
}
function fail(message) {
  process.stderr.write(import_picocolors2.default.red("\u2717 ") + message + "\n");
  process.exit(1);
}
program2.command("proxy").description("Run a logging proxy. Point ANTHROPIC_BASE_URL / OPENAI_BASE_URL at it.").option("-p, --port <port>", "port to listen on", "8787").option("--anthropic-url <url>", "upstream Anthropic API", "https://api.anthropic.com").option("--openai-url <url>", "upstream OpenAI API", "https://api.openai.com").option("-q, --quiet", "do not print a line per call").action(async (opts) => {
  const root = repoRoot();
  const pricing = Pricing.load(root);
  const port = Number(opts.port);
  const { close } = await startProxy({
    port,
    repoRoot: root,
    pricing,
    anthropicUrl: opts.anthropicUrl,
    openaiUrl: opts.openaiUrl,
    quiet: Boolean(opts.quiet)
  });
  process.stderr.write(
    import_picocolors2.default.green("\u25CF ") + `receipt proxy on ${import_picocolors2.default.bold(`http://localhost:${port}`)}
` + import_picocolors2.default.dim(`  export ANTHROPIC_BASE_URL=http://localhost:${port}
`) + import_picocolors2.default.dim(`  export OPENAI_BASE_URL=http://localhost:${port}/v1
`) + import_picocolors2.default.dim(`  logging to ${ledgerPath(root)}
`)
  );
  const shutdown = () => {
    close();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
});
var importCmd = program2.command("import").description("Pull usage into the ledger from a tool's own logs.");
importCmd.command("claude-code").alias("claude").description("Import token usage from Claude Code session logs.").option("--all", "import every repo, not just this one").option("--branch <branch>", "only this branch").option("--since <iso>", "only calls at or after this time").option("--dir <path>", "Claude projects dir (default ~/.claude/projects)").action(async (opts) => {
  const root = repoRoot();
  const pricing = Pricing.load(root);
  const seen = knownRequestIds(ledgerPath(root));
  const entries = await importClaudeCode({
    pricing,
    repoRoot: root,
    all: Boolean(opts.all),
    branch: opts.branch,
    sinceTs: opts.since,
    dir: opts.dir,
    seen
  });
  writeEntries(root, entries, "claude-code");
});
importCmd.command("generic <file>").description("Import a JSON/JSONL file of usage rows (OpenAI- or Anthropic-shaped).").option("--source <name>", "label the source", "generic").action((file, opts) => {
  const root = repoRoot();
  const pricing = Pricing.load(root);
  const seen = knownRequestIds(ledgerPath(root));
  const all = importGeneric(file, pricing, { source: opts.source });
  const entries = all.filter((e) => !e.requestId || !seen.has(e.requestId));
  writeEntries(root, entries, "generic");
});
function writeEntries(root, entries, source) {
  if (entries.length === 0) {
    process.stderr.write(import_picocolors2.default.dim(`Nothing new to import from ${source}.
`));
    return;
  }
  for (const e of entries) append(root, e);
  const total = entries.reduce((s, e) => s + (e.costUsd ?? 0), 0);
  process.stderr.write(
    import_picocolors2.default.green("\u2713 ") + `imported ${import_picocolors2.default.bold(String(entries.length))} calls from ${source} \xB7 ${money(total)}
`
  );
}
program2.command("show").description("Print the receipt for the current branch to the terminal.").option("--branch <branch>", "branch to scope to (default: current)").option("--base <base>", "base branch to diff against", "main").option("--all", "every entry in the ledger, ignoring branch").option("--today", "only today's calls").option("--json", "machine-readable output").action((opts) => {
  const root = repoRoot();
  const config = loadConfig(root);
  const receipt = computeReceipt(root, {
    branch: opts.all ? void 0 : opts.branch,
    base: opts.base,
    allEntries: Boolean(opts.all),
    today: Boolean(opts.today)
  });
  if (opts.json) {
    process.stdout.write(JSON.stringify(receipt, null, 2) + "\n");
    return;
  }
  process.stdout.write("\n" + colorizeText(renderText(receipt), config) + "\n\n");
});
program2.command("pr").description("Render the pull-request receipt as markdown (prints to stdout).").option("--branch <branch>", "branch to scope to (default: current)").option("--base <base>", "base branch to diff against", "main").option("--out <file>", "write to a file instead of stdout").action((opts) => {
  const root = repoRoot();
  const md = renderPrMarkdown(root, opts.branch, opts.base);
  if (opts.out) {
    writeFileSync2(opts.out, md, "utf8");
    process.stderr.write(import_picocolors2.default.green("\u2713 ") + `wrote ${opts.out}
`);
  } else {
    process.stdout.write(md + "\n");
  }
});
program2.command("post").description("Post or update the receipt as a sticky comment on the pull request.").option("--repo <owner/name>", "target repository").option("--pr <number>", "pull request number").option("--branch <branch>", "branch to scope to (default: current)").option("--base <base>", "base branch", "main").option("--token <token>", "GitHub token (else GITHUB_TOKEN / GH_TOKEN)").option("--dry-run", "print the comment instead of posting").action(async (opts) => {
  const root = repoRoot();
  const ctx = resolveContext(root, opts);
  const md = renderPrMarkdown(root, ctx.branch, ctx.base);
  if (opts.dryRun) {
    process.stdout.write(md + "\n");
    return;
  }
  if (!ctx.repo) fail("No repository. Pass --repo owner/name or set a git remote.");
  if (!ctx.token) fail("No token. Pass --token or set GITHUB_TOKEN / GH_TOKEN.");
  let pr = ctx.pr;
  if (!pr && ctx.branch) {
    pr = await findPrForBranch({ repo: ctx.repo, token: ctx.token }, ctx.branch);
  }
  if (!pr) fail("No open pull request found. Pass --pr <number>.");
  const result = await postReceipt({ repo: ctx.repo, token: ctx.token }, pr, md);
  process.stderr.write(import_picocolors2.default.green("\u2713 ") + `${result.action} receipt on ${ctx.repo}#${pr}
  ${result.url}
`);
});
program2.command("dashboard").description("Serve a local dashboard of all recorded spend.").option("-p, --port <port>", "port", "4123").option("--no-open", "do not open a browser").action(async (opts) => {
  const root = repoRoot();
  const { url } = await serveDashboard(root, Number(opts.port));
  process.stderr.write(import_picocolors2.default.green("\u25CF ") + `dashboard on ${import_picocolors2.default.bold(url)} ${import_picocolors2.default.dim("(ctrl-c to stop)")}
`);
  if (opts.open !== false) openBrowser(url);
});
program2.command("wrapped").description("A shareable summary of recent AI spend.").option("--days <n>", "look-back window in days", "30").action((opts) => {
  const root = repoRoot();
  const config = loadConfig(root);
  const days = Number(opts.days);
  const since = Date.now() - days * 864e5;
  const entries = readLedger(ledgerPath(root)).filter((e) => new Date(e.ts).getTime() >= since);
  const data = buildDashboardData(entries, config);
  const top = data.byModel[0];
  const share = data.byModel.length ? Math.round((top?.cost ?? 0) / (data.totals.cost || 1) * 100) : 0;
  const lines = [
    "",
    import_picocolors2.default.bold(`\u{1F9FE} Receipt \u2014 last ${days} days`),
    "",
    `  ${import_picocolors2.default.bold(money(data.totals.cost))} across ${data.totals.calls} calls and ${data.byBranch.length} branches`,
    `  ${tokens(data.totals.tokens)} tokens`,
    top ? `  ${top.model} did the heavy lifting (${share}% of spend)` : "",
    data.topCalls[0] ? `  priciest single call: ${money(data.topCalls[0].cost)} (${data.topCalls[0].model})` : "",
    ""
  ].filter(Boolean);
  process.stdout.write(lines.join("\n") + "\n");
});
var budgetCmd = program2.command("budget").description("Set or show spend ceilings.");
budgetCmd.command("set <scope> <amount>").description("Set a budget. scope is 'pr' or 'day'; amount is in USD.").action((scope, amount) => {
  const root = repoRoot();
  const config = loadConfig(root);
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) fail("Amount must be a positive number.");
  config.budget ??= {};
  if (scope === "pr") config.budget.perPr = value;
  else if (scope === "day") config.budget.perDay = value;
  else fail("Scope must be 'pr' or 'day'.");
  saveConfig(root, config);
  process.stderr.write(import_picocolors2.default.green("\u2713 ") + `budget per ${scope} set to ${money(value)}
`);
});
budgetCmd.action(() => {
  const config = loadConfig(repoRoot());
  const b = config.budget ?? {};
  process.stdout.write(
    `per PR:  ${b.perPr ? money(b.perPr) : "\u2014"}
per day: ${b.perDay ? money(b.perDay) : "\u2014"}
`
  );
});
function computeReceipt(root, o) {
  const config = loadConfig(root);
  const pricing = Pricing.load(root);
  void pricing;
  const entries = readLedger(ledgerPath(root));
  const currency = config.currency ?? "USD";
  if (o.allEntries) {
    return buildReceipt(entries, { currency });
  }
  let sinceTs;
  let shas;
  if (o.today) {
    sinceTs = new Date((/* @__PURE__ */ new Date()).toDateString()).toISOString();
  } else {
    const r = rangeFor(root, o.base, o.branch);
    shas = r.shas;
    sinceTs = r.sinceTs;
  }
  const selected = selectEntries(entries, { branch: o.branch, sinceTs, rangeShas: shas, currency });
  return buildReceipt(selected, { branch: o.branch, base: o.base, currency });
}
function renderPrMarkdown(root, branch, base) {
  const config = loadConfig(root);
  const currency = config.currency ?? "USD";
  const entries = readLedger(ledgerPath(root));
  const b = branch;
  const { shas, sinceTs } = rangeFor(root, base, b);
  const selected = selectEntries(entries, { branch: b, rangeShas: shas, sinceTs, currency });
  const receipt = buildReceipt(selected, { branch: b, base, currency });
  return renderMarkdown(receipt, {
    budget: config.budget,
    series: selected.map((e) => ({ ts: e.ts, cost: e.costUsd ?? 0 })),
    priceUpdated: Pricing.load(root).updated()
  });
}
function colorizeText(text, _config) {
  return text.split("\n").map((line, i) => i === 0 ? import_picocolors2.default.bold(line) : i === 1 ? import_picocolors2.default.green(line) : line).join("\n");
}
function openBrowser(url) {
  const cmd = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  try {
    spawn(cmd, [url], { stdio: "ignore", detached: true }).unref();
  } catch {
  }
}
program2.parseAsync(process.argv).catch((err) => fail(err.message));
