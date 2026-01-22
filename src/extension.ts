import * as vscode from 'vscode';
import * as prettier from 'prettier';

// This function is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
    console.log('ASP Code Formatter is now active!');

    // Register the formatter for .asp files
    const formatter = vscode.languages.registerDocumentFormattingEditProvider('asp', {
        async provideDocumentFormattingEdits(document: vscode.TextDocument): Promise<vscode.TextEdit[]> {
            const edits: vscode.TextEdit[] = [];
            const fullText = document.getText();
            const formattedText = await formatCompleteAspFile(fullText);

            // Replace the entire document with formatted text
            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(fullText.length)
            );

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
        // ASP settings
        keywordCase: config.get<string>('keywordCase', 'PascalCase'),
        indentStyle: config.get<string>('indentStyle', 'spaces'),
        indentSize: config.get<number>('indentSize', 4),
        // Prettier settings
        prettier: {
            printWidth: config.get<number>('prettier.printWidth', 80),
            tabWidth: config.get<number>('prettier.tabWidth', 2),
            useTabs: config.get<boolean>('prettier.useTabs', false),
            semi: config.get<boolean>('prettier.semi', true),
            singleQuote: config.get<boolean>('prettier.singleQuote', false),
            htmlWhitespaceSensitivity: config.get<string>('prettier.htmlWhitespaceSensitivity', 'css')
        }
    };
}

// Main function: Format complete ASP file with HTML, CSS, JS, and ASP code
async function formatCompleteAspFile(code: string): Promise<string> {
    const settings = getSettings();
    
    // Step 1: Extract and mask ASP blocks
    const aspBlocks: { code: string; indent: string }[] = [];
    const maskedCode = code.replace(/^([ \t]*)(<%[\s\S]*?%>)/gm, (match, indent, aspBlock) => {
        const index = aspBlocks.length;
        aspBlocks.push({ code: aspBlock, indent: indent });
        return indent + `___ASP_BLOCK_${index}___`;
    });
    
    // Step 2: Format HTML/CSS/JS with Prettier
    let prettifiedCode: string;
    try {
        const formatted = await prettier.format(maskedCode, {
            parser: 'html',
            printWidth: settings.prettier.printWidth,
            tabWidth: settings.prettier.tabWidth,
            useTabs: settings.prettier.useTabs,
            semi: settings.prettier.semi,
            singleQuote: settings.prettier.singleQuote,
            htmlWhitespaceSensitivity: settings.prettier.htmlWhitespaceSensitivity as any,
            endOfLine: 'lf'
        });
        prettifiedCode = formatted;
    } catch (error) {
        console.error('Prettier formatting failed:', error);
        prettifiedCode = maskedCode; // Fallback to masked code if Prettier fails
    }
    
    // Step 3: Format each ASP block and restore them with proper indentation
    let restoredCode = prettifiedCode;
    aspBlocks.forEach((block, index) => {
        // Get the current indentation of the placeholder in the prettified code
        const placeholderRegex = new RegExp(`^([ \\t]*)___ASP_BLOCK_${index}___`, 'm');
        const match = restoredCode.match(placeholderRegex);
        const htmlIndent = match ? match[1] : '';
        
        // Format the ASP block with the HTML indentation
        const formattedBlock = formatSingleAspBlock(block.code, settings, htmlIndent);
        
        // Replace placeholder with formatted block
        restoredCode = restoredCode.replace(
            new RegExp(`^[ \\t]*___ASP_BLOCK_${index}___`, 'm'),
            formattedBlock
        );
    });
    
    return restoredCode;
}

// Format a single ASP block (either <% ... %> or <%= ... %>)
function formatSingleAspBlock(block: string, settings: any, htmlIndent: string = ''): string {
    // Check if it's an inline expression <%= %>
    if (block.trim().startsWith('<%=')) {
        // Format inline expression: <%= variable %>
        const content = block.substring(3, block.length - 2).trim();
        const formattedContent = applyKeywordCase(content, settings.keywordCase);
        return '<%= ' + formattedContent + ' %>';
    }
    
    // Check if it's a single-line block
    if (!block.includes('\n')) {
        // Single line: <% code %>
        const content = block.substring(2, block.length - 2).trim();
        const formattedContent = applyKeywordCase(content, settings.keywordCase);
        return '<% ' + formattedContent + ' %>';
    }
    
    // Multi-line block: format with indentation
    return formatMultiLineAspBlock(block, settings, htmlIndent);
}

