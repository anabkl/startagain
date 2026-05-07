const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1'];

function getBackendParam() {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('backend');
}

export function isLocalPreview() {
    return typeof window !== 'undefined'
        && (window.location.protocol === 'file:' || LOCAL_HOSTS.includes(window.location.hostname));
}

export function isFirebaseEnabled() {
    if (typeof window === 'undefined') return false;

    const backend = getBackendParam();
    if (backend === 'firebase') return true;
    if (backend === 'mock') return false;

    const storedBackend = window.localStorage.getItem('parapharmacie_backend');
    if (storedBackend === 'firebase') return true;
    if (storedBackend === 'mock') return false;

    return !isLocalPreview();
}
