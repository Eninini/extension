import * as vscode from 'vscode';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { modelD, multiCOSMIC, COSMIC } from './chatRequestHandler';

    interface Repository {
        repository: string;
        type: string;
        name: string;
        ref: string;
      }
      
      interface Pipeline {
        pipeline: string;
        source: string;
        branch: string;
      }
      
      interface Parameters {
        platform: Platform;
        stages: Stage[];
      }
      
      interface Platform {
        name: string;
        workload: string;
        serviceTreeId: string;
        serviceGroupName: string;
      }
      
      interface Stage {
        stage: string;
        displayName: string;
        variables: Variables;
        jobs: Job[];
      }
      
      interface Variables {
        stage_type: string;
        azure_subscription_ids: string;
      }
      
      interface Job {
        job: string;
        pool: Pool;
        steps: Step[];
      }
      
      interface Pool {
        type: string;
      }
      
      interface Step {
        download?: string;
        task?: string;
        inputs?: Inputs;
        displayName?: string;
      }
      
      interface Inputs {
        dropMetadataContainerName?: string;
        rootPaths?: string;
        destinationPath?: string;
        usePat?: boolean;
        EndpointProviderType?: string;
        ServiceRootPath?: string;
        RolloutSpecPath?: string;
        InlineDynamicBindingOverrides?: string;
      }
      
      interface Extends {
        template: string;
        parameters: Parameters;
      }
      
      interface YAMLStructure {
        trigger: string;
        resources: Resources;
        extends: Extends;
      }
      
      interface Resources {
        repositories: Repository[];
        pipelines: Pipeline[];
      }

      export function extractKeyValues(modelOutput: string)  {
        let intent="Unknown";
     //    const yamll=modelD.getText()
           const yamlContentD = yaml.load(modelD) as YAMLStructure;
           const yamlContentC = yaml.load(COSMIC) as YAMLStructure;
           let deepCopyYaml = JSON.parse(JSON.stringify(yamlContentD));
           modelOutput.split('\n').forEach((line: string) => {
             const key = line.split(/\s*:\s*/)[0];
             

             const value = line.split(/\s*:\s*/)[1];
             console.log(key,":",value);
 
             if(intent==="Unknown"&&key.toLowerCase().match(/intent/)){
                 intent=value;
                 if(intent.toLowerCase().match(/cosmic/))
                { deepCopyYaml=[];
                  deepCopyYaml=JSON.parse(JSON.stringify(yamlContentC));}
             }
            
             else if(key.toLowerCase().match(/service[_|\s*]*tree[_|\s*]*id/)){
                 // if(yamlContent&&yamlContent.extends){
                 //     yamlContent.extends = value;}
                //  if(typeof(yamlContent)==='object'&&yamlContent!==null){
                     deepCopyYaml.extends.parameters.platform.serviceTreeId = value;
                 
             }
             else if(key.match(/workload/)){
                    deepCopyYaml.extends.parameters.platform.workload = value;
                }
            else if(key.match(/build[_|\s*]pipeline/)){
                deepCopyYaml.resources.pipelines[0].pipeline = value;
            }
            else if(key.match(/stage[_|\s*]name/)){
               const idx=key.match(/\d+/);
               
               const id=idx?parseInt(idx[0]):0;
                deepCopyYaml.extends.parameters.stages[id].stage = value;
            }
            
            
           });
           return deepCopyYaml;
     }

     