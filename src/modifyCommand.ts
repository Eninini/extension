import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { renderPrompt } from '@vscode/prompt-tsx';
import { processJsonFile } from './processArtifacts';
import { handleError, handler } from './chatRequestHandler';
import { updateYamlDiagnostics, subscribeToDocumentChanges } from './validation';
import { register } from 'module';


export async function modifyCommand(request: vscode.ChatRequest, context: vscode.ChatContext, stream: vscode.ChatResponseStream, token: vscode.CancellationToken) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    const document = editor.document;
    const selection = editor.selection;
    const range = new vscode.Range(selection.start, selection.end);
    const text = document.getText(range);

    
    const edit = new vscode.WorkspaceEdit();
    edit.replace(document.uri, range, newValue);
    vscode.workspace.applyEdit(edit);
}