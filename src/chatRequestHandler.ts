import * as vscode from 'vscode';
import * as path from 'path';
import * as yaml from 'js-yaml';

const schemaFileName = "mobrcopy.json";
console.log(__dirname);
const schemaFilePath = path.join(__dirname, '..', 'schemas', schemaFileName);
console.log('Schema file path:', schemaFilePath);
const fs = require('fs');
const schema = fs.readFileSync(schemaFilePath, 'utf8');

const sampleModelD = "singleStageModelD.yml";
const filePathModelD = path.join(__dirname, '..', 'sampleYAMLs', sampleModelD);
const fsModelD = require('fs');
const modelD = fsModelD.readFileSync(filePathModelD, 'utf8');
console.log(modelD);
const singleStageCOSMIC = "singleStageCOSMIC.yml";
const filePathCOSMIC = path.join(__dirname, '..', 'sampleYAMLs', singleStageCOSMIC);
const fsCOSMIC = require('fs');
const COSMIC = fsCOSMIC.readFileSync(filePathCOSMIC, 'utf8');

const multiStageCOSMIC = "multiStageCOSMIC.yml";
const filePathMultiCOSMIC = path.join(__dirname, '..', 'sampleYAMLs', multiStageCOSMIC);
const fsMultiCOSMIC = require('fs');
const multiCOSMIC = fsMultiCOSMIC.readFileSync(filePathMultiCOSMIC, 'utf8');

const yamlObject1 = yaml.load(modelD);
const Object1 = {
    data: yamlObject1,
    metadata: {
        fileName: 'singleStageModelD.yml',
        fileType: 'yaml'
    }
};
const yamlObject2 = yaml.load(COSMIC); // Assuming 'yaml' library is used for parsing
        const Object2 = {
            data: yamlObject2,
            metadata: {
                fileName: 'singleStageCOSMIC.json',
                fileType: 'json'
            }
        };
const yamlObject3 = yaml.load(multiCOSMIC); // Assuming 'yaml' library is used for parsing
        const Object3 = {
            data: yamlObject3,
            metadata: {
                fileName: 'multiStageCOSMIC.json',
                fileType: 'json'
            }
        };

