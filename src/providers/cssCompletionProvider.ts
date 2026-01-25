import * as vscode from 'vscode';
import { getContext, ContextType } from '../utils/documentHelper';

// Common CSS properties
const CSS_PROPERTIES = [
    { name: 'color', description: 'Text color', values: ['red', 'blue', 'green', '#000', 'rgb()', 'rgba()'] },
    { name: 'background', description: 'Background shorthand', values: [] },
    { name: 'background-color', description: 'Background color', values: ['red', 'blue', 'transparent'] },
    { name: 'background-image', description: 'Background image', values: ['url()', 'none'] },
    { name: 'font-size', description: 'Font size', values: ['12px', '16px', '1em', '1rem'] },
    { name: 'font-family', description: 'Font family', values: ['Arial', 'sans-serif', 'monospace'] },
    { name: 'font-weight', description: 'Font weight', values: ['normal', 'bold', '100', '400', '700'] },
    { name: 'font-style', description: 'Font style', values: ['normal', 'italic', 'oblique'] },
    { name: 'text-align', description: 'Text alignment', values: ['left', 'center', 'right', 'justify'] },
    { name: 'text-decoration', description: 'Text decoration', values: ['none', 'underline', 'line-through'] },
    { name: 'display', description: 'Display type', values: ['block', 'inline', 'inline-block', 'flex', 'grid', 'none'] },
    { name: 'position', description: 'Position type', values: ['static', 'relative', 'absolute', 'fixed', 'sticky'] },
    { name: 'top', description: 'Top position', values: ['0', '10px', 'auto'] },
    { name: 'right', description: 'Right position', values: ['0', '10px', 'auto'] },
    { name: 'bottom', description: 'Bottom position', values: ['0', '10px', 'auto'] },
    { name: 'left', description: 'Left position', values: ['0', '10px', 'auto'] },
    { name: 'width', description: 'Element width', values: ['100px', '100%', 'auto'] },
    { name: 'height', description: 'Element height', values: ['100px', '100%', 'auto'] },
    { name: 'max-width', description: 'Maximum width', values: ['100%', '1200px'] },
    { name: 'min-width', description: 'Minimum width', values: ['0', '300px'] },
    { name: 'max-height', description: 'Maximum height', values: ['100%', '500px'] },
    { name: 'min-height', description: 'Minimum height', values: ['0', '200px'] },
    { name: 'margin', description: 'Margin (all sides)', values: ['0', '10px', 'auto'] },
    { name: 'margin-top', description: 'Top margin', values: ['0', '10px'] },
    { name: 'margin-right', description: 'Right margin', values: ['0', '10px'] },
    { name: 'margin-bottom', description: 'Bottom margin', values: ['0', '10px'] },
    { name: 'margin-left', description: 'Left margin', values: ['0', '10px'] },
    { name: 'padding', description: 'Padding (all sides)', values: ['0', '10px'] },
    { name: 'padding-top', description: 'Top padding', values: ['0', '10px'] },
    { name: 'padding-right', description: 'Right padding', values: ['0', '10px'] },
    { name: 'padding-bottom', description: 'Bottom padding', values: ['0', '10px'] },
    { name: 'padding-left', description: 'Left padding', values: ['0', '10px'] },
    { name: 'border', description: 'Border shorthand', values: ['1px solid black'] },
    { name: 'border-width', description: 'Border width', values: ['1px', '2px', 'thin'] },
    { name: 'border-style', description: 'Border style', values: ['solid', 'dashed', 'dotted', 'none'] },
    { name: 'border-color', description: 'Border color', values: ['black', 'red', '#000'] },
    { name: 'border-radius', description: 'Border radius', values: ['0', '5px', '50%'] },
    { name: 'flex', description: 'Flexbox shorthand', values: ['1', '0 1 auto'] },
    { name: 'flex-direction', description: 'Flex direction', values: ['row', 'column', 'row-reverse'] },
    { name: 'justify-content', description: 'Justify content', values: ['flex-start', 'center', 'space-between'] },
    { name: 'align-items', description: 'Align items', values: ['flex-start', 'center', 'stretch'] },
    { name: 'gap', description: 'Gap between items', values: ['10px', '1rem'] },
    { name: 'grid-template-columns', description: 'Grid columns', values: ['repeat(3, 1fr)', '1fr 2fr'] },
    { name: 'grid-template-rows', description: 'Grid rows', values: ['auto', '100px 1fr'] },
    { name: 'z-index', description: 'Stack order', values: ['0', '1', '999'] },
    { name: 'opacity', description: 'Opacity', values: ['0', '0.5', '1'] },
    { name: 'cursor', description: 'Cursor type', values: ['pointer', 'default', 'text', 'move'] },
    { name: 'overflow', description: 'Overflow behavior', values: ['visible', 'hidden', 'scroll', 'auto'] },
    { name: 'box-shadow', description: 'Box shadow', values: ['0 2px 4px rgba(0,0,0,0.1)'] },
    { name: 'transition', description: 'CSS transition', values: ['all 0.3s ease'] },
    { name: 'transform', description: 'CSS transform', values: ['scale(1.1)', 'rotate(45deg)'] },
];

export class CssCompletionProvider implements vscode.CompletionItemProvider {
    
    provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
        
        const config = vscode.workspace.getConfiguration('aspLanguageSupport');
        if (!config.get<boolean>('enableCSSCompletion', true)) {
            return [];
        }
        
        const docContext = getContext(document, position);
        
        // Only provide CSS completions inside <style> tags
        if (docContext !== ContextType.CSS) {
            return [];
        }
        
        const line = document.lineAt(position.line).text;
        const textBefore = line.substring(0, position.character);
        
        // Check if we're typing a property (inside a CSS rule)
        if (textBefore.match(/\{[^}]*$/)) {
            return this.provideCssPropertyCompletions();
        }
        
        return [];
    }
    
    private provideCssPropertyCompletions(): vscode.CompletionItem[] {
        return CSS_PROPERTIES.map(prop => {
            const item = new vscode.CompletionItem(prop.name, vscode.CompletionItemKind.Property);
            item.detail = prop.description;
            item.documentation = new vscode.MarkdownString(`**${prop.name}**\n\n${prop.description}`);
            
            // Create snippet with value placeholder
            item.insertText = new vscode.SnippetString(`${prop.name}: $0;`);
            
            // Add common values to documentation if available
            if (prop.values && prop.values.length > 0) {
                item.documentation.appendMarkdown(`\n\n**Common values:** ${prop.values.join(', ')}`);
            }
            
            return item;
        });
    }
}