import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { processJsonFile } from './processArtifacts';
import { updateYamlDiagnostics, subscribeToDocumentChanges } from './validation';


export var folderPath: string | undefined;
export function activate(context: vscode.ExtensionContext) {
    //console.log('Congratulations, your extension "mobr-pipelines" is now active!');
    const yamlDiagnostics = vscode.languages.createDiagnosticCollection('yaml');
    subscribeToDocumentChanges(context, yamlDiagnostics);

    let updateSettings = vscode.commands.registerCommand("mobr-pipelines.updateWorkspaceSettings", () => {
        updateWorkspaceSettings();
    });
    context.subscriptions.push(updateSettings);
    let disposable = vscode.commands.registerCommand('mobr-pipelines.selectServiceRootFolder', async () => {
        await selectServiceRootFolder();
    });
    context.subscriptions.push(disposable);
    context.subscriptions.push(
        vscode.commands.registerCommand('mobr-pipelines.validateYaml', async () => {
            const editor = vscode.window.activeTextEditor;

            if (editor) {
                await updateYamlDiagnostics(editor.document, yamlDiagnostics);
            }
            //execute commands in sequence
        }));

    context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider('yaml', new YamlCodeActionProvider(), {
            providedCodeActionKinds: YamlCodeActionProvider.providedCodeActionKinds
        })
    );

    console.log('Congratulations, your extension "mobr-pipelines" is now active!');

}
async function selectServiceRootFolder() {

    try {
        const options: vscode.OpenDialogOptions = {
            canSelectMany: false,
            openLabel: 'Select Artifacts Folder',
            canSelectFolders: true,
            canSelectFiles: false
        };

        const folderUri = await vscode.window.showOpenDialog(options);
        if (folderUri && folderUri[0]) {
            folderPath = folderUri[0].fsPath;       //checking folder has some content


            // const files = fs.readdirSync(folderPath);     //before accessing files
            //    let subscriptionId: string | undefined;
            //    for (const file of files){
            //     const filePath =path.join(folderPath, file);
            //     if(path.extname(filePath)==='.json'){
            //         subscriptionId=processJsonFile(filePath);
            //         if(subscriptionId){

            //         }
            //     }
            //    }
        }
    }
    catch (error) {
        vscode.window.showErrorMessage(`failed to select service root folder: ${error}`);
        console.log(error);
    }

}
async function updateWorkspaceSettings() {
    const config = vscode.workspace.getConfiguration("yaml");
    let settings = config.get<Record<string, any>>("schemas") || {};
    console.log(settings);
    // Define the path to your JSON schema file
    const schemaFileName = "mobrSchema.json";
    console.log(__dirname);
    const schemaFilePath = path.join(__dirname, '..', 'schemas', schemaFileName);
    console.log('Schema file path:', schemaFilePath);
    const schemaFileUri = vscode.Uri.file(schemaFilePath).toString();
    console.log('Schema file URI:', schemaFileUri);
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
        vscode.window.showErrorMessage('No active editor found. Cannot determine YAML file path.');
        console.log('No active editor found. Cannot determine YAML file path.');
        return;
    }

    //const yamlFilePath = activeEditor.document.uri.fsPath;
    const yamlFilePath = "/*";

    if (!settings[schemaFilePath]) {
        settings[schemaFilePath] = [];
    }

    if (!settings[schemaFilePath].includes(yamlFilePath)) {
        settings[schemaFilePath].push(yamlFilePath);
    }

    console.log('Updating YAML schemas settings...');
    try {
        await config.update("schemas", settings, vscode.ConfigurationTarget.Workspace, true);

        vscode.window.showInformationMessage(`Updated YAML schema settings for ${yamlFilePath}`);
        console.log('Updated YAML schema settings:', settings);

    } catch (error) {
        vscode.window.showErrorMessage(`Failed to update YAML schema settings: ${error}`);
        console.log('Failed to update YAML schema settings:', error);
    }

}
class YamlCodeActionProvider implements vscode.CodeActionProvider {

    public static readonly providedCodeActionKinds = [
        vscode.CodeActionKind.QuickFix
    ];

    provideCodeActions(document: vscode.TextDocument, range: vscode.Range): vscode.CodeAction[] {
        const diagnostics = vscode.languages.getDiagnostics(document.uri);
        const codeActions: vscode.CodeAction[] = [];

        diagnostics.forEach(diagnostic => {
            if (diagnostic.code === 'incorrectSubscriptionId') {
                const fix = new vscode.CodeAction('Fix incorrect subscription ID', vscode.CodeActionKind.QuickFix);
                fix.edit = new vscode.WorkspaceEdit();
                fix.edit.replace(document.uri, diagnostic.range, 'how do i bring the id here?');
                fix.diagnostics = [diagnostic];
                codeActions.push(fix);
            }

            if (diagnostic.code === 'missingDownload') {
                const fix = new vscode.CodeAction('Add download step', vscode.CodeActionKind.QuickFix);
                fix.edit = new vscode.WorkspaceEdit();
                const insertPosition = new vscode.Position(diagnostic.range.start.line + 1, 0);
                fix.edit.insert(document.uri, insertPosition, '  - download:\n');
                fix.diagnostics = [diagnostic];
                codeActions.push(fix);
            }

            if (diagnostic.code === 'missingPrepareDeploymentTask') {
                const fix = new vscode.CodeAction('Add prepare-deployment task', vscode.CodeActionKind.QuickFix);
                fix.edit = new vscode.WorkspaceEdit();
                const insertPosition = new vscode.Position(diagnostic.range.start.line, 0);
                fix.edit.insert(document.uri, insertPosition, '  - task: prepare-deployment@1\n');
                fix.diagnostics = [diagnostic];
                codeActions.push(fix);
            }
        });

        return codeActions;
    }
}
export function deactivate() {
    console.log('Deactivating extension...');
}


