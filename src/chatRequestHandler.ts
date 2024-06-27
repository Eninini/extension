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
const CAT_NAMES_COMMAND_ID = 'participant.namesInEditor';
let isCreate: boolean = false; let previousIntent = "Unknown";
export let handler: vscode.ChatRequestHandler;
export async function startChat() {
    try {
        const [model] = await vscode.lm.selectChatModels({ vendor: 'copilot', family: 'gpt-3.5-turbo' });
        if (model) {
             handler = async (request: vscode.ChatRequest, context: vscode.ChatContext, stream: vscode.ChatResponseStream, token: vscode.CancellationToken): Promise<void> => {
                let history = context.history;

                stream.button({
                    command: CAT_NAMES_COMMAND_ID,
                    title: vscode.l10n.t('Use Cat Names in Editor')
                });
                let lastRequest = null;
                let lastResponse = null;

                // Find the last request and response in history
                for (let i = context.history.length - 1; i >= 0; i--) {
                    const turn = context.history[i];
                    if (!lastResponse && 'response' in turn && turn.response) {
                        lastResponse = vscode.LanguageModelChatMessage.Assistant(`Assistant: ${turn.response.toString()}`);
                    }
                    if (!lastRequest && 'prompt' in turn) {
                        lastRequest = vscode.LanguageModelChatMessage.User(`User: ${turn.prompt} `);
                        break; // Stop once we've found the last request and response
                    }
                }

                // const messages = [];

                // Add the current request
                // messages.push(vscode.LanguageModelChatMessage.User(request.prompt));

    
                const messages = [
                    vscode.LanguageModelChatMessage.User('You are a m365 one branch release (MOBR) pipeline YAML assistant. Your questions should go from general to specific. User queries related to pipeline are be relevant to MOBR pipeline and not related to azure pipelines. Stick to the schema provided. Do not provide keys outside the sample YAMLs that will be provided. User provided keys may be added.')
                ];
                
                if (lastRequest) {messages.push(lastRequest);}
                if (lastResponse) {messages.push(lastResponse);}
                // messages.push(vscode.LanguageModelChatMessage.User(`${QnA}`));
                messages.push(vscode.LanguageModelChatMessage.User(`System: Use this json schema to create or modify a pipeline : ${schema}`));
                const previousMessages = context.history.filter(h => h instanceof vscode.ChatRequestTurn);
                // messages.push(...previousMessages.filter(h => h instanceof vscode.ChatRequestTurn).map(h => vscode.LanguageModelChatMessage.User(h.prompt)));
                // history.forEach(turn => {
                //     if ('prompt' in turn) {
                //         messages.push(vscode.LanguageModelChatMessage.User(turn.prompt));
                //     }
                //     if ('response' in turn && turn.response) { messages.push(vscode.LanguageModelChatMessage.Assistant(turn.response.toString())); }
                // });

                // const prompts=[
                //     vscode.LanguageModelChatMessage.User(request.prompt),
                //     vscode.LanguageModelChatMessage.User('Which intent label does the query belong to? Labels: 1. Create pipeline 2. Modify pipeline')
                // ];
                // let initialIntent='';
                // try {

                //     const chatResponse = await model.sendRequest(prompts, {}, token);
                // let iintent='';
                //     for await (const fragment of chatResponse.text) {
                //         iintent+=fragment;
                //     }
                // stream.button('Create pipeline', 'Create');
                // if(request.prompt.includes('Create')){
                //     isCreate=true;
                //     initialIntent='Create';
                // }
                // else if(request.prompt.includes('Modify')){
                //     isCreate=false;
                //     initialIntent='Modify';
                // }
                // } catch (err) {
                //     handleError(err, stream);
                // }
                let intent = "Unknown";
                //    if(isCreate) { 
                intent = await classifyPrompt(model, request.prompt, token, stream, previousMessages);
                if (intent === 'Unknown') {
                    intent = previousIntent;
                }
                // }

                previousIntent = intent;


                switch (intent) {
                    case "Model D":
                        messages.push(vscode.LanguageModelChatMessage.User('Create a pipeline for Model D.'));
                        messages.push(vscode.LanguageModelChatMessage.Assistant(` Please provide input values in the placeholders in the following MOBR pipeline- ${modelD}`));
                        messages.push(vscode.LanguageModelChatMessage.User('I want to create a pipeline with a stage named Test_Release which is a deployment stage. the azure id is abcdef-1234-678a-h6duhw7hj56t. It has 2 tasks. One is prepare-deployment@1 with usePat set to true. The other is a ExpressV2Internal@1 task with an Endpoint provider type. '));
                        messages.push(vscode.LanguageModelChatMessage.Assistant(` Here is the pipeline with the values you provided. ${outputYaml}`));
                        messages.push(vscode.LanguageModelChatMessage.User("##"));
                        // messages.push(vscode.LanguageModelChatMessage.User(' Create a pipeline for Model D.'));
                        // messages.push(vscode.LanguageModelChatMessage.Assistant(` Please provide input values in the placeholders in the following MOBR pipeline- ${modelD}`));
                        messages.push(vscode.LanguageModelChatMessage.User('I want to create a pipeline with a stage named Test_Release which is a deployment stage. the azure id is abcdef-1234-678a-h6duhw7hj56t. It has 2 tasks. One is prepare-deployment@1 with usePat set to true. The other is a ExpressV2Internal@1 task with an Endpoint provider type. '));
                        messages.push(vscode.LanguageModelChatMessage.Assistant(` Here is the pipeline with the values you provided.. Let me know if you need any changes.`));
                        messages.push(vscode.LanguageModelChatMessage.User("##"));
                        messages.push(vscode.LanguageModelChatMessage.User(`${request.prompt}`));
                        //         // messages.push(vscode.LanguageModelChatMessage.User('Use the input values, if provided and create a yaml based on the sample model d yaml and json schema'));
                        //         // try {

                        //         //     const chatResponse = await model.sendRequest(messages, {}, token);
                        //         //     for await (const fragment of chatResponse.text) {
                        //         //         stream.markdown(fragment);
                        //         //     }
                        //         //     console.log('Chat response:', chatResponse);
                        //         // } catch (err) {
                        //         //     handleError(err, stream);
                        //         // }


                        break;
                    case "COSMIC":
                        messages.push(vscode.LanguageModelChatMessage.User('User: Create a pipeline for cosmic service.'));
                        messages.push(vscode.LanguageModelChatMessage.Assistant(`This is a pipeline. Please provide input values in the placeholders in the following MOBR pipeline - ${COSMIC}. Let me know if you want to add more stages or change the values.`));
                        messages.push(vscode.LanguageModelChatMessage.User('User: Create a pipeline with a stage to be deployed in a test environment. Leave service tree id blank. the azure id is abcdef-1234-678a-h6duhw7hj56t. It has an ExpressV2Internal@1 task with inputs'));
                        messages.push(vscode.LanguageModelChatMessage.Assistant(` Here is the COSMIC pipeline with the values you provided. ${outputYamlCOSMIC}`));
                        messages.push(vscode.LanguageModelChatMessage.User(`User: ${request.prompt}`));
                        messages.push(vscode.LanguageModelChatMessage.User('##'));
                        messages.push(vscode.LanguageModelChatMessage.User("User: Create a pipeline with three stages. the first stage sets up the cosmic variables. A SDFRingRelease stage on production environment depends on the cosmic set up stage and a test stage to test ring release. All the stages are of type nonDeployment"));
                        messages.push(vscode.LanguageModelChatMessage.Assistant(` Here is the COSMIC pipeline with the values you provided. ${outputYamlMultiCOSMIC}`));
                        //        
                        messages.push(vscode.LanguageModelChatMessage.User(`${request.prompt}`));


                        //     //     break;
                        //     // case "COSMIC multi stage":
                        //         messages.push(vscode.LanguageModelChatMessage.User('User: Create a pipeline with multiple stages for a COSMIC service.'));
                        //         messages.push(vscode.LanguageModelChatMessage.User(`Assistant: Here is a sample pipeline with 3 stages. You may add more if needed. ${multiCOSMIC}`));
                        //         messages.push(vscode.LanguageModelChatMessage.User("User: Create a pipeline with three stages. the first stage sets up the cosmic variables. A SDFRingRelease stage on production environment depends on the cosmic set up stage and a test stage to test ring release. All the stages are of type nonDeployment"));
                        //         messages.push(vscode.LanguageModelChatMessage.User(`Assistant: Here is the pipeline with the values you provided. ${outputYamlMultiCOSMIC}`));  
                        //         messages.push(vscode.LanguageModelChatMessage.User(`User: ${request.prompt}`));
                        //         messages.push(vscode.LanguageModelChatMessage.User('Extract the input from the user and create a COSMIC multi stage mobr pipeline by filling these input values'));
                        //         // try {

                        //         //     const chatResponse = await model.sendRequest(messages, {}, token);
                        //         //     for await (const fragment of chatResponse.text) {
                        //         //         stream.markdown(fragment);
                        //         //     }
                        //         //     console.log('Chat response:', chatResponse);
                        //         // } catch (err) {
                        //         //     handleError(err, stream);
                        //         // }

                        break;
                    case "Add stage":
                        messages.push((lastResponse) ? lastResponse : vscode.LanguageModelChatMessage.Assistant('Please provide more details.'));
                        messages.push(vscode.LanguageModelChatMessage.User('User: Add a stage to the pipeline.'));
                        messages.push(vscode.LanguageModelChatMessage.Assistant('Please provide the stage details.'));
                        messages.push(vscode.LanguageModelChatMessage.User(`The stage is a deployment stage named Test_Release. The azure id is abcdef-1234-678a-h6duhw7hj56t. It has 2 tasks. One is prepare-deployment@1 with usePat set to true. The other is a ExpressV2Internal@1 task with an Endpoint provider type. `));
                        messages.push(vscode.LanguageModelChatMessage.Assistant(`Here is the pipeline with the added stage.`));     //add example yaml
                        messages.push(vscode.LanguageModelChatMessage.User(`${request.prompt}`));
                        messages.push(vscode.LanguageModelChatMessage.User('system: use the previous response YAML and add the asked stages and their details to it. You may use the json schema if required.'));
                        
                        //case "more info":
                        //markdown('Please provide kind of pipeline: model d or cosmic.');
                        //return "more info :e.g. ()question"
                    case "Add input values":
                        messages.push((lastRequest) ? lastRequest : vscode.LanguageModelChatMessage.User(""));
                        messages.push((lastResponse) ? lastResponse : vscode.LanguageModelChatMessage.Assistant('Please provide more details.'));
                        
                        messages.push(vscode.LanguageModelChatMessage.User('User: Add these details/input values to the pipeline.'));
                        messages.push(vscode.LanguageModelChatMessage.User('User: Service workload is SPO. Environment is production. EV2 rollout spec path IS ${PIPELINE}/path/to/roloutspec.json '));
                        messages.push(vscode.LanguageModelChatMessage.Assistant('Here is the pipeline with the added input values.'));  //add example yaml aso intent needed for changing
                    case "More info required":
                        stream.markdown('Please provide more details. For example, provide the kind of pipeline: Model D or COSMIC. If you are unsure, you can provide a sample input and I can help you classify it');

                        return;
                        // break;
                    case "Unknown":
                        stream.markdown("I'm sorry, I can only provide assistance for MOBR pipelines. Please provide a query related to MOBR pipelines.");
                        // messages.push(vscode.LanguageModelChatMessage.User(`User: ${request.prompt}`));
                        // messages.push(vscode.LanguageModelChatMessage.Assistant('Please provide more details.'));//say lacks info, provide examples, create for model d
                        // stream.button({
                        //     label: 'Create pipeline',
                        //     action: 'Create'
                        // });
                        return;
                    // case "YAML input"
                    //return;
                        // break;


                }

                try {

                    const chatResponse = await model.sendRequest(messages, {}, token);
                    for await (const fragment of chatResponse.text) {
                        stream.markdown(fragment);
                    }
                    console.log('Chat response:', chatResponse);
                } catch (err) {
                    handleError(err, stream);
                }           //move to different function





            };

            // const participant = vscode.chat.createChatParticipant('mobr-pipelines.mobr-pipelines', handler);
            vscode.window.showInformationMessage('MOBR Pipelines chat started!');
        }
    } catch (err: any) {
        vscode.window.showErrorMessage(`Failed to start chat: ${err.message}`);
    }
}
async function classifyPrompt(model: vscode.LanguageModelChat, prompt: string, token: vscode.CancellationToken, stream: vscode.ChatResponseStream, previousMessages: vscode.ChatRequestTurn[]): Promise<string> {
    const classificationMessage = [
        vscode.LanguageModelChatMessage.User('Which intent label does the query belong to? Labels: 1. Model D single stage 2. COSMIC  3. More information required 4. Unknown 5. Add stage 6. Add input values'),
        // vscode.LanguageModelChatMessage.User('Intents: \" Model D single stage\", \"COSMIC single stage\",\" COSMIC multi stage\",\"Unclear\"'),

    ];
    //train this more
    classificationMessage.push(vscode.LanguageModelChatMessage.User(`This is my pipeline ${COSMIC}. `));        //how does this get forwarded as cosmic?
    classificationMessage.push(vscode.LanguageModelChatMessage.Assistant(`Intent is COSMIC`));
    classificationMessage.push(vscode.LanguageModelChatMessage.User(`COSMIC multi stage (more than one stages) pipeline : ${multiCOSMIC}. `));
    classificationMessage.push(vscode.LanguageModelChatMessage.Assistant(`Intent is COSMIC`));
    classificationMessage.push(vscode.LanguageModelChatMessage.User(`Model D pipeline for reference: ${modelD}`));
    classificationMessage.push(vscode.LanguageModelChatMessage.Assistant(`Intent is Model D`));
    classificationMessage.push(vscode.LanguageModelChatMessage.User(`Create a pipeline for Model D services`));
    classificationMessage.push(vscode.LanguageModelChatMessage.Assistant(`Intent is Model D`));
    classificationMessage.push(vscode.LanguageModelChatMessage.User(`Create a pipeline for COSMIC or Model D2 services`));
    classificationMessage.push(vscode.LanguageModelChatMessage.Assistant(`Intent is COSMIC`));
    classificationMessage.push(vscode.LanguageModelChatMessage.User(`Add a stage to the pipeline`));
    classificationMessage.push(vscode.LanguageModelChatMessage.Assistant(`Intent is Add stage`));
    classificationMessage.push(vscode.LanguageModelChatMessage.User(`In the pipeline, change service tree id to xxxxxx-xxxx-xxxx-xxxx-123456789123`));
    classificationMessage.push(vscode.LanguageModelChatMessage.Assistant(`Intent is Add input values`));
    classificationMessage.push(vscode.LanguageModelChatMessage.User(`What colour is the sky?`));
    classificationMessage.push(vscode.LanguageModelChatMessage.Assistant(`Intent is Unknown`));
    classificationMessage.push(vscode.LanguageModelChatMessage.User(`query: ${prompt}`));
    try {
        classificationMessage.unshift(...previousMessages.filter(h => h instanceof vscode.ChatRequestTurn).map(h => vscode.LanguageModelChatMessage.User(h.prompt)));

        const classificationResponse = await model.sendRequest(classificationMessage, {}, token);
        let classification = '';
        for await (const fragment of classificationResponse.text) {
            classification += fragment;
        }
        console.log('classification', classification);
        if (classification.includes('Model D')) {
            // stream.markdown(`Please provide the input values in the following so that I can create a pipeline for you: \'\'\'yaml\n ${modelD} \n\'\'\'`);

            return "Model D";
        }
        else if (classification.includes('COSMIC')) {
            return "COSMIC";
        }
        else if (classification.includes('More information required')) {
            return "More Info required";
        }
        else if(classification.includes('Add stage')){
            return "Add stage";
        }
        else if(classification.includes('Add input values')){
            return "Add input values";
        }
        else {
            return "Unknown";
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

