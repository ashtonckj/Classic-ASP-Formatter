import * as vscode from 'vscode';

// Settings interface
export interface AspFormatterSettings {
    keywordCase: string;
    useTabs: boolean;
    indentSize: number;
}

// Get ASP formatter settings
export function getAspSettings(): AspFormatterSettings {
    const config = vscode.workspace.getConfiguration('aspFormatter');
    return {
        keywordCase: config.get<string>('keywordCase', 'PascalCase'),
        useTabs: config.get<boolean>('useTabs', false),
        indentSize: config.get<number>('indentSize', 2),
    };
}

// Format a single ASP block (either <% ... %> or <%= ... %>)
export function formatSingleAspBlock(block: string, settings: AspFormatterSettings, htmlIndent: string = ''): string {
    // Check if it's an inline expression <%= %>
    if (block.trim().startsWith('<%=')) {
        const content = block.substring(3, block.length - 2).trim();
        const formattedContent = applyKeywordCase(content, settings.keywordCase);
        return htmlIndent + '<%= ' + formattedContent + ' %>';
    }
    
    // Check if it's a single-line block
    if (!block.includes('\n')) {
        const content = block.substring(2, block.length - 2).trim();
        const formattedContent = applyKeywordCase(content, settings.keywordCase);
        return htmlIndent + '<% ' + formattedContent + ' %>';
    }
    
    // Multi-line block: format with indentation
    return formatMultiLineAspBlock(block, settings, htmlIndent);
}

// Format multi-line ASP block
function formatMultiLineAspBlock(block: string, settings: AspFormatterSettings, htmlIndent: string = ''): string {
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
            const content = trimmedLine.substring(2).trim();
            if (content) {
                const indentChange = getIndentChange(content);
                if (indentChange.before < 0) {
                    aspIndentLevel = Math.max(0, aspIndentLevel + indentChange.before);
                }
                const aspIndent = getIndentString(aspIndentLevel, settings.useTabs, settings.indentSize);
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
            const content = trimmedLine.substring(0, trimmedLine.length - 2).trim();
            if (content) {
                const indentChange = getIndentChange(content);
                if (indentChange.before < 0) {
                    aspIndentLevel = Math.max(0, aspIndentLevel + indentChange.before);
                }
                const aspIndent = getIndentString(aspIndentLevel, settings.useTabs, settings.indentSize);
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
            const aspIndent = getIndentString(aspIndentLevel, settings.useTabs, settings.indentSize);
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

// Generate indent string
function getIndentString(level: number, useTabs: boolean, size: number): string {
    if (useTabs) {
        return '\t'.repeat(level);
    } else {
        return ' '.repeat(level * size);
    }
}

// Apply keyword case formatting
function applyKeywordCase(code: string, caseStyle: string): string {
    const keywords = [
        'if', 'then', 'else', 'elseif', 'end if',
        'for', 'to', 'step', 'next', 'each', 'in',
        'while', 'wend', 'do', 'loop', 'until',
        'select', 'case', 'end select',
        'dim', 'redim', 'const', 'private', 'public',
        'sub', 'end sub', 'function', 'end function', 'call', 'exit',
        'property', 'get', 'let', 'set', 'end property',
        'class', 'end class', 'new',
        'with', 'end with', 'option', 'explicit',
        'on', 'error', 'resume', 'goto',
        'and', 'or', 'not', 'xor', 'eqv', 'imp',
        'is', 'mod', 'true', 'false', 'null', 'nothing', 'empty'
    ];
    
    const aspObjects = [
        'response', 'request', 'server', 'session', 'application',
        'write', 'redirect', 'end', 'form', 'querystring', 'cookies',
        'servervariables', 'mappath', 'createobject', 'htmlencode', 'urlencode'
    ];

    let result = code;
    
    for (const keyword of keywords) {
        const regex = new RegExp('\\b' + keyword + '\\b', 'gi');
        result = result.replace(regex, (match) => {
            return formatKeyword(keyword, caseStyle);
        });
    }
    
    for (const obj of aspObjects) {
        const regex = new RegExp('\\b' + obj + '\\b', 'gi');
        result = result.replace(regex, (match) => {
            return formatKeyword(obj, 'PascalCase');
        });
    }
    
    result = formatOperators(result);
    
    return result;
}

// Format keyword
function formatKeyword(keyword: string, caseStyle: string): string {
    switch (caseStyle) {
        case 'lowercase':
            return keyword.toLowerCase();
        case 'UPPERCASE':
            return keyword.toUpperCase();
        case 'PascalCase':
            return keyword.split(' ').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ');
        default:
            return keyword;
    }
}

// Format operators
function formatOperators(code: string): string {
    const operators = [
        { pattern: /\s*=\s*/g, replacement: ' = ' },
        { pattern: /\s*<>\s*/g, replacement: ' <> ' },
        { pattern: /\s*\+\s*/g, replacement: ' + ' },
        { pattern: /\s*-\s*/g, replacement: ' - ' },
        { pattern: /\s*\*\s*/g, replacement: ' * ' },
        { pattern: /\s*\/\s*/g, replacement: ' / ' },
        { pattern: /\s*&\s*/g, replacement: ' & ' },
        { pattern: /\s*<\s*/g, replacement: ' < ' },
        { pattern: /\s*>\s*/g, replacement: ' > ' },
        { pattern: /\s*<=\s*/g, replacement: ' <= ' },
        { pattern: /\s*>=\s*/g, replacement: ' >= ' }
    ];
    
    let result = code;
    
    for (const op of operators) {
        result = result.replace(op.pattern, op.replacement);
    }
    
    result = result.replace(/ < > /g, ' <> ');
    result = result.replace(/ < = /g, ' <= ');
    result = result.replace(/ > = /g, ' >= ');
    
    return result;
}

// Get indent change
function getIndentChange(line: string): { before: number; after: number } {
    const lowerLine = line.toLowerCase().trim();
    
    if (/\bif\b.*\bthen\b\s+\S+/.test(lowerLine)) {
        return { before: 0, after: 0 };
    }
    
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
    
    const increaseAfterPatterns = [
        /\bif\b.*\bthen\b/,
        /\bfor\b\s+\w+\s*=/,
        /\bfor\s+each\b/,
        /\bwhile\b/,
        /\bdo\b(\s+while|\s+until)?(\s|$)/,
        /\bselect\s+case\b/,
        /\bsub\b\s+\w+/,
        /\bfunction\b\s+\w+/,
        /\bwith\b/,
        /\bclass\b\s+\w+/,
        /\bproperty\s+(get|let|set)\b/,
        /^\s*else(\s|$)/,
        /^\s*elseif\s+.*\bthen\b/,
        /^\s*case\s+/,
        /^\s*case\s+else(\s|$)/
    ];
    
    let before = 0;
    let after = 0;
    
    for (const pattern of decreaseBeforePatterns) {
        if (pattern.test(lowerLine)) {
            before = -1;
            break;
        }
    }
    
    for (const pattern of increaseAfterPatterns) {
        if (pattern.test(lowerLine)) {
            after = 1;
            break;
        }
    }
    
    return { before, after };
}