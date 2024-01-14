let leftAvailable = 255; // APFS MAX NAME LENGTH
leftAvailable -= ".html".length; // Extension for metadata, longer than ".pdf".

function fnv1a(s: string): number {
  let r = 2166136261;
  for (let i = 0; i < Math.ceil(s.length / 2); ++i) {
    const c1 = s.charCodeAt(i * 2);
    const c2NaN = s.charCodeAt(i * 2 + 1);
    const c2 = isNaN(c2NaN) ? 0 : c2NaN;
    const word = c1 ^ (c2 << 16);
    r ^= word;
    r *= 16777619;
  }
  return r;
}

// Emojis are not allowed for file names in Dropbox.
// And delete file system unsafe characters.
const re = /[\uD83C-\uDFFF\u2600-\u26FF\\\/:*?"<>|]+/g;
const titleFsSafe = document.title.replace(re, "").trim();
const { href, hostname, pathname, search, hash } = location;
const urlFsSafe = `${hostname}${pathname}${search}${hash}`.replace(re, "_");

const fnvHash = fnv1a(`${document.title}${href}`).toString(32);
leftAvailable -= fnvHash.length;

let safeTitle = titleFsSafe;
let safeUrl = urlFsSafe;
const titleUtf8 = new TextEncoder().encode(titleFsSafe.normalize("NFD"));
const sumLength = titleUtf8.length + urlFsSafe.length;
if (leftAvailable < sumLength) {
  const titlePart = Math.ceil((titleUtf8.length / sumLength) * leftAvailable);
  safeTitle = new TextDecoder().decode(titleUtf8.slice(0, titlePart));
  // I'm not sure why, but one more character have to be removed.
  safeUrl = urlFsSafe.slice(0, leftAvailable - titlePart - 1);
}

if (!document.head.dataset.title4pdforiginaltitle || document.head.dataset.title4pdforiginalurl !== href) {
  document.head.dataset.title4pdforiginaltitle = document.title;
  document.title = `${safeUrl}${safeTitle}${fnvHash}`;

  document.head.dataset.title4pdforiginalurl = href;
}
const originalTitle = document.head.dataset.title4pdforiginaltitle;

const dlElement = document.createElement("dl");
const dtUrlElement = document.createElement("dt");
dtUrlElement.textContent = "URL";
dlElement.appendChild(dtUrlElement);

const ddUrlElement = document.createElement("dd");
ddUrlElement.textContent = href;
dlElement.appendChild(ddUrlElement);

const dtTitleElement = document.createElement("dt");
dtTitleElement.textContent = "Title";
dlElement.appendChild(dtTitleElement);

const ddTitleElement = document.createElement("dd");
ddTitleElement.textContent = originalTitle;
dlElement.appendChild(ddTitleElement);

const dtPdfNameElement = document.createElement("dt");
dtPdfNameElement.textContent = "PDF Name";
dlElement.appendChild(dtPdfNameElement);

const ddPdfNameElement = document.createElement("dd");
ddPdfNameElement.textContent = document.title;
dlElement.appendChild(ddPdfNameElement);

const a = document.createElement("a");
a.href = URL.createObjectURL(
  new Blob(
    [dlElement.outerHTML],
    { type: "text/html;charset=UTF-8" },
  )
);
a.download = `${document.title}.html`;
a.click();
