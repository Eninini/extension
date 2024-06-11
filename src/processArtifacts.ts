import * as vscode from 'vscode';
import * as fs from 'fs';

export function extractAzureSubscriptionId(jsonData:any): string | undefined{
    if(typeof jsonData==='object'){
        for (const key in jsonData){
            if(jsonData.hasOwnProperty(key)){
                if(key==='azure_subscription_id'){
                    return jsonData[key];
                }
                else{
                    const value =extractAzureSubscriptionId(jsonData[key]);
                    if(value){
                        return value;
                    }
                }
            }
        }
    }
    return undefined;
}
export function processJsonFile(filePath: string): string | undefined {
    try {
        const fileContent=fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(fileContent);

        const azureSubscriptionId=extractAzureSubscriptionId(jsonData);

        return azureSubscriptionId;


    }
    catch (error){
        console.log(`Error processing JSON file: ${error}`);
        vscode.window.showErrorMessage(`Error processing JSON file`);
        return undefined;
    }
}