export async function startChat() {
    try {
        const [model] = await vscode.lm.selectChatModels({ vendor: 'copilot', family: 'gpt-3.5-turbo' });
        if (model) {
            const handler: vscode.ChatRequestHandler = async (request: vscode.ChatRequest, context: vscode.ChatContext, stream: vscode.ChatResponseStream, token: vscode.CancellationToken): Promise<void> => {
                let history = context.history;
                
                const messages = [
                    vscode.LanguageModelChatMessage.User('You are a m365 one branch release (MOBR) pipeline YAML assistant. These pipelines extend the Governed Template. Avoid giving answers related to azure pipelines. Stick to the schema provided only.'),
                    vscode.LanguageModelChatMessage.User('Here is the json schema for a MOBR yaml with dependencies and required fields: ', schema),
                ];
                vscode.LanguageModelChatMessage.User(request.prompt);
                const intent = await classifyPrompt(model, request.prompt,token);


                   switch (intent) {
                    case "Model D":
                       messages.push(vscode.LanguageModelChatMessage.User(request.prompt));

                        // const previousMessages = context.history.filter(h => h instanceof vscode.ChatRequestTurn && h.prompt.includes('Model D'));
                        // messages.unshift(...previousMessages.filter(h => h instanceof vscode.ChatRequestTurn).map(h => vscode.LanguageModelChatMessage.User(h.prompt)));
                        messages.push(vscode.LanguageModelChatMessage.User(`Use the input values, if provided and create a yaml based on the sample model d yaml and json schema`));
                        try {
                        
                            const chatResponse = await model.sendRequest(messages, {}, token);
                            for await (const fragment of chatResponse.text) {
                                stream.markdown(fragment);
                            }
                            console.log('Chat response:', chatResponse);
                        } catch (err) {
                            handleError(err, stream);
                        }
                        break;
                    case "COSMIC single stage":
                        messages.push(vscode.LanguageModelChatMessage.User(request.prompt));
                        // const previousMessagesCOSMIC = context.history.filter(h => h instanceof vscode.ChatRequestTurn && h.prompt.includes('COSMIC single stage'));
                        // messages.unshift(...previousMessagesCOSMIC.filter(h => h instanceof vscode.ChatRequestTurn).map(h => vscode.LanguageModelChatMessage.User(h.prompt)));
                        messages.push(vscode.LanguageModelChatMessage.User(`Extract the input from the user and create a COSMIC single stage mobr pipeline by filling these input values`));
                        try {
                            const chatResponse = await model.sendRequest(messages, {}, token);
                            for await (const fragment of chatResponse.text) {
                                stream.markdown(fragment);
                            }
                        } catch (err) {
                            handleError(err, stream);
                        }
                        break;
                    case "COSMIC multi stage":
                        messages.push(vscode.LanguageModelChatMessage.User(request.prompt));
                        // const previousMessagesCOSMICMulti = context.history.filter(h => h instanceof vscode.ChatRequestTurn && h.prompt.includes('COSMIC multi stage'));
                        // messages.unshift(...previousMessagesCOSMICMulti.filter(h => h instanceof vscode.ChatRequestTurn).map(h => vscode.LanguageModelChatMessage.User(h.prompt)));
                        messages.push(vscode.LanguageModelChatMessage.User(`Extract the input from the user and create a COSMIC multi stage mobr pipeline by filling these input values`));
                        try {
                            const chatResponse = await model.sendRequest(messages, {}, token);
                            for await (const fragment of chatResponse.text) {
                                stream.markdown(fragment);
                            }
                        } catch (err) {
                            handleError(err, stream);
                        }
                        break;
                   }
        
                
               
                
            };

            const participant = vscode.chat.createChatParticipant('mobr-pipelines.mobr-pipelines', handler);
            vscode.window.showInformationMessage('MOBR Pipelines chat started!');
        }
    } catch (err: any) {
        vscode.window.showErrorMessage(`Failed to start chat: ${err.message}`);
    }
}
async function classifyPrompt(model: vscode.LanguageModelChat, prompt: string, token: vscode.CancellationToken): Promise<string> {
    const classificationMessage = [
        vscode.LanguageModelChatMessage.User('Classify the following prompt and determine if it is related to which one of the following intent:'),
        vscode.LanguageModelChatMessage.User('1. Model D single stage or 2. COSMIC single stage pipeline or 3. COSMIC multi stage pipeline'),
        
    ];
    // const previousMessages = history.filter(h => h instanceof vscode.ChatRequestTurn);
    // classificationMessage.unshift(...previousMessages.map(h => vscode.LanguageModelChatMessage.User(h.prompt)));
    const summarized=[
        vscode.LanguageModelChatMessage.User(`summarize and extract only the keys from the following. Make it concise:  sample yaml for a single stage pipeline for model D service: ${modelD}`)
    ];
    try {
        const summarizedModelD = await model.sendRequest(summarized, {}, token);
        let summarizedText = '';
        for await (const fragment of summarizedModelD.text) {
            summarizedText += fragment;
        }
        console.log(summarizedText);
        classificationMessage.push(vscode.LanguageModelChatMessage.User(`${summarizedText}. If the input values are related to this, then the prompt is related to Model D single stage pipeline. prompt: ${prompt} `));

    } catch (err:any) {
        console.error('Error occurred during summarization:', err);
        return `Error: ${err.message}`;
    }
    // classificationMessage.push(vscode.LanguageModelChatMessage.User(` sample yaml for a single stage pipeline for COSMIC: ${Object2}. If the input values are related to this, then the prompt is related to COSMIC single stage pipeline. `));
    // classificationMessage.push(vscode.LanguageModelChatMessage.User(` sample yaml for a multi stage pipeline for COSMIC: ${Object3}. If the input values are related to this, then the prompt is related to COSMIC multi stage pipeline. There may be more stages. `));
    try {
        const classificationResponse = await model.sendRequest(classificationMessage, {}, token);
        let classification = '';
        for await (const fragment of classificationResponse.text) {
            classification += fragment;
        }
        console.log('Classification:', classification);
        if (classification.includes('Model D')) {
            return "Model D";
        }
        else if(classification.includes('COSMIC single stage')) {
            return "COSMIC single stage";
        }
        else if(classification.includes('COSMIC multi stage')) {
            return "COSMIC multi stage";
        }
        else {
            return 'None';
        }
    } catch (err:any) {
        console.error('Error occurred during classification:', err);
        return `Error: ${err.message}`;
    }
}

export function handleError(err: any, stream: vscode.ChatResponseStream): void {
    if (err instanceof vscode.LanguageModelError) {
        stream.markdown(`Error: ${err.message}`);
    } else {
        throw err;
    }
}