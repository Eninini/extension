import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { processJsonFile} from './processArtifacts';
import { updateYamlDiagnostics, subscribeToDocumentChanges } from './validation';

export function activate(context: vscode.ExtensionContext) {
    //console.log('Congratulations, your extension "mobr-pipelines" is now active!');
    const yamlDiagnostics = vscode.languages.createDiagnosticCollection('yaml');
    subscribeToDocumentChanges(context, yamlDiagnostics);

    let updateSettings = vscode.commands.registerCommand("mobr-pipelines.updateWorkspaceSettings", () => {
        updateWorkspaceSettings();
    });
    context.subscriptions.push(updateSettings);
   context.subscriptions.push(
        vscode.commands.registerCommand('mobr-pipelines.validateYaml', () => {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                updateYamlDiagnostics(editor.document, yamlDiagnostics);
            }
               //execute commands in sequence
        }));
      let disposable=  vscode.commands.registerCommand('mobr-pipelines.selectServiceRootFolder', ()=>{
            selectServiceRootFolder();
    });
    context.subscriptions.push(disposable);
  

    console.log('Congratulations, your extension "mobr-pipelines" is now active!');

}
async function selectServiceRootFolder() {
    
    const options: vscode.OpenDialogOptions = {
        canSelectMany: false,
        openLabel: 'Select Folder',
        canSelectFolders: true,
        canSelectFiles: false};

        const folderUri= await vscode.window.showOpenDialog(options);
        if(folderUri&&folderUri[0]){
            const folderPath=folderUri[0].fsPath;
            const files=fs.readdirSync(folderPath);
           let subscriptionId: string | undefined;
           for (const file of files){
            const filePath =path.join(folderPath, file);
            if(path.extname(filePath)==='.json'){
                subscriptionId=processJsonFile(filePath);
                if(subscriptionId){
                    
                }
            }
           }
        }

}
async function updateWorkspaceSettings() {
    const config = vscode.workspace.getConfiguration("yaml");
    let settings = config.get<Record<string, any>>("schemas") || {};

    // Define the path to your JSON schema file
    const schemaFileName = "mobrSchema.json";
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
    const yamlFilePath="/*";

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

export function deactivate() {
    console.log('Deactivating extension...');
}


