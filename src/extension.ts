import * as vscode from 'vscode';
import { formatCompleteAspFile } from './formatter/htmlFormatter';
import { HtmlCompletionProvider, registerAutoClosingTag, registerEnterKeyHandler } from './providers/htmlCompletionProvider';
import { AspCompletionProvider } from './providers/aspCompletionProvider';
import { CssCompletionProvider } from './providers/cssCompletionProvider';
import { JsCompletionProvider } from './providers/jsCompletionProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Classic ASP Language Support is now active!');

    // Register formatter
    const formatter = vscode.languages.registerDocumentFormattingEditProvider('asp', {
        async provideDocumentFormattingEdits(document: vscode.TextDocument): Promise<vscode.TextEdit[]> {
            const edits: vscode.TextEdit[] = [];
            const fullText = document.getText();
            const formattedText = await formatCompleteAspFile(fullText);

            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(fullText.length)
            );

            edits.push(vscode.TextEdit.replace(fullRange, formattedText));
            return edits;
        }
    });

    // Register completion providers
    const htmlCompletionProvider = vscode.languages.registerCompletionItemProvider(
        'asp',
        new HtmlCompletionProvider(),
        '<', ' ', '='  // Trigger characters
    );

    const aspCompletionProvider = vscode.languages.registerCompletionItemProvider(
        'asp',
        new AspCompletionProvider(),
        '.'  // Trigger for object methods (e.g., Response.)
    );

    const cssCompletionProvider = vscode.languages.registerCompletionItemProvider(
        'asp',
        new CssCompletionProvider(),
        ':', ';'  // Trigger characters
    );

    const jsCompletionProvider = vscode.languages.registerCompletionItemProvider(
        'asp',
        new JsCompletionProvider(),
        '.'  // Trigger for object methods (e.g., element.)
    );

    // Register auto-closing tags
    registerAutoClosingTag(context);
    
    // Register Enter key handler for smart tag closing
    registerEnterKeyHandler(context);

    // Add all to subscriptions
    context.subscriptions.push(
        formatter,
        htmlCompletionProvider,
        aspCompletionProvider,
        cssCompletionProvider,
        jsCompletionProvider
    );
}

export function deactivate() {}