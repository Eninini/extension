import * as vscode from 'vscode';
import * as fs from 'fs';


export function processRolloutspecFile(filePath: string): string {
    try {
        const fileContent=fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(fileContent);
        console.log("PARSEd",jsonData);
        let serviceModelPath: string="";
        if(jsonData.rolloutMetadata.serviceModelPath)
        { serviceModelPath=jsonData.rolloutMetadata.serviceModelPath;
        console.log("service model path", serviceModelPath);}

        return serviceModelPath;


    }
    catch (error){
        console.log(`Error processing JSON file: ${error}`);
        vscode.window.showErrorMessage(`Error processing JSON file`);
        return "";
    }
}
export function extractAzureSubscriptionId(jsonData:any): string []{
    const ids: string[] = [];

    if(typeof jsonData === 'object' && jsonData !== null){
        if(jsonData.serviceResourceGroups){
            const item=jsonData.serviceResourceGroups;
            item.forEach((element: any) => {
                if(element.azureSubscriptionId){
                    ids.push(element.azureSubscriptionId);
                }
            });
        }
    }

    return ids;
}

export function processJsonFile(filePath: string): string []{
    try {
        const fileContent=fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(fileContent);
        console.log("PARSE",jsonData);
        //this can be a string storing the id's
        const azureSubscriptionId: string []=extractAzureSubscriptionId(jsonData);
        console.log("Azure Subscription Ids", azureSubscriptionId);

        return azureSubscriptionId;


    }
    catch (error){
        console.log(`Error processing JSON file: ${error}`);
        vscode.window.showErrorMessage(`Error processing JSON file`);
        return [];
    }
}