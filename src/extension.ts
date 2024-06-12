import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { processJsonFile } from './processArtifacts';
import { updateYamlDiagnostics, subscribeToDocumentChanges } from './validation';


export var folderPath: string|undefined;
export function activate(context: vscode.ExtensionContext) {
    //console.log('Congratulations, your extension "mobr-pipelines" is now active!');
    const yamlDiagnostics = vscode.languages.createDiagnosticCollection('yaml');
    subscribeToDocumentChanges(context, yamlDiagnostics);

    let updateSettings =  vscode.commands.registerCommand("mobr-pipelines.updateWorkspaceSettings", () => {
        updateWorkspaceSettings();
    });
    context.subscriptions.push(updateSettings);
    let disposable =  vscode.commands.registerCommand('mobr-pipelines.selectServiceRootFolder', async () => {
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



    console.log('Congratulations, your extension "mobr-pipelines" is now active!');

}
async function selectServiceRootFolder() {

   try { const options: vscode.OpenDialogOptions = {
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
    }}
    catch(error){
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

export function deactivate() {
    console.log('Deactivating extension...');
}


