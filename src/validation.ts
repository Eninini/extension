import * as vscode from 'vscode';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { folderPath } from './extension';
import { processJsonFile, processRolloutspecFile } from './processArtifacts';

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
                range: error.range,
                //new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 1)),
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
            let cnt=0;
            for (const stage of stages) {
                //console.log(stage.stage); 
                if(stage.stage){
                    let azureSubId: string[] = [];      //azure ids from the YAML file
                    if (stage.variables.azure_subscription_id) {
                        const ids = stage.variables.azure_subscription_id.split(/,\s*/);
                        azureSubId.push(...ids);
                    }
                    else if(stage.variables.azure_subscription_ids){
                        const ids = stage.variables.azure_subscription_ids.split(/,\s*/);
                        azureSubId.push(...ids);

                    }
                    
                    if(stage.jobs){
                        const jobs=stage.jobs;
                        for(const job of jobs){
                            console.log(job.job);
                            if(job.steps){
                                const steps=job.steps;
                                steps.forEach((step: any) => {
                                    //console.log(`step ${cnt=cnt+1}`);

                                    if (step.task==='ExpressV2Internal@1'&& step.inputs) {
                                        const inputValues = step.inputs;
                                        if (inputValues && inputValues.RolloutSpecPath) {
                                            const filePath = inputValues['RolloutSpecPath'];
                                            const lastSlashIndex = filePath.lastIndexOf('/');

                                            // // Find the index of '.RolloutSpec.Test.json'
                                            // const suffixIndex = filePath.toLowerCase().lastIndexOf('.rolloutspec.json');
                                            let file: string = "";
                                            if (lastSlashIndex !== -1 && folderPath) {
                                                // const prefix = filePath.substring(lastSlashIndex + 1);
                                                // file = path.join(folderPath, lastSlashIndex);
                                                // console.log(prefix);
                                                 file=path.join(folderPath, filePath.substring(lastSlashIndex+1)); 
                                            } else {
                                                // const prefix = "";
                                                // if (folderPath) {
                                                    // file = path.join(folderPath, 'servicemodel.json');
                                                 console.log('no directory path found');

                                            }
                                            const serviceModelPath=processRolloutspecFile(file);
                                            let subscriptionId: string []=[];       //azure ids from the service model JSON file
                                            let sMfilepath="";
                                            if(folderPath)
                                            { sMfilepath=path.join(folderPath,serviceModelPath);}
                                            subscriptionId = processJsonFile(sMfilepath);
                                            console.log(`length of id arr: ${subscriptionId.length}`);
                                            if (subscriptionId.length>0) {
                                                console.log("Azure subscription ids", subscriptionId);
                                                let isFound=true;
                                                for( let k=0;k<subscriptionId.length;k++){
                                                    if(!azureSubId.includes(subscriptionId[k])){
                                                        console.log(`does match? ${subscriptionId[k]} and ${azureSubId}`);
                                                        isFound=false;
                                                        break;
                                                    }

                                                }
                                                if(!isFound){
                                                    let message = `Error: Incorrect or missing Azure subscription id`;
                                                    if(subscriptionId.length===1){
                                                        message = `Error: Incorrect Azure subscription id. Do you mean \"${subscriptionId[0]}\" ?`;
                                                    }
                                                            const yamlLines = text.split('\n');
                                                            //let problemLine = 0;
                                                            let problemColumn=0;
                                                            for (let k = stageIndices[j]; k < stageIndices[j + 1]; k++) {
                                                                if (yamlLines[k].includes('azure_subscription_id')) {
                                                                    problemColumn=yamlLines[k].indexOf('azure_subscription_id');
                                                                    problemLine = k;
                                                                    console.log(problemLine);
        
                                                                    break;
                                                                }
                                                            }
                                                            const code='incorrectSubscriptionId';
                                                            const range = new vscode.Range(new vscode.Position(problemLine, problemColumn), new vscode.Position(problemLine, yamlLines[problemLine].length));
                                                           const diagnostic=new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error);
                                                           diagnostic.code=code;
                                                           diagnostics.push(diagnostic);
                                                }

                                            //     if (subscriptionId !== azureSubId) {
                                            //         const message = `Error: Incorrect Azure subscription id. Do you mean \"${subscriptionId}\" ?`;

                                            //         const yamlLines = text.split('\n');
                                            //         //let problemLine = 0;
                                            //         let problemColumn=0;
                                            //         for (let k = stageIndices[j]; k < stageIndices[j + 1]; k++) {
                                            //             if (yamlLines[k].includes(azureSubId)) {
                                            //                 problemColumn=yamlLines[k].indexOf(azureSubId);
                                            //                 problemLine = k;
                                            //                 console.log(problemLine);

                                            //                 break;
                                            //             }
                                            //         }
                                            //         const code='incorrectSubscriptionId';
                                            //         const range = new vscode.Range(new vscode.Position(problemLine, problemColumn), new vscode.Position(problemLine, yamlLines[problemLine].length));
                                            //        const diagnostic=new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error);
                                            //        diagnostic.code=code;
                                            //        diagnostics.push(diagnostic);
                                            //     }

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
                                             problemColumn = yamlLines[k].indexOf('steps');
                                            break;
                                        }
                                    }

                                    const range = new vscode.Range(new vscode.Position(problemLine, problemColumn), new vscode.Position(problemLine, yamlLines[problemLine].length));
                                    console.log(range);
                                    const diagnostic=new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error);
                                    diagnostic.code='missingDownload';
                                    diagnostics.push(diagnostic);
                                }
                                const taskNames = steps.map((step: any) => step.task);
                                if (taskNames.includes('ExpressV2Internal@1') && !taskNames.includes('prepare-deployment@1')) {
                                    const message = 'Error: Stages with environment `Test` requires a Prepare Deployment task before an Ev2 task.';

                                    // Find the line and column number where the issue is located
                                    const yamlLines = text.split('\n');
                                    let problemLine = 0;
                                     let problemColumn = 0;
                                    for (let k = stageIndices[j]; k < stageIndices[j + 1]; k++) {
                                        if (yamlLines[k].includes('ExpressV2Internal@1')) {
                                            problemColumn=yamlLines[k].indexOf('task:');
                                            problemLine = k;
                                            break;
                                        }
                                    }

                                    const range = new vscode.Range(new vscode.Position(problemLine, problemColumn), new vscode.Position(problemLine, yamlLines[problemLine].length));
                                    const diagnostic=new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error);
                                    diagnostic.code='missingPrepareDeploymentTask';
                                    diagnostics.push(diagnostic);
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
