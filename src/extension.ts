import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "mobr-pipelines" is now active!');

    let updateSettings = vscode.commands.registerCommand("mobr-pipelines.updateWorkspaceSettings", () => {
        updateWorkspaceSettings();
    });

    context.subscriptions.push(updateSettings);
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
    // const azureConfig = vscode.workspace.getConfiguration();
    // const azureSchemaPath = schemaFileUri; // Path to your schema file

    // console.log('Updating Azure Pipelines custom schema settings...');
    // try {
    //     await azureConfig.update("azure-pipelines.customSchemaFile", azureSchemaPath, vscode.ConfigurationTarget.Workspace);
    //     vscode.window.showInformationMessage(`Updated Azure Pipelines custom schema settings to ${azureSchemaPath}`);
    //     console.log('Updated Azure Pipelines custom schema settings:', azureSchemaPath);
    // } catch (error) {
    //     vscode.window.showErrorMessage(`Failed to update Azure Pipelines custom schema settings: ${error}`);
    //     console.log('Failed to update Azure Pipelines custom schema settings:', error);
    // }
}

export function deactivate() {
    console.log('Deactivating extension...');
}

