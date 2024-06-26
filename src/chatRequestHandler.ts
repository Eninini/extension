import * as vscode from 'vscode';
import * as path from 'path';
import * as yaml from 'js-yaml';

const schemaFileName = "compactSchema.txt";
console.log(__dirname);
const schemaFilePath = path.join(__dirname, '..', 'promptSupport', schemaFileName);
console.log('Schema file path:', schemaFilePath);
const fs = require('fs');
const schema = fs.readFileSync(schemaFilePath, 'utf8');

const sampleModelD = "singleStageModelD.yml";
const filePathModelD = path.join(__dirname, '..', 'sampleYAMLs', sampleModelD);
const fsModelD = require('fs');
const modelD = fsModelD.readFileSync(filePathModelD, 'utf8');
const outputYaml = fsModelD.readFileSync(path.join(__dirname, '..', 'sampleYAMLs', 'exampleOutputModelD.yml'), 'utf8');
// console.log(modelD);

const singleStageCOSMIC = "singleStageCOSMIC.yml";
const filePathCOSMIC = path.join(__dirname, '..', 'sampleYAMLs', singleStageCOSMIC);
const fsCOSMIC = require('fs');
const COSMIC = fsCOSMIC.readFileSync(filePathCOSMIC, 'utf8');
const outputYamlCOSMIC = fsCOSMIC.readFileSync(path.join(__dirname, '..', 'sampleYAMLs', 'exampleOutputCOSMIC.yml'), 'utf8');

const multiStageCOSMIC = "multiStageCOSMIC.yml";
const filePathMultiCOSMIC = path.join(__dirname, '..', 'sampleYAMLs', multiStageCOSMIC);
const fsMultiCOSMIC = require('fs');
const multiCOSMIC = fsMultiCOSMIC.readFileSync(filePathMultiCOSMIC, 'utf8');
const outputYamlMultiCOSMIC = fsMultiCOSMIC.readFileSync(path.join(__dirname, '..', 'sampleYAMLs', 'exampleOutputMultiCOSMIC.yml'), 'utf8');


