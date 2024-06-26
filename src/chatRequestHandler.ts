import * as vscode from 'vscode';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { extractKeyValues } from './objectsInTheYAMLs';

const schemaFileName = "compactSchema.txt";
console.log(__dirname);
const schemaFilePath = path.join(__dirname, '..', 'promptSupport', schemaFileName);
console.log('Schema file path:', schemaFilePath);
const fs = require('fs');
const schema = fs.readFileSync(schemaFilePath, 'utf8');

const sampleModelD = "singleStageModelD.yml";
const filePathModelD = path.join(__dirname, '..', 'sampleYAMLs', sampleModelD);
const fsModelD = require('fs');
export const modelD = fsModelD.readFileSync(filePathModelD, 'utf8');
const outputYaml = fsModelD.readFileSync(path.join(__dirname, '..', 'sampleYAMLs', 'exampleOutputModelD.yml'), 'utf8');
// console.log(modelD);


const singleStageCOSMIC = "singleStageCOSMIC.yml";
const filePathCOSMIC = path.join(__dirname, '..', 'sampleYAMLs', singleStageCOSMIC);
const fsCOSMIC = require('fs');
export const COSMIC = fsCOSMIC.readFileSync(filePathCOSMIC, 'utf8');
const outputYamlCOSMIC = fsCOSMIC.readFileSync(path.join(__dirname, '..', 'sampleYAMLs', 'exampleOutputCOSMIC.yml'), 'utf8');

const multiStageCOSMIC = "multiStageCOSMIC.yml";
const filePathMultiCOSMIC = path.join(__dirname, '..', 'sampleYAMLs', multiStageCOSMIC);
const fsMultiCOSMIC = require('fs');
export const multiCOSMIC = fsMultiCOSMIC.readFileSync(filePathMultiCOSMIC, 'utf8');
const outputYamlMultiCOSMIC = fsMultiCOSMIC.readFileSync(path.join(__dirname, '..', 'sampleYAMLs', 'exampleOutputMultiCOSMIC.yml'), 'utf8');
const addStageMultiCOSMIC = fsMultiCOSMIC.readFileSync(path.join(__dirname, '..', 'sampleYAMLs', 'addStageToMultiCOSMIC.yml'), 'utf8');
export let isCreate: boolean = false; let previousIntent = "Unknown"; let i = 0;
let createPipeline: vscode.LanguageModelChatMessage[] = [];
export let isModify: boolean = false;
// export let handler: vscode.ChatRequestHandler;
// export async function startChat() {
interface SessionState {
    currentQuestionIndex: number;
    numberOfStages?: number;
    stagesCollected: string[];
}
interface ModifyPipeline {
    addStage: boolean;
    updateStage: boolean;
}
let sessionState: SessionState | null = null;
let modifyPipeline: ModifyPipeline | null = null;
const questions = [
    "What kind of service do you want to deploy the pipeline to?",
    "Enter service tree id",
    "Enter service workload",
    "Enter build pipeline",
    "Enter number of stages in the pipeline",
    "Enter stage name"
];

