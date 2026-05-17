const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1'];

export function isLocalPreview() {
    return typeof window !== 'undefined' && LOCAL_HOSTS.includes(window.location.hostname);
}

export function getBackendMode() {
    if (typeof window === 'undefined') return 'api';
    return window.localStorage.getItem('parapharmacie_backend') || 'api';
}

export function isApiMode() {
    return getBackendMode() !== 'mock';
}
