export const checkWebGPUSupport = async () => {
    if (!navigator.gpu) {
        return false;
    }

    const gpuAdapter = await navigator.gpu.requestAdapter();
    return !!gpuAdapter;
};