export async function startChat() {
    try {
        const [model] = await vscode.lm.selectChatModels({ vendor: 'copilot', family: 'gpt-3.5-turbo' });
        if (model) {
            const handler: vscode.ChatRequestHandler = async (request: vscode.ChatRequest, context: vscode.ChatContext, stream: vscode.ChatResponseStream, token: vscode.CancellationToken): Promise<void> => {
                let history = context.history;

                const messages = [
                    vscode.LanguageModelChatMessage.User('You are a m365 one branch release (MOBR) pipeline YAML assistant. These pipelines extend the Governed Template. Assume that questions related to pipeline are be relevant to MOBR pipeline and not related to azure pipelines. Stick to the schema provided. Do not provide keys outside the sample YAMLs that will be provided. User provided keys may be added.'),
                ];
                messages.push(vscode.LanguageModelChatMessage.User(`Here is the json schema for a MOBR yaml with dependencies and required fields: ${schema}`));
                const previousMessages = context.history.filter(h => h instanceof vscode.ChatRequestTurn);
                messages.push(...previousMessages.filter(h => h instanceof vscode.ChatRequestTurn).map(h => vscode.LanguageModelChatMessage.User(h.prompt)));
                
                const intent = await classifyPrompt(model, request.prompt, token, previousMessages);


                switch (intent) {
                    case "Model D":
                        messages.push(vscode.LanguageModelChatMessage.User('User: Create a pipeline.'));
                        messages.push(vscode.LanguageModelChatMessage.User(`Assistant: Here is a sample pipeline- ${modelD}`));
                        messages.push(vscode.LanguageModelChatMessage.User('User: I want to create a pipeline with a stage named Test_Release which is a deployment stage. the azure id is abcdef-1234-678a-h6duhw7hj56t. It has 2 tasks. One is prepare-deployment@1 with usePat set to true. The other is a ExpressV2Internal@1 task with an Endpoint provider type. '));
                        messages.push(vscode.LanguageModelChatMessage.User(`Assistant: Here is the pipeline with the values you provided. ${outputYaml}`));
                        messages.push(vscode.LanguageModelChatMessage.User(`User: ${request.prompt}`));
                        // messages.push(vscode.LanguageModelChatMessage.User('Use the input values, if provided and create a yaml based on the sample model d yaml and json schema'));


                        break;
                    case "COSMIC single stage":
                        messages.push(vscode.LanguageModelChatMessage.User('User: Create a pipeline for COSMIC service.'));
                        messages.push(vscode.LanguageModelChatMessage.User(`Assistant: Here is a sample single stage pipeline - ${COSMIC}`));
                        messages.push(vscode.LanguageModelChatMessage.User('User: Create a pipeline with a stage to be deployed in a test environment. Leave service tree id blank. the azure id is abcdef-1234-678a-h6duhw7hj56t. It has an ExpressV2Internal@1 task with inputs'));
                        messages.push(vscode.LanguageModelChatMessage.User(`Assistant: Here is the pipeline with the values you provided. ${outputYamlCOSMIC}`));
                        messages.push(vscode.LanguageModelChatMessage.User(`User: ${request.prompt}`));
                      
                        break;
                    case "COSMIC multi stage":
                        messages.push(vscode.LanguageModelChatMessage.User('User: Create a pipeline with multiple stages for a COSMIC service.'));
                        messages.push(vscode.LanguageModelChatMessage.User(`Assistant: Here is a sample pipeline with 3 stages. You may add more if needed. ${multiCOSMIC}`));
                        messages.push(vscode.LanguageModelChatMessage.User("User: Create a pipeline with three stages. the first stage sets up the cosmic variables. A SDFRingRelease stage on production environment depends on the cosmic set up stage and a test stage to test ring release. All the stages are of type nonDeployment"));
                        messages.push(vscode.LanguageModelChatMessage.User(`Assistant: Here is the pipeline with the values you provided. ${outputYamlMultiCOSMIC}`));  
                        messages.push(vscode.LanguageModelChatMessage.User(`User: ${request.prompt}`));
                        messages.push(vscode.LanguageModelChatMessage.User('Extract the input from the user and create a COSMIC multi stage mobr pipeline by filling these input values'));
                       
                        break;
                    case "other":
                        // stream.markdown(intent);
                        messages.push(vscode.LanguageModelChatMessage.User(`User: ${request.prompt}`));
                        messages.push(vscode.LanguageModelChatMessage.User('Ask user for more context.'));
                        break;
                   
                        
                }

                try {

                    const chatResponse = await model.sendRequest(messages, {}, token);
                    for await (const fragment of chatResponse.text) {
                        stream.markdown(fragment);
                    }
                    console.log('Chat response:', chatResponse);
                } catch (err) {
                    handleError(err, stream);
                }





            };

            const participant = vscode.chat.createChatParticipant('mobr-pipelines.mobr-pipelines', handler);
            vscode.window.showInformationMessage('MOBR Pipelines chat started!');
        }
    } catch (err: any) {
        vscode.window.showErrorMessage(`Failed to start chat: ${err.message}`);
    }
}
async function classifyPrompt(model: vscode.LanguageModelChat, prompt: string, token: vscode.CancellationToken, previousMessages: vscode.ChatRequestTurn[]): Promise<string> {
    const classificationMessage = [
        vscode.LanguageModelChatMessage.User('Classify the following prompt and determine if it is related to which one of the following intent:'),
        vscode.LanguageModelChatMessage.User('\" Model D single stage\", \"COSMIC single stage\",\" COSMIC multi stage\",\"other\"'),

    ];
    classificationMessage.push(vscode.LanguageModelChatMessage.User(`reference: sample yaml for a single stage pipeline for COSMIC: ${COSMIC}. If the input values are related to this, or prompt includes COSMIC then the prompt is related to COSMIC single stage pipeline. `));
    classificationMessage.push(vscode.LanguageModelChatMessage.User(`reference: sample yaml for a multi stage pipeline for COSMIC: ${multiCOSMIC}. If the input values are related to this, or there is a mention of 2 and more stages, or COSMIC, then the prompt is related to COSMIC multi stage pipeline. There may be more stages. `));
    classificationMessage.push(vscode.LanguageModelChatMessage.User(`reference: sample yaml for single stage Model D pipeline: ${modelD}`));
    classificationMessage.push(vscode.LanguageModelChatMessage.User(`prompt: ${prompt}`));
    try {
                classificationMessage.unshift(...previousMessages.filter(h => h instanceof vscode.ChatRequestTurn).map(h => vscode.LanguageModelChatMessage.User(h.prompt)));
                
        const classificationResponse = await model.sendRequest(classificationMessage, {}, token);
        let classification = '';
        for await (const fragment of classificationResponse.text) {
            classification += fragment;
        }
        console.log('Assistant:', classification);
        if (classification.includes('Model D')) {
            return "Model D";
        }
        else if (classification.includes('COSMIC single stage')) {
            return "COSMIC single stage";
        }
        else if (classification.includes('COSMIC multi stage')) {
            return "COSMIC multi stage";
        }
        else {
            return "other";
        }
    } catch (err: any) {
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