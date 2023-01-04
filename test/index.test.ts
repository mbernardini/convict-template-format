import convict from "convict";
import templateFormat, { replaceTemplateValues } from "../src";

describe("template format", () => {
  beforeEach(() => {
    convict.addFormats(templateFormat);
  });

  test("single dependency in top node should get replaced", () => {
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

    expect(config.get("appName")).toEqual("app.staging");
  });

  test("single dependency in nested node should get replaced", () => {
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
    replaceTemplateValues(config);

    expect(config.get("serverA.host")).toEqual("https://servera.staging.test.com");
  });


  test("nested dependency should get replaced", () => {
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
    replaceTemplateValues(config);

    expect(config.get("serverA.health")).toEqual("https://servera.staging.test.com/health");
  });


  test("circular dependency should throw an error", () => {
    const config = convict({
      depA: {
        format: "template",
        default: "${depB}"
      },
      depB: {
        format: "template",
        default: "${depA}"
      }
    });
    expect(() => replaceTemplateValues(config)).toThrowError("Dependencies not resolved within depth limit.");
  });

  test("deep nesting of dependency should throw an error", () => {
    const config = convict({
      depA: {
        format: "template",
        default: "depA"
      },
      depB: {
        format: "template",
        default: "${depH}"
      },
      depC: {
        format: "template",
        default: "${depG}"
      },
      depD: {
        format: "template",
        default: "${depF}"
      },
      depE: {
        format: "template",
        default: "${depD}"
      },
      depF: {
        format: "template",
        default: "${depC}"
      },
      depG: {
        format: "template",
        default: "${depB}"
      },
      depH: {
        format: "template",
        default: "${depA}"
      },
    });
    expect(() => replaceTemplateValues(config)).toThrowError("Dependencies not resolved within depth limit.");
  });

  test("dependency depth can be set to avoid throwing an error", () => {
    const config = convict({
      depA: {
        format: "template",
        default: "depA"
      },
      depB: {
        format: "template",
        default: "${depH}"
      },
      depC: {
        format: "template",
        default: "${depG}"
      },
      depD: {
        format: "template",
        default: "${depF}"
      },
      depE: {
        format: "template",
        default: "${depD}"
      },
      depF: {
        format: "template",
        default: "${depC}"
      },
      depG: {
        format: "template",
        default: "${depB}"
      },
      depH: {
        format: "template",
        default: "${depA}"
      },
    });
    expect(() => replaceTemplateValues(config, 4)).not.toThrowError();
    expect(config.get("depB")).toEqual("depA");
    expect(config.get("depC")).toEqual("depA");
    expect(config.get("depD")).toEqual("depA");
    expect(config.get("depE")).toEqual("depA");
    expect(config.get("depF")).toEqual("depA");
    expect(config.get("depH")).toEqual("depA");
  });
})