// }
let numStage = 0;
export const handler = async (request: vscode.ChatRequest, context: vscode.ChatContext, stream: vscode.ChatResponseStream, token: vscode.CancellationToken): Promise<any> => {
    const [model] = await vscode.lm.selectChatModels({ vendor: 'copilot', family: 'gpt-3.5-turbo' });
    if (model) {
        if (request.command === 'create') {     //classification of the prompt, only when session state is null
            // isCreate = true;
            // if (!sessionState) {
                sessionState = {
                    currentQuestionIndex: -1,
                    numberOfStages: 0,
                    stagesCollected: []
                };
                createPipeline=[];
            // }
            createPipeline.push(vscode.LanguageModelChatMessage.User(`Identify the key value pairs from the questions and user inputs. Use the example conversation as follows:`));
            createPipeline.push(vscode.LanguageModelChatMessage.Assistant(questions[0]));
            createPipeline.push(vscode.LanguageModelChatMessage.User("COSMIC"));
            createPipeline.push(vscode.LanguageModelChatMessage.Assistant(questions[1]));
            createPipeline.push(vscode.LanguageModelChatMessage.User("the id is xxxxxx-xxxx-xxxx-xxxx-123456789123"));
            createPipeline.push(vscode.LanguageModelChatMessage.Assistant(questions[2]));
            createPipeline.push(vscode.LanguageModelChatMessage.User("workload is Substrate"));
            createPipeline.push(vscode.LanguageModelChatMessage.Assistant(questions[3]));
            createPipeline.push(vscode.LanguageModelChatMessage.User("the source from where i downloaded is PrimaryArtifacts"));
            createPipeline.push(vscode.LanguageModelChatMessage.Assistant(questions[4]));
            createPipeline.push(vscode.LanguageModelChatMessage.User("2"));
            createPipeline.push(vscode.LanguageModelChatMessage.Assistant(questions[5]));
            createPipeline.push(vscode.LanguageModelChatMessage.User("Test_release"));
            createPipeline.push(vscode.LanguageModelChatMessage.Assistant(questions[5]));
            createPipeline.push(vscode.LanguageModelChatMessage.User("Prod_release"));
            // createPipeline.push(vscode.LanguageModelChatMessage.Assistant(questions[5]));
            createPipeline.push(vscode.LanguageModelChatMessage.User("the first stage is Test_deploy. the second stage is Prod_deploy"));
            createPipeline.push(vscode.LanguageModelChatMessage.Assistant("Here are the key value pairs from the user input: \n intent: COSMIC \n serviceTreeId: xxxxxx-xxxx-xxxx-xxxx-123456789123 \n service_workload: Substrate \n build_pipeline: PrimaryArtifacts \nnumber_of_stages: 2  \n stage_name[0]: Test_release \n stage_name[1]: Prod_release\n\n "));
            createPipeline.push(vscode.LanguageModelChatMessage.User("##"));
            // return {metadata:{command: 'create'}};
            // return;

        }

        else if (request.command === 'modify') {
            isModify = true;
        }

        // try{

        // }
        // catch(err){
        //     handleError(err, stream);
        // }

        // while (sessionState&&sessionState.currentQuestionIndex===5&&numStage <= sessionState.numberOfStages) {
        //     // Ask for the stage name
        //     stream.markdown(questions[5]); // "Enter stage name"
        //     // Logic to capture the user's response and store it in stagesCollected
        //     sessionState.stagesCollected.push(/* user's response */);
        //     sessionState.currentQuestionIndex++;
        // }
        //Issue: answer to present question is in the next prompt 
        try {
            if (sessionState && sessionState.currentQuestionIndex !== -1 && sessionState.currentQuestionIndex < questions.length) {
                //question to which the current answer belongs
                const currentQuestion = questions[sessionState.currentQuestionIndex];
                //ask the next question

                createPipeline.push(vscode.LanguageModelChatMessage.Assistant(currentQuestion));
                createPipeline.push(vscode.LanguageModelChatMessage.User(request.prompt));
                console.log('current question:', currentQuestion);
                console.log(request.prompt);
                // Handle specific questions based on current index
                switch (currentQuestion) {
                    case "Enter number of stages in the pipeline":
                        // if (sessionState.currentQuestionIndex === 4) {
                        // Handle input for number of stages
                        const num = request.prompt.match(/\d+/);
                        sessionState.numberOfStages = num ? parseInt(num[0]) : 0;
                        // sessionState.currentQuestionIndex++;
                        break; // Exit switch to avoid immediate increment
                    // }
                    // break;
                    case "Enter stage name":
                        if (sessionState.currentQuestionIndex === 5 && sessionState.numberOfStages) {
                            // Handle input for stage names dynamically
                            sessionState.stagesCollected.push(request.prompt);
                            if (sessionState.stagesCollected.length < sessionState.numberOfStages) {
                                stream.markdown(questions[5]); // "Enter stage name" since it is not reaching end of flow
                                return; // Exit switch to avoid immediate increment
                            }
                        }
                        break;
                    default:
                        break;
                }

            }
            //last question answer has to be processed separately
            // if(sessionState&&sessionState.currentQuestionIndex>=questions.length){
            //     // All questions answered, process and reset state
            //     createPipeline.push(vscode.LanguageModelChatMessage.Assistant(questions[questions.length-1]));
            //     createPipeline.push(vscode.LanguageModelChatMessage.User(request.prompt));
            //     const chatResponse = await model.sendRequest(createPipeline, {}, token);
            //     let keyValuePairs = "";
            //     for await (const fragment of chatResponse.text) {
            //         keyValuePairs += fragment;
            //     }
            //     const jsonOutput = extractKeyValues(keyValuePairs);
            //     const yamlString = yaml.dump(jsonOutput);
            //     stream.markdown(`\`\`\`\n${yamlString}\n\`\`\``);
            //     console.log('create response', chatResponse);

            //     // Reset session state after processing
            //     sessionState = null;
            //     createPipeline = [];
            // }
        } catch (err) {
            handleError(err, stream);
        }

        if (sessionState) {
            sessionState.currentQuestionIndex++;
            if (sessionState.currentQuestionIndex < questions.length) {
                stream.markdown(questions[sessionState.currentQuestionIndex]);
                return;
            }
            else if (sessionState.currentQuestionIndex >= questions.length) {
                // All questions answered, process and reset state
                // createPipeline.push(vscode.LanguageModelChatMessage.Assistant(questions[questions.length - 1]));
                // createPipeline.push(vscode.LanguageModelChatMessage.User(request.prompt));
                const chatResponse = await model.sendRequest(createPipeline, {}, token);
                let keyValuePairs = "";
                for await (const fragment of chatResponse.text) {
                    keyValuePairs += fragment;
                }
                const jsonOutput = extractKeyValues(keyValuePairs);
                const yamlString = yaml.dump(jsonOutput);
                stream.markdown(`\`\`\`\n${yamlString}\n\`\`\``);
                console.log('create response', keyValuePairs);

                // Reset session state after processing
                sessionState = null;
                createPipeline = [];
            }

        }

        //  if(isCreate){
        //     createPipeline.push(vscode.LanguageModelChatMessage.User(request.prompt));

        //     if(markdown(i, stream)!=="done"){
        //         i++;
        //         return;
        //     }


        //     i=0; isCreate=false;

        //     try{


        //         const chatResponse = await model.sendRequest(createPipeline, {}, token);
        //         let keyValuePairs="";
        //         for await (const fragment of chatResponse.text) {
        //             keyValuePairs+=fragment;
        //             // stream.markdown(fragment);
        //         }
        //         const jsonOutput=extractKeyValues(keyValuePairs);

        //         const yamlString = yaml.dump(jsonOutput);
        //         stream.markdown(`\`\`\`\n${yamlString}\n\`\`\``);
        //         console.log('create response', chatResponse);

        //     }
        //     catch(err){
        //         handleError(err, stream);
        //     }

        //     createPipeline=[];
        //     return;

        // //  }
        //  else if(isModify){

        //  }


        // let history = context.history;


        // let lastRequest = null;
        // let lastResponse = null;

        // // Find the last request and response in history
        // for (let i = context.history.length - 1; i >= 0; i--) {
        //     const turn = context.history[i];
        //     if (!lastResponse && 'response' in turn && turn.response) {
        //         lastResponse = vscode.LanguageModelChatMessage.Assistant(` ${turn.response.toString()}`);
        //     }
        //     if (!lastRequest && 'prompt' in turn) {
        //         lastRequest = vscode.LanguageModelChatMessage.User(` ${turn.prompt} `);
        //         break; // Stop once we've found the last request and response
        //     }
        // }






    };

    // const participant = vscode.chat.createChatParticipant('mobr-pipelines.mobr-pipelines', handler);
};


