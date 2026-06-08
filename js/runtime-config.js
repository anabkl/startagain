const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1'];

function getBackendParam() {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('backend');
}

export function isLocalPreview() {
    return typeof window !== 'undefined' && LOCAL_HOSTS.includes(window.location.hostname);
}

export function getBackendMode() {
    if (typeof window === 'undefined') return 'api';

    const backend = getBackendParam();
    if (backend === 'firebase' || backend === 'mock' || backend === 'api') return backend;

    return window.localStorage.getItem('parapharmacie_backend') || 'api';
}

export function isApiMode() {
    return getBackendMode() !== 'mock';
}

export function isFirebaseEnabled() {
    if (typeof window === 'undefined') return false;

    const backend = getBackendParam();
    if (backend === 'firebase') return true;
    if (backend === 'mock' || backend === 'api') return false;

    const storedBackend = window.localStorage.getItem('parapharmacie_backend');
    if (storedBackend === 'firebase') return true;
    if (storedBackend === 'mock' || storedBackend === 'api') return false;

    return false;
}
