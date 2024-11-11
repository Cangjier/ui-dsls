

export const utils = {
    download: (url: string) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = url.split('/').pop() || 'download';
        a.click();
    }
}