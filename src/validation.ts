import * as vscode from 'vscode';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { folderPath } from './extension';
import { processJsonFile } from './processArtifacts';

export function updateYamlDiagnostics(document: vscode.TextDocument, collection: vscode.DiagnosticCollection): void {
    if (document && (path.extname(document.uri.fsPath) === '.yaml' || path.extname(document.uri.fsPath) === '.yml')) {
        const text = document.getText();

        let yamlContent: any;
        let yamlLines: any;
        try {
            yamlContent = yaml.load(text);
            yamlLines = text.split('\n');

        } catch (error: any) {
            collection.set(document.uri, [{
                code: '',
                message: `YAML syntax error: ${error.message}`,
                range: new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 1)),
                severity: vscode.DiagnosticSeverity.Error,
                source: 'yaml',
                relatedInformation: []
            }]);
            return;
        }
        let stageIndices = [];
        for (let i = 0; i < yamlLines.length; i++) {
            if (yamlLines[i].includes('stage:')) {
                stageIndices.push(i);
                console.log(`position of stage: ${i}`);
            }
        }
        stageIndices.push(yamlLines.length);

        //   Initialize an array to hold the diagnostics
        const diagnostics: vscode.Diagnostic[] = [];
        let problemLine = 0;
        // Check for the specific condition in the YAML content
        if (yamlContent.extends && yamlContent.extends.parameters && yamlContent.extends.parameters.stages) {
            const stages = yamlContent.extends.parameters.stages;
            let j = 0;
            for (const stage of stages) {
                console.log(stage.stage);
                if(stage.stage){
                    let azureSubId: string;
                    if (stage.variables.azure_subscription_id) {
                        azureSubId = stage.variables.azure_subscription_id;
                        console.log(azureSubId);
                    }
                    if(stage.jobs){
                        const jobs=stage.jobs;
                        for(const job of jobs){
                            console.log(job.job);
                            if(job.steps){
                                const steps=job.steps;
                                steps.forEach((step: any) => {
                                    if ('inputs' in step) {
                                        const inputValues = step.inputs;
                                        if (inputValues && inputValues.RolloutSpecPath) {
                                            const filePath = inputValues['RolloutSpecPath'];
                                            const lastSlashIndex = filePath.lastIndexOf('/');

                                            // Find the index of '.RolloutSpec.Test.json'
                                            const suffixIndex = filePath.lastIndexOf('.rolloutspec.json');
                                            let file: string = "";
                                            if (lastSlashIndex !== -1 && suffixIndex !== -1 && suffixIndex > lastSlashIndex && folderPath) {
                                                const prefix = filePath.substring(lastSlashIndex + 1, suffixIndex);
                                                file = path.join(folderPath, prefix, '.servicemodel.json');
                                                console.log(prefix); // Output: ConfiguratorServiceCICD
                                            } else {
                                                const prefix = "";
                                                if (folderPath) {
                                                    file = path.join(folderPath, 'servicemodel.json');
                                                } console.log('Prefix not found');

                                            }
                                            let subscriptionId: string | undefined;



                                            subscriptionId = processJsonFile(file);
                                            if (subscriptionId) {
                                                if (subscriptionId !== azureSubId) {
                                                    const message = 'Error: Incorrect Azure subscription id.';

                                                    const yamlLines = text.split('\n');
                                                    //let problemLine = 0;
                                                    for (let k = stageIndices[j]; k < stageIndices[j + 1]; k++) {
                                                        if (yamlLines[k].includes(azureSubId)) {
                                                            problemLine = k;
                                                            console.log(problemLine);

                                                            break;
                                                        }
                                                    }

                                                    const range = new vscode.Range(new vscode.Position(problemLine, 0), new vscode.Position(problemLine, yamlLines[problemLine].length));
                                                    diagnostics.push(new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Warning));
                                                }
                                            }



                                            console.log(inputValues['RolloutSpecPath']);
                                            console.log(file);
                                        }
                                    }
                                });
                            }
                            
                        }
                    }
                }
                if (stage.stage && stage.stage.toLowerCase().startsWith('test')) {

                  
                    //const jobs = stage.jobs || [];
                    if (stage.jobs) {
                        const jobs = stage.jobs;
                        for (const job of jobs) {
                            console.log(job.job);
                            if (job.steps) {
                                const steps = job.steps;
                                if (!steps.some((step: any) => step.download)) {
                                    const message = 'Steps must have atleast one download property';
                                    const yamlLines = text.split('\n');

                                    let problemColumn = 0;
                                    for (let k = stageIndices[j]; k < stageIndices[j + 1]; k++) {
                                        if (yamlLines[k].includes('steps')) {
                                            problemLine = k;
                                            console.log(k);
                                            //  problemColumn = yamlLines[i].indexOf(stage.jobs.steps);
                                            break;
                                        }
                                    }

                                    const range = new vscode.Range(new vscode.Position(problemLine, 0), new vscode.Position(problemLine, yamlLines[problemLine].length));
                                    console.log(range);
                                    diagnostics.push(new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error));

                                }
                                const taskNames = steps.map((step: any) => step.task);
                                if (taskNames.includes('ExpressV2Internal@1') && !taskNames.includes('prepare-deployment@1')) {
                                    const message = 'Error: Stages with environment `Test` requires a Prepare Deployment task before an Ev2 task.';

                                    // Find the line and column number where the issue is located
                                    const yamlLines = text.split('\n');
                                    let problemLine = 0;
                                    // let problemColumn = 0;
                                    for (let k = stageIndices[j]; k < stageIndices[j + 1]; k++) {
                                        if (yamlLines[k].includes('steps')) {
                                            problemLine = k;
                                            break;
                                        }
                                    }

                                    const range = new vscode.Range(new vscode.Position(problemLine, 0), new vscode.Position(problemLine, yamlLines[problemLine].length));
                                    diagnostics.push(new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error));
                                }
                              

                            }
                        }
                    }
                }
                j++;
            }
        }

        // Clear and set diagnostics
        collection.set(document.uri, diagnostics);
    } else {
        collection.clear();
    }
}


export function subscribeToDocumentChanges(context: vscode.ExtensionContext, yamlDiagnostics: vscode.DiagnosticCollection): void {
    if (vscode.window.activeTextEditor) {
        updateYamlDiagnostics(vscode.window.activeTextEditor.document, yamlDiagnostics);
    }
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor) {
                updateYamlDiagnostics(editor.document, yamlDiagnostics);
            }
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(e => updateYamlDiagnostics(e.document, yamlDiagnostics))
    );

    context.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument(doc => yamlDiagnostics.delete(doc.uri))
    );
}
