"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
// This function is called when your extension is activated
function activate(context) {
    console.log('ASP Code Formatter is now active!');
    // Register the formatter for .asp files
    const formatter = vscode.languages.registerDocumentFormattingEditProvider('asp', {
        provideDocumentFormattingEdits(document) {
            const edits = [];
            const fullText = document.getText();
            const formattedText = formatAspCode(fullText);
            // Replace the entire document with formatted text
            const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(fullText.length));
            edits.push(vscode.TextEdit.replace(fullRange, formattedText));
            return edits;
        }
    });
    context.subscriptions.push(formatter);
}
// Get user settings
function getSettings() {
    const config = vscode.workspace.getConfiguration('aspFormatter');
    return {
        keywordCase: config.get('keywordCase', 'PascalCase'),
        indentStyle: config.get('indentStyle', 'spaces'),
        indentSize: config.get('indentSize', 4)
    };
}
// Main formatting function
function formatAspCode(code) {
    const settings = getSettings();
    const lines = code.split('\n');
    const formattedLines = [];
    let insideAspBlock = false;
    let aspIndentLevel = 0;
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        const trimmedLine = line.trim();
        // Check if entering ASP block
        if (trimmedLine.startsWith('<%') && !trimmedLine.includes('%>')) {
            insideAspBlock = true;
            aspIndentLevel = 0;
            formattedLines.push('<%');
            continue;
        }
        // Check if exiting ASP block
        if (insideAspBlock && trimmedLine === '%>') {
            insideAspBlock = false;
            formattedLines.push('%>');
            continue;
        }
        // Check for single-line ASP blocks (like <% x = 1 %>)
        if (trimmedLine.startsWith('<%') && trimmedLine.endsWith('%>')) {
            const aspCode = trimmedLine.substring(2, trimmedLine.length - 2).trim();
            const formattedCode = applyKeywordCase(aspCode, settings.keywordCase);
            formattedLines.push('<% ' + formattedCode + ' %>');
            continue;
        }
        // Format lines inside ASP block
        if (insideAspBlock) {
            const indentChange = getIndentChange(trimmedLine);
            // Decrease indent BEFORE formatting (for closing keywords)
            if (indentChange.before < 0) {
                aspIndentLevel = Math.max(0, aspIndentLevel + indentChange.before);
            }
            // Format the line with current indent and keyword case
            const indent = getIndentString(aspIndentLevel, settings.indentStyle, settings.indentSize);
            const formattedCode = applyKeywordCase(trimmedLine, settings.keywordCase);
            const formattedLine = indent + formattedCode;
            formattedLines.push(formattedLine);
            // Increase indent AFTER formatting (for opening keywords)
            if (indentChange.after > 0) {
                aspIndentLevel += indentChange.after;
            }
        }
        else {
            // Outside ASP block - just preserve HTML/CSS/JS (clean trailing spaces)
            formattedLines.push(line.trimEnd());
        }
    }
    return formattedLines.join('\n');
}
// Generate indent string based on settings
function getIndentString(level, style, size) {
    if (style === 'tabs') {
        return '\t'.repeat(level);
    }
    else {
        return ' '.repeat(level * size);
    }
}
// Add spacing around operators
function formatOperators(code) {
    // Operators that should have spaces around them
    const operators = [
        { pattern: /\s*=\s*/g, replacement: ' = ' }, // x=1 → x = 1
        { pattern: /\s*<>\s*/g, replacement: ' <> ' }, // x<>1 → x <> 1
        { pattern: /\s*\+\s*/g, replacement: ' + ' }, // x+1 → x + 1
        { pattern: /\s*-\s*/g, replacement: ' - ' }, // x-1 → x - 1 (but not in negative numbers)
        { pattern: /\s*\*\s*/g, replacement: ' * ' }, // x*2 → x * 2
        { pattern: /\s*\/\s*/g, replacement: ' / ' }, // x/2 → x / 2
        { pattern: /\s*&\s*/g, replacement: ' & ' }, // "a"&"b" → "a" & "b"
        { pattern: /\s*<\s*/g, replacement: ' < ' }, // x<5 → x < 5
        { pattern: /\s*>\s*/g, replacement: ' > ' }, // x>5 → x > 5
        { pattern: /\s*<=\s*/g, replacement: ' <= ' }, // x<=5 → x <= 5
        { pattern: /\s*>=\s*/g, replacement: ' >= ' } // x>=5 → x >= 5
    ];
    let result = code;
    // Apply each operator formatting
    for (const op of operators) {
        result = result.replace(op.pattern, op.replacement);
    }
    // Fix double operators that got messed up
    result = result.replace(/ < > /g, ' <> '); // Fix <> getting split
    result = result.replace(/ < = /g, ' <= '); // Fix <=
    result = result.replace(/ > = /g, ' >= '); // Fix >=
    return result;
}
// Apply keyword case formatting
function applyKeywordCase(code, caseStyle) {
    // VBScript keywords to format
    const keywords = [
        // Control structures
        'if', 'then', 'else', 'elseif', 'end if',
        'for', 'to', 'step', 'next', 'each', 'in',
        'while', 'wend', 'do', 'loop', 'until',
        'select', 'case', 'end select',
        // Declarations
        'dim', 'redim', 'const', 'private', 'public',
        // Subroutines and functions
        'sub', 'end sub', 'function', 'end function', 'call', 'exit',
        'property', 'get', 'let', 'set', 'end property',
        // Classes
        'class', 'end class', 'new',
        // Other
        'with', 'end with', 'option', 'explicit',
        'on', 'error', 'resume', 'goto',
        'and', 'or', 'not', 'xor', 'eqv', 'imp',
        'is', 'mod', 'true', 'false', 'null', 'nothing', 'empty'
    ];
    // Common ASP objects and methods (apply PascalCase to these)
    const aspObjects = [
        'response', 'request', 'server', 'session', 'application',
        'write', 'redirect', 'end', 'form', 'querystring', 'cookies',
        'servervariables', 'mappath', 'createobject', 'htmlencode', 'urlencode'
    ];
    let result = code;
    // Format VBScript keywords
    for (const keyword of keywords) {
        const regex = new RegExp('\\b' + keyword + '\\b', 'gi');
        result = result.replace(regex, (match) => {
            return formatKeyword(keyword, caseStyle);
        });
    }
    // Always format ASP objects in PascalCase regardless of keyword setting
    for (const obj of aspObjects) {
        const regex = new RegExp('\\b' + obj + '\\b', 'gi');
        result = result.replace(regex, (match) => {
            return formatKeyword(obj, 'PascalCase');
        });
    }
    // Add spacing around operators
    result = formatOperators(result);
    return result;
}
// Format a single keyword based on case style
function formatKeyword(keyword, caseStyle) {
    switch (caseStyle) {
        case 'lowercase':
            return keyword.toLowerCase();
        case 'UPPERCASE':
            return keyword.toUpperCase();
        case 'PascalCase':
            // Handle multi-word keywords like "end if"
            return keyword.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
        default:
            return keyword;
    }
}
// Determines how indentation should change for a line
function getIndentChange(line) {
    const lowerLine = line.toLowerCase().trim();
    // Keywords that DECREASE indent BEFORE the line (closing keywords)
    const decreaseBeforePatterns = [
        /^\s*end\s+(if|sub|function|with|select|class|property)/,
        /^\s*loop(\s|$)/,
        /^\s*next(\s|$)/,
        /^\s*wend(\s|$)/,
        /^\s*else(\s|$)/,
        /^\s*elseif\s+/,
        /^\s*case\s+/,
        /^\s*case\s+else(\s|$)/
    ];
    // Keywords that INCREASE indent AFTER the line (opening keywords)
    const increaseAfterPatterns = [
        /\bif\b.*\bthen\b/, // If...Then
        /\bfor\b\s+\w+\s*=/, // For...Next
        /\bfor\s+each\b/, // For Each...Next
        /\bwhile\b/, // While...Wend
        /\bdo\b(\s+while|\s+until)?(\s|$)/, // Do / Do While / Do Until
        /\bselect\s+case\b/, // Select Case
        /\bsub\b\s+\w+/, // Sub
        /\bfunction\b\s+\w+/, // Function
        /\bwith\b/, // With
        /\bclass\b\s+\w+/, // Class
        /\bproperty\s+(get|let|set)\b/, // Property Get/Let/Set
        /^\s*else(\s|$)/, // Else (also opens new block)
        /^\s*elseif\s+.*\bthen\b/, // ElseIf...Then
        /^\s*case\s+/, // Case
        /^\s*case\s+else(\s|$)/ // Case Else
    ];
    let before = 0;
    let after = 0;
    // Check for decrease before
    for (const pattern of decreaseBeforePatterns) {
        if (pattern.test(lowerLine)) {
            before = -1;
            break;
        }
    }
    // Check for increase after
    for (const pattern of increaseAfterPatterns) {
        if (pattern.test(lowerLine)) {
            after = 1;
            break;
        }
    }
    return { before, after };
}
// This function is called when your extension is deactivated
function deactivate() { }
//# sourceMappingURL=extension.js.map