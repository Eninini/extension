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
    // Define the path to your JSON schema file
    const schemaFileName = "mobrSchema.json";
    const schemaFilePath = path.join(__dirname, '..', 'schemas', schemaFileName);
    console.log('Schema file path:', schemaFilePath);

    // // Update the YAML schema settings
    // const yamlConfig = vscode.workspace.getConfiguration("yaml");
    // let yamlSettings = yamlConfig.get<Record<string, any>>("schemas") || {};
    // const yamlFilePattern = "/*";  // Apply schema to all YAML files in the workspace

    // if (!yamlSettings[schemaFilePath]) {
    //     yamlSettings[schemaFilePath] = [];
    // }

    // if (!yamlSettings[schemaFilePath].includes(yamlFilePattern)) {
    //     yamlSettings[schemaFilePath].push(yamlFilePattern);
    // }

    // console.log('Updating YAML schemas settings...');
    // try {
    //     await yamlConfig.update("schemas", yamlSettings, vscode.ConfigurationTarget.Workspace);
    //     vscode.window.showInformationMessage(`Updated YAML schema settings to apply ${schemaFilePath} to all YAML files`);
    //     console.log('Updated YAML schema settings:', yamlSettings);
    // } catch (error) {
    //     vscode.window.showErrorMessage(`Failed to update YAML schema settings: ${error}`);
    //     console.log('Failed to update YAML schema settings:', error);
    // }

    // Update the Azure Pipelines custom schema setting
    const azureConfig = vscode.workspace.getConfiguration();
    const azureSchemaPath = schemaFilePath; // Path to your schema file

    console.log('Updating Azure Pipelines custom schema settings...');
    try {
        await azureConfig.update("azure-pipelines.customSchemaFile", azureSchemaPath, vscode.ConfigurationTarget.Workspace);
        vscode.window.showInformationMessage(`Updated Azure Pipelines custom schema settings to ${azureSchemaPath}`);
        console.log('Updated Azure Pipelines custom schema settings:', azureSchemaPath);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to update Azure Pipelines custom schema settings: ${error}`);
        console.log('Failed to update Azure Pipelines custom schema settings:', error);
    }
}

export function deactivate() {
    console.log('Deactivating extension...');
}
