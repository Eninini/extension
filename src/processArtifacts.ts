import * as vscode from 'vscode';
import * as fs from 'fs';

export function extractAzureSubscriptionId(jsonData:any): string []{
    const ids: string[] = [];

    function collectIds(data: any, visited: Set<any>) {
        if (typeof data === 'object' && data !== null && !visited.has(data)) {
            visited.add(data);
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    if (key === 'azureSubscriptionId') {
                        console.log(data[key]);
                        ids.push(data[key]);
                    } else {
                        collectIds(data[key], visited);
                    }
                }
            }
        }
    }

    const visited = new Set<any>();
    collectIds(jsonData, visited);
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