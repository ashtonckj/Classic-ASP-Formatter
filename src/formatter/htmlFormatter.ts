import * as vscode from 'vscode';
import * as prettier from 'prettier';
import { formatSingleAspBlock, getAspSettings } from './aspFormatter';

// Prettier settings interface
export interface PrettierSettings {
    printWidth: number;
    tabWidth: number;
    useTabs: boolean;
    semi: boolean;
    singleQuote: boolean;
    bracketSameLine: boolean;
    arrowParens: string;
    trailingComma: string;
    endOfLine: string;
    htmlWhitespaceSensitivity: string;
}

// Get Prettier settings from workspace config
export function getPrettierSettings(): PrettierSettings {
    const config = vscode.workspace.getConfiguration('aspFormatter.prettier');
    return {
        printWidth: config.get<number>('printWidth', 80),
        tabWidth: config.get<number>('tabWidth', 2),
        useTabs: config.get<boolean>('useTabs', false),
        semi: config.get<boolean>('semi', true),
        singleQuote: config.get<boolean>('singleQuote', false),
        bracketSameLine: config.get<boolean>('bracketSameLine', true),
        arrowParens: config.get<string>('arrowParens', 'always'),
        trailingComma: config.get<string>('trailingComma', 'es5'),
        endOfLine: config.get<string>('endOfLine', 'lf'),
        htmlWhitespaceSensitivity: config.get<string>('htmlWhitespaceSensitivity', 'css')
    };
}

// Main function: Format complete ASP file
export async function formatCompleteAspFile(code: string): Promise<string> {
    const aspSettings = getAspSettings();
    const prettierSettings = getPrettierSettings();
    
    // Step 1: Extract and mask ASP blocks
    const aspBlocks: { code: string; indent: string; id: string }[] = [];
    let blockCounter = 0;
    
    const maskedCode = code.replace(/^([ \t]*)(<%[\s\S]*?%>)/gm, (match, indent, aspBlock) => {
        const uniqueId = `ASP_PLACEHOLDER_${blockCounter}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        aspBlocks.push({ 
            code: aspBlock, 
            indent: indent,
            id: uniqueId
        });
        blockCounter++;
        return indent + `<!--${uniqueId}-->`;
    });
    
    // Step 2: Format HTML/CSS/JS with Prettier
    let prettifiedCode: string;
    try {
        const formatted = await prettier.format(maskedCode, {
            parser: 'html',
            printWidth: prettierSettings.printWidth,
            tabWidth: prettierSettings.tabWidth,
            useTabs: prettierSettings.useTabs,
            semi: prettierSettings.semi,
            singleQuote: prettierSettings.singleQuote,
            bracketSameLine: prettierSettings.bracketSameLine,
            arrowParens: prettierSettings.arrowParens as any,
            trailingComma: prettierSettings.trailingComma as any,
            endOfLine: prettierSettings.endOfLine as any,
            htmlWhitespaceSensitivity: prettierSettings.htmlWhitespaceSensitivity as any
        });
        prettifiedCode = formatted;
        prettifiedCode = fixClosingBrackets(prettifiedCode);
    } catch (error) {
        console.error('Prettier formatting failed:', error);
        prettifiedCode = maskedCode;
    }
    
    // Step 3: Restore ASP blocks
    let restoredCode = prettifiedCode;
    
    for (const block of aspBlocks) {
        const placeholderRegex = new RegExp(`^([ \\t]*)<!--${block.id}-->`, 'gm');
        const match = placeholderRegex.exec(restoredCode);
        
        if (match) {
            const htmlIndent = match[1];
            const formattedBlock = formatSingleAspBlock(block.code, aspSettings, htmlIndent);
            restoredCode = restoredCode.replace(
                new RegExp(`^[ \\t]*<!--${block.id}-->`, 'gm'),
                formattedBlock
            );
        } else {
            console.warn(`Warning: Placeholder ${block.id} not found`);
            const formattedBlock = formatSingleAspBlock(block.code, aspSettings, '');
            restoredCode = restoredCode.replace(
                new RegExp(`<!--${block.id}-->`, 'g'),
                formattedBlock
            );
        }
    }
    
    return restoredCode;
}

// Fix closing brackets
function fixClosingBrackets(code: string): string {
    return code.replace(/(<\/[^>]+)\n\s*>/g, '$1>');
}