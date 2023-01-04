# convict-template-type

Allows for `template` strings inside of [node-convict](https://www.npmjs.com/package/convict)
configurations with one additional line of code allowing you to define configuration values
in terms of other configuration values.

## Install
```
npm install convict-template-format
```

## Usage
### TypeScript

The `template` type can be added to a convict schema as shown in the example and
the value will be replaced when calling the `replaceTemplateValues` function.

Example:
```
import convict from "convict";
import templateFormat, { replaceTemplateValues } from "convict-template-format";

convict.addFormats(templateFormat);

const config = convict({
  deployment: {
    format: String,
    default: "staging"
  },
  appName: {
    format: "template",
    default: "app.${deployment}"
  }
});

replaceTemplateValues(config);

config.validate();
```

Templates can reference nested values as well as other template values:
```
const config = convict({
  deployment: {
    format: String,
    default: "staging"
  },
  serverA : {
    host: {
      format: "template",
      default: "https://servera.${deployment}.test.com"
    },
    health: {
      format: "template",
      default: "${serverA.host}/health"
    }
  }
});
```

Circular dependenancies will throw an Error,