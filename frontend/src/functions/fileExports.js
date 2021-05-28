function fileExports(){

    function downloadXml(data){

        let hiddenLink = document.createElement('a');
        hiddenLink.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data.packageXml));
        hiddenLink.setAttribute('download', `${data.entryPoint.name}-package.xml`);            
        hiddenLink.style.display = 'none';

        document.body.appendChild(hiddenLink);
        hiddenLink.click();
        document.body.removeChild(hiddenLink); 
    }

    function copyFile(type,data){

        if (document.queryCommandSupported && document.queryCommandSupported('copy')) {
            var textarea = document.createElement('textarea');
            textarea.textContent = data[type];
            textarea.style.position = "fixed";  // Prevent scrolling to bottom of page in Microsoft Edge.
            document.body.appendChild(textarea);
            textarea.select();
            try {
                return document.execCommand("copy");  // Security exception may be thrown by some browsers.
            }
            catch (ex) {
                console.warn("Copy to clipboard failed.", ex);
                return false;
            }
            finally {
                document.body.removeChild(textarea);
            }
        }
    }

    return {downloadXml,copyFile}

}

export default fileExports