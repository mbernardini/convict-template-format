import convict, { Path } from "convict";


const template = "template";
export default {
  [template]: {
    validate: (value: unknown) => {
      return typeof value === "string";
    }
  }
}

type templateMatch = {
  $template: string,
  dependency: string 
}
type depMap = Record<string, templateMatch[]>;
const captureGroupRegEx = /\${(.*?)}/g;

/**
 * Reducer function that builds a mapping of configuration parameters with the "template" type
 *  to their dependent configuration values based on the current convict configuration.
 *  Recurses down the configuration tree if node is not a leaf.
 * @param basePath 
 * @param conf 
 * @returns 
 */
function buildDependencyMap<T>(basePath: string[], conf: convict.Config<T>): (previousValue: depMap, currentValue: [string, unknown]) => depMap {
  return (acc: depMap, [key, value]) => {
    if((value as any)?.format === template) {
      // convict.getSchema() returns objects with additional nesting not
      //  present in the original definition so remove any internal private nodes:
      const parentRetrivalePath = basePath.filter(p => !/^_/.test(p));

      const keyPath = parentRetrivalePath.length > 0 ? `${parentRetrivalePath.join('.')}.${key}` : key;
      const templatedValue = conf.get(keyPath as Path<T>);
      const matches = [...(templatedValue as string).matchAll(captureGroupRegEx)];

      acc[keyPath] = matches.map(([$template, dependency]: RegExpMatchArray) => ({$template, dependency}));
    } else if (value !== null && typeof value === "object") {
      Object.entries(value).reduce(buildDependencyMap([...basePath, key], conf), acc);
    }
    return acc;
  }
}

/**
 * Replaces template alues in the convict configuration.
 * @param conf convict configuration
 * @param dependencyDepthLimit [optional] Can be set to allow deeper depency resolution
 * @returns 
 */
export function replaceTemplateValues<T>(conf: convict.Config<T>, dependencyDepthLimit = 3) {
  let dependancies = Object.entries(conf.getSchema()).reduce(buildDependencyMap([], conf), {});

  for(let i = 0; i < dependencyDepthLimit; i++ ) {
    for(let templatePath in dependancies) {
      const deps = dependancies[templatePath].reduce((remainder, current) => {
        if(dependancies[current.dependency] === undefined) {
          const dependValue = String(conf.get(current.dependency as Path<T>));
          const replacedValue = (conf.get(templatePath as Path<T>) as string).replace(current.$template, dependValue);
          conf.set(templatePath, replacedValue as any);
        }
        else {
          remainder.push(current);
        }
        return remainder;
      }, [] as templateMatch[]);
      if(deps.length === 0) {
        delete dependancies[templatePath];
      } else {
        dependancies[templatePath] = deps;
      }
    }
    if(Object.keys(dependancies).length === 0) {
      return;
    }
  }
  throw new Error("Dependencies not resolved within depth limit.");
}