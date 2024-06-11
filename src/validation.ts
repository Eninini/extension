import * as vscode from 'vscode';
import * as path from 'path';
import * as yaml from 'js-yaml';

export function updateYamlDiagnostics(document: vscode.TextDocument, collection: vscode.DiagnosticCollection): void {
    if (document && (path.extname(document.uri.fsPath) === '.yaml' || path.extname(document.uri.fsPath) === '.yml')) {
        const text = document.getText();

        let yamlContent: any;
        try {
            yamlContent = yaml.load(text);
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

        //   Initialize an array to hold the diagnostics
        const diagnostics: vscode.Diagnostic[] = [];

        // Check for the specific condition in the YAML content
        if (yamlContent.extends && yamlContent.extends.parameters && yamlContent.extends.parameters.stages) {
            const stages = yamlContent.extends.parameters.stages;
            for (const stage of stages) {
                if (stage.stage && stage.stage.toLowerCase().startsWith('test')) {
                    let id: string;
                    if(stage.variables.azure_subscription_id){
                        id=stage.variables.azure_subscription_id;
                        console.log(id);
                    }
                    const jobs = stage.jobs || [];
                    for (const job of jobs) {
                        if (job.job) {
                            const steps = job.steps || [];
                            if (!steps.some((step:any)=>step.download)) {
                                const message = 'Steps must have atleast one download property';
                                const yamlLines = text.split('\n');
                                let problemLine = 0;
                                //let problemColumn = 0;
                                for (let i = 0; i < yamlLines.length; i++) {
                                    if (yamlLines[i].includes('steps')) {
                                        problemLine = i;
                                      //  problemColumn = yamlLines[i].indexOf(stage.jobs.steps);
                                        break;
                                    }
                                }

                                const range = new vscode.Range(new vscode.Position(problemLine, 0), new vscode.Position(problemLine, yamlLines[problemLine].length));
                                console.log(range);
                                diagnostics.push(new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error));

                            }
                            const taskNames = steps.map((step: any) => step.task);
                            if (taskNames.includes('ExpressV2Internal@1')&&!taskNames.includes('prepare-deployment@1')) {
                                const message = 'Error: Stages with environment `Test` requires a Prepare Deployment task just before an Ev2 task.';

                                // Find the line and column number where the issue is located
                                const yamlLines = text.split('\n');
                                let problemLine = 0;
                               // let problemColumn = 0;
                                for (let i = 0; i < yamlLines.length; i++) {
                                    if (yamlLines[i].includes('steps')) {
                                        problemLine = i;
                                       // problemColumn = yamlLines[i].indexOf(stage.jobs.steps);
                                        break;
                                    }
                                }

                                const range = new vscode.Range(new vscode.Position(problemLine, 0), new vscode.Position(problemLine, yamlLines[problemLine].length ));
                                diagnostics.push(new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error));
                            }
                            steps.forEach((step: any) => {
                                if('inputs' in step) {
                                    const inputValues=step.inputs;
                                    if(inputValues&&inputValues.RolloutSpecPath){
                                        console.log(inputValues['RolloutSpecPath']);
                                    }
                                }
                            });

                        }
                    }
                }
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
