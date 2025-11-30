declare module '@danielyaghil/vm-helper' {
    interface VmResult {
        success: boolean;
        output?: any;
        error?: string;
    }

    function vmRun(script: string, context?: Record<string, string>): Promise<VmResult>;

    export = vmRun;
}
