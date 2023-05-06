"workspace from the workspace.json"
function invalidValue(typ, val, key, parent = '') {
    const prettyTyp = prettyTypeName(typ);
    const parentText = parent ? ` on ${parent}` : '';
    const keyText = key ? ` for key "${key}"` : '';
    throw Error(`Invalid value${keyText}${parentText}. Expected ${prettyTyp} but got ${JSON.stringify(val)}`);
}

function prettyTypeName(typ) {
    if (Array.isArray(typ)) {
        if (typ.length === 2 && typ[0] === undefined) {
            return `an optional ${prettyTypeName(typ[1])}`;
        } else {
            return `one of [${typ.map(a => { return prettyTypeName(a); }).join(", ")}]`;
        }
    } else if (typeof typ === "object" && typ.literal !== undefined) {
        return typ.literal;
    } else {
        return typeof typ;
    }
}

function jsonToJSProps(typ) {
    if (typ.jsonToJS === undefined) {
        const map = {};
        typ.props.forEach((p) => map[p.json] = { key: p.js, typ: p.typ });
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}

function jsToJSONProps(typ) {
    if (typ.jsToJSON === undefined) {
        const map = {};
        typ.props.forEach((p) => map[p.js] = { key: p.json, typ: p.typ });
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}

function transform(val, typ, getProps, key = '', parent = '') {
    function transformPrimitive(typ, val) {
        if (typeof typ === typeof val) return val;
        return invalidValue(typ, val, key, parent);
    }

    function transformUnion(typs, val) {
        // val must validate against one typ in typs
        const l = typs.length;
        for (let i = 0; i < l; i++) {
            const typ = typs[i];
            try {
                return transform(val, typ, getProps);
            } catch (_) {}
        }
        return invalidValue(typs, val, key, parent);
    }

    function transformEnum(cases, val) {
        if (cases.indexOf(val) !== -1) return val;
        return invalidValue(cases.map(a => { return l(a); }), val, key, parent);
    }

    function transformArray(typ, val) {
        // val must be an array with no invalid elements
        if (!Array.isArray(val)) return invalidValue(l("array"), val, key, parent);
        return val.map(el => transform(el, typ, getProps));
    }

    function transformDate(val) {
        if (val === null) {
            return null;
        }
        const d = new Date(val);
        if (isNaN(d.valueOf())) {
            return invalidValue(l("Date"), val, key, parent);
        }
        return d;
    }

    function transformObject(props, additional, val) {
        if (val === null || typeof val !== "object" || Array.isArray(val)) {
            return invalidValue(l(ref || "object"), val, key, parent);
        }
        const result = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps, key, ref);
        });
        Object.getOwnPropertyNames(val).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps, key, ref);
            }
        });
        return result;
    }

    if (typ === "any") return val;
    if (typ === null) {
        if (val === null) return val;
        return invalidValue(typ, val, key, parent);
    }
    if (typ === false) return invalidValue(typ, val, key, parent);
    let ref = undefined;
    while (typeof typ === "object" && typ.ref !== undefined) {
        ref = typ.ref;
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ)) return transformEnum(typ, val);
    if (typeof typ === "object") {
        return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty("arrayItems")    ? transformArray(typ.arrayItems, val)
            : typ.hasOwnProperty("props")         ? transformObject(getProps(typ), typ.additional, val)
            : invalidValue(typ, val, key, parent);
    }
    // Numbers can be parsed by Date but shouldn't be.
    if (typ === Date && typeof val !== "number") return transformDate(val);
    return transformPrimitive(typ, val);
}

function cast(val, typ) {
    return transform(val, typ, jsonToJSProps);
}

function uncast(val, typ) {
    return transform(val, typ, jsToJSONProps);
}

function l(typ) {
    return { literal: typ };
}

function a(typ) {
    return { arrayItems: typ };
}

function u(...typs) {
    return { unionMembers: typs };
}

function o(props, additional) {
    return { props, additional };
}

function m(additional) {
    return { props: [], additional };
}

function r(name) {
    return { ref: name };
}

