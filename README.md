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