// Format multi-line ASP block
function formatMultiLineAspBlock(block: string, settings: any, htmlIndent: string = ''): string {
    const lines = block.split('\n');
    const formattedLines: string[] = [];
    let aspIndentLevel = 0;
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        const trimmedLine = line.trim();
        
        // Opening tag
        if (trimmedLine === '<%' || trimmedLine.startsWith('<%')) {
            if (trimmedLine === '<%') {
                formattedLines.push(htmlIndent + '<%');
                continue;
            }
            // Single line after <%
            const content = trimmedLine.substring(2).trim();
            if (content) {
                const indentChange = getIndentChange(content);
                if (indentChange.before < 0) {
                    aspIndentLevel = Math.max(0, aspIndentLevel + indentChange.before);
                }
                const aspIndent = getIndentString(aspIndentLevel, settings.indentStyle, settings.indentSize);
                const formattedContent = applyKeywordCase(content, settings.keywordCase);
                formattedLines.push(htmlIndent + aspIndent + formattedContent);
                if (indentChange.after > 0) {
                    aspIndentLevel += indentChange.after;
                }
            }
            continue;
        }
        
        // Closing tag
        if (trimmedLine === '%>' || trimmedLine.endsWith('%>')) {
            if (trimmedLine === '%>') {
                formattedLines.push(htmlIndent + '%>');
                continue;
            }
            // Code before %>
            const content = trimmedLine.substring(0, trimmedLine.length - 2).trim();
            if (content) {
                const indentChange = getIndentChange(content);
                if (indentChange.before < 0) {
                    aspIndentLevel = Math.max(0, aspIndentLevel + indentChange.before);
                }
                const aspIndent = getIndentString(aspIndentLevel, settings.indentStyle, settings.indentSize);
                const formattedContent = applyKeywordCase(content, settings.keywordCase);
                formattedLines.push(htmlIndent + aspIndent + formattedContent);
                if (indentChange.after > 0) {
                    aspIndentLevel += indentChange.after;
                }
            }
            formattedLines.push(htmlIndent + '%>');
            continue;
        }
        
        // Regular line inside ASP block
        if (trimmedLine) {
            const indentChange = getIndentChange(trimmedLine);
            if (indentChange.before < 0) {
                aspIndentLevel = Math.max(0, aspIndentLevel + indentChange.before);
            }
            const aspIndent = getIndentString(aspIndentLevel, settings.indentStyle, settings.indentSize);
            const formattedContent = applyKeywordCase(trimmedLine, settings.keywordCase);
            formattedLines.push(htmlIndent + aspIndent + formattedContent);
            if (indentChange.after > 0) {
                aspIndentLevel += indentChange.after;
            }
        } else {
            formattedLines.push('');
        }
    }
    
    return formattedLines.join('\n');
}

// Generate indent string based on settings
function getIndentString(level: number, style: string, size: number): string {
    if (style === 'tabs') {
        return '\t'.repeat(level);
    } else {
        return ' '.repeat(level * size);
    }
}

// Add spacing around operators
function formatOperators(code: string): string {
    // Operators that should have spaces around them
    const operators = [
        { pattern: /\s*=\s*/g, replacement: ' = ' },      // x=1 → x = 1
        { pattern: /\s*<>\s*/g, replacement: ' <> ' },    // x<>1 → x <> 1
        { pattern: /\s*\+\s*/g, replacement: ' + ' },     // x+1 → x + 1
        { pattern: /\s*-\s*/g, replacement: ' - ' },      // x-1 → x - 1
        { pattern: /\s*\*\s*/g, replacement: ' * ' },     // x*2 → x * 2
        { pattern: /\s*\/\s*/g, replacement: ' / ' },     // x/2 → x / 2
        { pattern: /\s*&\s*/g, replacement: ' & ' },      // "a"&"b" → "a" & "b"
        { pattern: /\s*<\s*/g, replacement: ' < ' },      // x<5 → x < 5
        { pattern: /\s*>\s*/g, replacement: ' > ' },      // x>5 → x > 5
        { pattern: /\s*<=\s*/g, replacement: ' <= ' },    // x<=5 → x <= 5
        { pattern: /\s*>=\s*/g, replacement: ' >= ' }     // x>=5 → x >= 5
    ];
    
    let result = code;
    
    // Apply each operator formatting
    for (const op of operators) {
        result = result.replace(op.pattern, op.replacement);
    }
    
    // Fix double operators that got messed up
    result = result.replace(/ < > /g, ' <> ');   // Fix <> getting split
    result = result.replace(/ < = /g, ' <= ');   // Fix <=
    result = result.replace(/ > = /g, ' >= ');   // Fix >=
    
    return result;
}

// Apply keyword case formatting
function applyKeywordCase(code: string, caseStyle: string): string {
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
function formatKeyword(keyword: string, caseStyle: string): string {
    switch (caseStyle) {
        case 'lowercase':
            return keyword.toLowerCase();
        case 'UPPERCASE':
            return keyword.toUpperCase();
        case 'PascalCase':
            // Handle multi-word keywords like "end if"
            return keyword.split(' ').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ');
        default:
            return keyword;
    }
}

// Determines how indentation should change for a line
function getIndentChange(line: string): { before: number; after: number } {
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
        /\bif\b.*\bthen\b/,                         // If...Then
        /\bfor\b\s+\w+\s*=/,                        // For...Next
        /\bfor\s+each\b/,                           // For Each...Next
        /\bwhile\b/,                                // While...Wend
        /\bdo\b(\s+while|\s+until)?(\s|$)/,         // Do / Do While / Do Until
        /\bselect\s+case\b/,                        // Select Case
        /\bsub\b\s+\w+/,                            // Sub
        /\bfunction\b\s+\w+/,                       // Function
        /\bwith\b/,                                 // With
        /\bclass\b\s+\w+/,                          // Class
        /\bproperty\s+(get|let|set)\b/,             // Property Get/Let/Set
        /^\s*else(\s|$)/,                           // Else (also opens new block)
        /^\s*elseif\s+.*\bthen\b/,                  // ElseIf...Then
        /^\s*case\s+/,                              // Case
        /^\s*case\s+else(\s|$)/                     // Case Else
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
export function deactivate() {}