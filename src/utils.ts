

export const utils = {
    download: (url: string) => {
        try {
            const a = document.createElement('a');
            a.href = url;
            a.download = url.split('/').pop() || 'download';
            a.click();
        }
        catch {

        }

    }
}