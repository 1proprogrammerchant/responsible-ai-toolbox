
#[derive(Serialize, Deserialize)]
pub struct CompilerOptions {
    #[serde(rename = "allowJs")]
    allow_js: bool,
    #[serde(rename = "allowSyntheticDefaultImports")]
    allow_synthetic_default_imports: bool,
    #[serde(rename = "allowUnreachableCode")]
    allow_unreachable_code: bool,
    #[serde(rename = "allowUnusedLabels")]
    allow_unused_labels: bool,
    #[serde(rename = "baseUrl")]
    base_url: String,
    declaration: bool,
    #[serde(rename = "downlevelIteration")]
    downlevel_iteration: bool,
    #[serde(rename = "emitDecoratorMetadata")]
    emit_decorator_metadata: bool,
    #[serde(rename = "experimentalDecorators")]
    experimental_decorators: bool,
    #[serde(rename = "importHelpers")]
    import_helpers: bool,
    jsx: String,
    lib: Vec<String>,
    module: String,
    #[serde(rename = "moduleResolution")]
    module_resolution: String,
    #[serde(rename = "noUnusedLocals")]
    no_unused_locals: bool,
    #[serde(rename = "noUnusedParameters")]
    no_unused_parameters: bool,
    #[serde(rename = "resolveJsonModule")]
    resolve_json_module: bool,
    #[serde(rename = "rootDir")]
    root_dir: String,
    #[serde(rename = "skipDefaultLibCheck")]
    skip_default_lib_check: bool,
    #[serde(rename = "skipLibCheck")]
    skip_lib_check: bool,
    #[serde(rename = "sourceMap")]
    source_map: bool,
    target: String,
    #[serde(rename = "typeRoots")]
    type_roots: Vec<String>,
    #[serde(rename = "esModuleInterop")]
    es_module_interop: bool,
    #[serde(rename = "forceConsistentCasingInFileNames")]
    force_consistent_casing_in_file_names: bool,
    #[serde(rename = "isolatedModules")]
    isolated_modules: bool,
    #[serde(rename = "noEmit")]
    no_emit: bool,
    strict: bool,
    #[serde(rename = "suppressImplicitAnyIndexErrors")]
    suppress_implicit_any_index_errors: bool,
    #[serde(rename = "noImplicitReturns")]
    no_implicit_returns: bool,
    #[serde(rename = "noImplicitThis")]
    no_implicit_this: bool,
    #[serde(rename = "noImplicitAny")]
    no_implicit_any: bool,
    #[serde(rename = "strictNullChecks")]
    strict_null_checks: bool,
    paths: HashMap<String, Vec<String>>,
}
