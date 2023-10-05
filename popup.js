const MAX_IMG_DISPLAY = 4;
const cdnImageUrls = [];

function getPageHTML() {
    return document.documentElement.outerHTML;
}

function parseHTML(html) {
    const tempElement = document.createElement('div');
    tempElement.innerHTML = html;
    return tempElement.querySelectorAll('img');
}

function displayImages(imgElements, baseUrl) {
    const domImg = document.querySelector('#show-all-img');
    let allImg = "";
    let srcArray = "";

    imgElements.forEach((img, index) => {
        let src = img.getAttribute('src');
        if (src) {
            if (src.startsWith("/")) {
                src = baseUrl + src;
            }
            cdnImageUrls.push(src);

            const imgHtml = `<img src="${src}" alt="${src}" />`;
            allImg += `<div class="image-item">${imgHtml}</div>`;

            if (index <= MAX_IMG_DISPLAY) {
                srcArray += `<div class="image-item">${imgHtml}</div>`;
            } else {
                if (srcArray.indexOf("more-photos") === -1) {
                    srcArray += `<div class="more-photos" id="more-photos">${imgElements.length - MAX_IMG_DISPLAY}++</div>`;
                }
            }
        }
    });

    domImg.innerHTML = srcArray;

    const morePhotosButton = document.getElementById('more-photos');
    morePhotosButton.addEventListener('click', function () {
        domImg.innerHTML = allImg;
    });
}

// Lấy thông tin tab hiện tại
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const tab = tabs[0];
    const url = tab.url;

    console.log(`URL: ${url}`);

    const baseUrl = new URL(url).origin;
    console.log(`BaseURL: ${baseUrl}`);

    // Lấy nội dung HTML của trang hiện tại và xử lý hình ảnh
    chrome.scripting.executeScript(
        {
            target: { tabId: tab.id },
            function: getPageHTML,
        },
        (result) => {
            if (!chrome.runtime.lastError) {
                const html = result[0].result;
                const imgElements = parseHTML(html);
                displayImages(imgElements, baseUrl);
            } else {
                console.error('An error occurred:', chrome.runtime.lastError);
            }
        }
    );
});

document.querySelector("#Download").addEventListener('click', (event) => {
    const zip = new JSZip();
    
    const imagePromises = cdnImageUrls.map(async (cdnImageUrl, index) => {
        const response = await fetch(cdnImageUrl);
        const arrayBuffer = await response.arrayBuffer();
        zip.file(`image${index + 1}.jpg`, arrayBuffer);
    });

    Promise.all(imagePromises)
        .then(() => {
            zip.generateAsync({ type: 'blob' })
                .then((content) => {
                    const url = URL.createObjectURL(content);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'images.zip';
                    a.click();
                    URL.revokeObjectURL(url);
                });
        })
        .catch((error) => {
            console.error('Error:', error);
        });
});