async function classifyPrompt(model: vscode.LanguageModelChat, prompt: string, token: vscode.CancellationToken, stream: vscode.ChatResponseStream, previousMessages: vscode.ChatRequestTurn[]): Promise<string> {
    const classificationMessage = [
        vscode.LanguageModelChatMessage.User('Which intent label does the query belong to? Labels: 1. Model D single stage 2. COSMIC  3. More information required 4. Unknown 5. Add stage 6. Add input values'),
        // vscode.LanguageModelChatMessage.User('Intents: \" Model D single stage\", \"COSMIC single stage\",\" COSMIC multi stage\",\"Unclear\"'),
//explicitly tell it to answer in one word
    ];
    //train this more
    // classificationMessage.push(vscode.LanguageModelChatMessage.User(`This is my pipeline ${COSMIC}. `));        //how does this get forwarded as cosmic?
    classificationMessage.push(vscode.LanguageModelChatMessage.Assistant(`Intent is COSMIC`));
    classificationMessage.push(vscode.LanguageModelChatMessage.User(`##`));

    // classificationMessage.push(vscode.LanguageModelChatMessage.User(`COSMIC multi stage (more than one stages) pipeline : ${multiCOSMIC}. Look for the presence of keys in the user input and match with the above. you should be able to tell the intent from the user YAML`));
    classificationMessage.push(vscode.LanguageModelChatMessage.Assistant(`Intent is COSMIC`));
    classificationMessage.push(vscode.LanguageModelChatMessage.User(`##`));

    // classificationMessage.push(vscode.LanguageModelChatMessage.User(`Model D pipeline for reference: ${modelD}. Look for the presence of keys in the user input and match with the above. you should be able to tell the intent from the user YAML`));
    classificationMessage.push(vscode.LanguageModelChatMessage.Assistant(`Intent is Model D`));
    classificationMessage.push(vscode.LanguageModelChatMessage.User(`##`));

    classificationMessage.push(vscode.LanguageModelChatMessage.User(`Create a pipeline for Model D services`));
    classificationMessage.push(vscode.LanguageModelChatMessage.Assistant(`Model D`));   //intent is one word
    classificationMessage.push(vscode.LanguageModelChatMessage.User(`##`));

    classificationMessage.push(vscode.LanguageModelChatMessage.User(`Create a pipeline for COSMIC services`));
    classificationMessage.push(vscode.LanguageModelChatMessage.Assistant(`COSMIC`));
    classificationMessage.push(vscode.LanguageModelChatMessage.User(`##`));

    classificationMessage.push(vscode.LanguageModelChatMessage.User(`Add a stage to the pipeline`));
    classificationMessage.push(vscode.LanguageModelChatMessage.Assistant(`Intent is Add stage`));
    classificationMessage.push(vscode.LanguageModelChatMessage.User(`##`));

    classificationMessage.push(vscode.LanguageModelChatMessage.User(`In the pipeline, change service tree id to xxxxxx-xxxx-xxxx-xxxx-123456789123`));
    classificationMessage.push(vscode.LanguageModelChatMessage.Assistant(`Intent is Add input values`));
    classificationMessage.push(vscode.LanguageModelChatMessage.User(`##`));

    classificationMessage.push(vscode.LanguageModelChatMessage.User(`Create a pipeline.`));
    classificationMessage.push(vscode.LanguageModelChatMessage.Assistant(`Intent is More information required`));
    classificationMessage.push(vscode.LanguageModelChatMessage.User(`##`));

    classificationMessage.push(vscode.LanguageModelChatMessage.User(`What colour is the sky?`));
    classificationMessage.push(vscode.LanguageModelChatMessage.Assistant(`Intent is Unknown`));
    classificationMessage.push(vscode.LanguageModelChatMessage.User(`##`));
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
        else if (classification.includes('Add stage')) {
            return "Add stage";
        }
        else if (classification.includes('Add input values')) {
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