const typeMap = {
    "Welcome": o([
        { json: "version", js: "version", typ: u(undefined, 0) },
        { json: "projects", js: "projects", typ: u(undefined, r("Projects")) },
        { json: "cli", js: "cli", typ: u(undefined, r("CLI")) },
        { json: "schematics", js: "schematics", typ: u(undefined, r("WelcomeSchematics")) },
        { json: "defaultProject", js: "defaultProject", typ: u(undefined, "") },
    ], false),
    "CLI": o([
        { json: "defaultCollection", js: "defaultCollection", typ: u(undefined, "") },
    ], false),
    "Projects": o([
        { json: "causality", js: "causality", typ: u(undefined, r("Causality")) },
        { json: "core-ui", js: "core-ui", typ: u(undefined, r("Causality")) },
        { json: "counterfactuals", js: "counterfactuals", typ: u(undefined, r("Causality")) },
        { json: "dashboard", js: "dashboard", typ: u(undefined, r("Dashboard")) },
        { json: "dashboard-e2e", js: "dashboard-e2e", typ: u(undefined, r("DashboardE2E")) },
        { json: "dataset-explorer", js: "dataset-explorer", typ: u(undefined, r("Causality")) },
        { json: "e2e", js: "e2e", typ: u(undefined, r("E2E")) },
        { json: "error-analysis", js: "error-analysis", typ: u(undefined, r("Causality")) },
        { json: "fairness", js: "fairness", typ: u(undefined, r("Causality")) },
        { json: "forecasting", js: "forecasting", typ: u(undefined, r("E2E")) },
        { json: "interpret", js: "interpret", typ: u(undefined, r("Causality")) },
        { json: "interpret-text", js: "interpret-text", typ: u(undefined, r("E2E")) },
        { json: "interpret-vision", js: "interpret-vision", typ: u(undefined, r("E2E")) },
        { json: "localization", js: "localization", typ: u(undefined, r("Causality")) },
        { json: "mlchartlib", js: "mlchartlib", typ: u(undefined, r("Causality")) },
        { json: "model-assessment", js: "model-assessment", typ: u(undefined, r("Causality")) },
        { json: "widget", js: "widget", typ: u(undefined, r("Dashboard")) },
        { json: "widget-e2e", js: "widget-e2e", typ: u(undefined, r("WidgetE2E")) },
    ], false),
    "Causality": o([
        { json: "root", js: "root", typ: u(undefined, "") },
        { json: "sourceRoot", js: "sourceRoot", typ: u(undefined, "") },
        { json: "projectType", js: "projectType", typ: u(undefined, r("ProjectType")) },
        { json: "schematics", js: "schematics", typ: u(undefined, r("CausalitySchematics")) },
        { json: "architect", js: "architect", typ: u(undefined, r("CausalityArchitect")) },
    ], false),
    "CausalityArchitect": o([
        { json: "lint", js: "lint", typ: u(undefined, r("Lint")) },
        { json: "build", js: "build", typ: u(undefined, r("PurpleBuild")) },
        { json: "test", js: "test", typ: u(undefined, r("Test")) },
    ], false),
    "PurpleBuild": o([
        { json: "builder", js: "builder", typ: u(undefined, r("BuildBuilder")) },
        { json: "options", js: "options", typ: u(undefined, r("PurpleOptions")) },
        { json: "outputs", js: "outputs", typ: u(undefined, a(r("Output"))) },
    ], false),
    "PurpleOptions": o([
        { json: "outputPath", js: "outputPath", typ: u(undefined, "") },
        { json: "tsConfig", js: "tsConfig", typ: u(undefined, "") },
        { json: "project", js: "project", typ: u(undefined, "") },
        { json: "entryFile", js: "entryFile", typ: u(undefined, "") },
        { json: "external", js: "external", typ: u(undefined, a("")) },
        { json: "rollupConfig", js: "rollupConfig", typ: u(undefined, r("RollupConfig")) },
        { json: "assets", js: "assets", typ: u(undefined, a(r("Asset"))) },
        { json: "buildableProjectDepsInPackageJsonType", js: "buildableProjectDepsInPackageJsonType", typ: u(undefined, r("BuildableProjectDepsInPackageJSONType")) },
    ], false),
    "Asset": o([
        { json: "glob", js: "glob", typ: u(undefined, "") },
        { json: "input", js: "input", typ: u(undefined, r("Put")) },
        { json: "output", js: "output", typ: u(undefined, r("Put")) },
    ], false),
    "Lint": o([
        { json: "builder", js: "builder", typ: u(undefined, r("LintBuilder")) },
        { json: "options", js: "options", typ: u(undefined, r("LintOptions")) },
    ], false),
    "LintOptions": o([
        { json: "lintFilePatterns", js: "lintFilePatterns", typ: u(undefined, a("")) },
    ], false),
    "Test": o([
        { json: "builder", js: "builder", typ: u(undefined, r("TestBuilder")) },
        { json: "options", js: "options", typ: u(undefined, r("TestOptions")) },
        { json: "outputs", js: "outputs", typ: u(undefined, a("")) },
    ], false),
    "TestOptions": o([
        { json: "jestConfig", js: "jestConfig", typ: u(undefined, "") },
        { json: "passWithNoTests", js: "passWithNoTests", typ: u(undefined, true) },
    ], false),
    "CausalitySchematics": o([
    ], false),
    "Dashboard": o([
        { json: "root", js: "root", typ: u(undefined, "") },
        { json: "sourceRoot", js: "sourceRoot", typ: u(undefined, "") },
        { json: "projectType", js: "projectType", typ: u(undefined, "") },
        { json: "schematics", js: "schematics", typ: u(undefined, r("CausalitySchematics")) },
        { json: "architect", js: "architect", typ: u(undefined, r("DashboardArchitect")) },
    ], false),
    "DashboardArchitect": o([
        { json: "build", js: "build", typ: u(undefined, r("FluffyBuild")) },
        { json: "serve", js: "serve", typ: u(undefined, r("Serve")) },
        { json: "lint", js: "lint", typ: u(undefined, r("Lint")) },
        { json: "test", js: "test", typ: u(undefined, r("Test")) },
    ], false),
    "FluffyBuild": o([
        { json: "builder", js: "builder", typ: u(undefined, "") },
        { json: "options", js: "options", typ: u(undefined, r("FluffyOptions")) },
        { json: "configurations", js: "configurations", typ: u(undefined, r("BuildConfigurations")) },
        { json: "outputs", js: "outputs", typ: u(undefined, a(r("Output"))) },
    ], false),
    "BuildConfigurations": o([
        { json: "production", js: "production", typ: u(undefined, r("PurpleProduction")) },
    ], false),
    "PurpleProduction": o([
        { json: "fileReplacements", js: "fileReplacements", typ: u(undefined, a(r("FileReplacement"))) },
        { json: "optimization", js: "optimization", typ: u(undefined, true) },
        { json: "outputHashing", js: "outputHashing", typ: u(undefined, "") },
        { json: "sourceMap", js: "sourceMap", typ: u(undefined, true) },
        { json: "extractCss", js: "extractCss", typ: u(undefined, true) },
        { json: "namedChunks", js: "namedChunks", typ: u(undefined, true) },
        { json: "extractLicenses", js: "extractLicenses", typ: u(undefined, true) },
        { json: "vendorChunk", js: "vendorChunk", typ: u(undefined, true) },
        { json: "budgets", js: "budgets", typ: u(undefined, a(r("Budget"))) },
    ], false),
    "Budget": o([
        { json: "type", js: "type", typ: u(undefined, "") },
        { json: "maximumWarning", js: "maximumWarning", typ: u(undefined, "") },
        { json: "maximumError", js: "maximumError", typ: u(undefined, "") },
    ], false),
    "FileReplacement": o([
        { json: "replace", js: "replace", typ: u(undefined, "") },
        { json: "with", js: "with", typ: u(undefined, "") },
    ], false),
    "FluffyOptions": o([
        { json: "baseHref", js: "baseHref", typ: u(undefined, "") },
        { json: "outputPath", js: "outputPath", typ: u(undefined, "") },
        { json: "index", js: "index", typ: u(undefined, "") },
        { json: "main", js: "main", typ: u(undefined, "") },
        { json: "polyfills", js: "polyfills", typ: u(undefined, "") },
        { json: "tsConfig", js: "tsConfig", typ: u(undefined, "") },
        { json: "progress", js: "progress", typ: u(undefined, true) },
        { json: "memoryLimit", js: "memoryLimit", typ: u(undefined, 0) },
        { json: "globals", js: "globals", typ: u(undefined, a(r("Global"))) },
        { json: "assets", js: "assets", typ: u(undefined, a("")) },
        { json: "styles", js: "styles", typ: u(undefined, a("any")) },
        { json: "scripts", js: "scripts", typ: u(undefined, a("any")) },
        { json: "webpackConfig", js: "webpackConfig", typ: u(undefined, "") },
    ], false),
    "Global": o([
        { json: "moduleId", js: "moduleId", typ: u(undefined, "") },
        { json: "global", js: "global", typ: u(undefined, "") },
    ], false),
    "Serve": o([
        { json: "builder", js: "builder", typ: u(undefined, "") },
        { json: "options", js: "options", typ: u(undefined, r("ProductionClass")) },
        { json: "configurations", js: "configurations", typ: u(undefined, r("ServeConfigurations")) },
    ], false),
    "ServeConfigurations": o([
        { json: "production", js: "production", typ: u(undefined, r("ProductionClass")) },
    ], false),
    "ProductionClass": o([
        { json: "buildTarget", js: "buildTarget", typ: u(undefined, "") },
    ], false),
    "DashboardE2E": o([
        { json: "root", js: "root", typ: u(undefined, "") },
        { json: "sourceRoot", js: "sourceRoot", typ: u(undefined, "") },
        { json: "projectType", js: "projectType", typ: u(undefined, "") },
        { json: "architect", js: "architect", typ: u(undefined, r("DashboardE2EArchitect")) },
    ], false),
    "DashboardE2EArchitect": o([
        { json: "e2e", js: "e2e", typ: u(undefined, r("PurpleE2E")) },
        { json: "lint", js: "lint", typ: u(undefined, r("Lint")) },
    ], false),
    "PurpleE2E": o([
        { json: "builder", js: "builder", typ: u(undefined, "") },
        { json: "options", js: "options", typ: u(undefined, r("TentacledOptions")) },
        { json: "configurations", js: "configurations", typ: u(undefined, r("E2EConfigurations")) },
    ], false),
    "E2EConfigurations": o([
        { json: "production", js: "production", typ: u(undefined, r("FluffyProduction")) },
    ], false),
    "FluffyProduction": o([
        { json: "devServerTarget", js: "devServerTarget", typ: u(undefined, "") },
    ], false),
    "TentacledOptions": o([
        { json: "cypressConfig", js: "cypressConfig", typ: u(undefined, "") },
        { json: "tsConfig", js: "tsConfig", typ: u(undefined, "") },
        { json: "devServerTarget", js: "devServerTarget", typ: u(undefined, "") },
    ], false),
    "E2E": o([
        { json: "root", js: "root", typ: u(undefined, "") },
        { json: "sourceRoot", js: "sourceRoot", typ: u(undefined, "") },
        { json: "projectType", js: "projectType", typ: u(undefined, r("ProjectType")) },
        { json: "architect", js: "architect", typ: u(undefined, r("E2EArchitect")) },
    ], false),
    "E2EArchitect": o([
        { json: "e2e", js: "e2e", typ: u(undefined, r("FluffyE2E")) },
        { json: "build", js: "build", typ: u(undefined, r("PurpleBuild")) },
        { json: "lint", js: "lint", typ: u(undefined, r("Lint")) },
        { json: "test", js: "test", typ: u(undefined, r("Test")) },
    ], false),
    "FluffyE2E": o([
        { json: "builder", js: "builder", typ: u(undefined, "") },
        { json: "options", js: "options", typ: u(undefined, r("StickyOptions")) },
        { json: "configurations", js: "configurations", typ: u(undefined, r("E2EConfigurations")) },
    ], false),
    "StickyOptions": o([
        { json: "cypressConfig", js: "cypressConfig", typ: u(undefined, "") },
        { json: "tsConfig", js: "tsConfig", typ: u(undefined, "") },
    ], false),
    "WidgetE2E": o([
        { json: "root", js: "root", typ: u(undefined, "") },
        { json: "sourceRoot", js: "sourceRoot", typ: u(undefined, "") },
        { json: "projectType", js: "projectType", typ: u(undefined, "") },
        { json: "architect", js: "architect", typ: u(undefined, r("WidgetE2EArchitect")) },
    ], false),
    "WidgetE2EArchitect": o([
        { json: "e2e", js: "e2e", typ: u(undefined, r("FluffyE2E")) },
        { json: "lint", js: "lint", typ: u(undefined, r("Lint")) },
    ], false),
    "WelcomeSchematics": o([
        { json: "@nrwl/workspace", js: "@nrwl/workspace", typ: u(undefined, r("NrwlWorkspace")) },
        { json: "@nrwl/cypress", js: "@nrwl/cypress", typ: u(undefined, r("NrwlCypress")) },
        { json: "@nrwl/react", js: "@nrwl/react", typ: u(undefined, r("NrwlReact")) },
        { json: "@nrwl/next", js: "@nrwl/next", typ: u(undefined, r("NrwlNestClass")) },
        { json: "@nrwl/web", js: "@nrwl/web", typ: u(undefined, r("NrwlNestClass")) },
        { json: "@nrwl/node", js: "@nrwl/node", typ: u(undefined, r("NrwlExpressClass")) },
        { json: "@nrwl/nx-plugin", js: "@nrwl/nx-plugin", typ: u(undefined, r("NrwlNxPlugin")) },
        { json: "@nrwl/nest", js: "@nrwl/nest", typ: u(undefined, r("NrwlNestClass")) },
        { json: "@nrwl/express", js: "@nrwl/express", typ: u(undefined, r("NrwlExpressClass")) },
    ], false),
    "NrwlCypress": o([
        { json: "cypress-project", js: "cypress-project", typ: u(undefined, r("CypressProject")) },
    ], false),
    "CypressProject": o([
        { json: "linter", js: "linter", typ: u(undefined, r("Linter")) },
    ], false),
    "NrwlExpressClass": o([
        { json: "application", js: "application", typ: u(undefined, r("CypressProject")) },
        { json: "library", js: "library", typ: u(undefined, r("CypressProject")) },
    ], false),
    "NrwlNestClass": o([
        { json: "application", js: "application", typ: u(undefined, r("CypressProject")) },
    ], false),
    "NrwlNxPlugin": o([
        { json: "plugin", js: "plugin", typ: u(undefined, r("CypressProject")) },
    ], false),
    "NrwlReact": o([
        { json: "application", js: "application", typ: u(undefined, r("Application")) },
        { json: "library", js: "library", typ: u(undefined, r("Library")) },
        { json: "storybook-configuration", js: "storybook-configuration", typ: u(undefined, r("CypressProject")) },
        { json: "component", js: "component", typ: u(undefined, r("Component")) },
    ], false),
    "Application": o([
        { json: "style", js: "style", typ: u(undefined, "") },
        { json: "linter", js: "linter", typ: u(undefined, r("Linter")) },
        { json: "babel", js: "babel", typ: u(undefined, true) },
    ], false),
    "Component": o([
        { json: "style", js: "style", typ: u(undefined, "") },
    ], false),
    "Library": o([
        { json: "style", js: "style", typ: u(undefined, "") },
        { json: "linter", js: "linter", typ: u(undefined, r("Linter")) },
    ], false),
    "NrwlWorkspace": o([
        { json: "library", js: "library", typ: u(undefined, r("CypressProject")) },
    ], false),
    "BuildBuilder": [
        "@nrwl/web:package",
    ],
    "Put": [
        ".",
    ],
    "BuildableProjectDepsInPackageJSONType": [
        "dependencies",
    ],
    "RollupConfig": [
        "@nrwl/react/plugins/bundle-rollup",
        "./rollup.config.js",
    ],
    "Output": [
        "{options.outputPath}",
    ],
    "LintBuilder": [
        "@nrwl/linter:eslint",
    ],
    "TestBuilder": [
        "@nrwl/jest:jest",
    ],
    "ProjectType": [
        "library",
    ],
    "Linter": [
        "eslint",
    ],
};

module.exports = {
    "welcomeToJson": welcomeToJson,
    "toWelcome": toWelcome,
};
