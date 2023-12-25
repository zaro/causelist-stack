import * as path from "node:path";
import * as mime from "mime-types";

import { createCheerioRouter, Dataset, KeyValueStore } from "crawlee";
import { DOWNLOAD_MIME_TYPES } from "./file-types.js";

const baseUrl = "http://kenyalaw.org/kl/";
export const router = createCheerioRouter();

interface PageDescription {
  title: string;
  url: string;
  parent?: PageDescription;
}

router.addDefaultHandler(async ({ enqueueLinks, log, $ }) => {
  const title = $("title").text();
  log.info(`enqueueing new URLs from ${title}`);
  await enqueueLinks({
    label: "submenu",
    userData: {
      submenuLevel: 2,
    },
    selector: "#left-menu > ul.nav > li > a",
    baseUrl,
  });
});

// router.addDefaultHandler(async ({ request, enqueueLinks, log, $ }) => {
//   let submenuLevel = 4;
//   const title = $("title").text();
//   log.info(`enqueueing new URLs from ${title}`);
//   const submenuLinksElements = $(
//     `#left-menu ul.nav ul.${SUBMENU_CLASSES[submenuLevel]} > li > a`
//   );

//   const subMenuLinks: MenuLink[] = Array.from(
//     submenuLinksElements.toArray().map((e) => ({
//       submenuLevel,
//       text: $(e).text(),
//       url: new URL($(e).attr("href") as string, baseUrl).toString(),
//       current: $(e).hasClass("current"),
//       parent: getMenuEntryParents($, e, submenuLevel),
//     }))
//   );
//   let current = subMenuLinks.find((l) => l.current);
//   if (!current) {
//     const currentLinkElement = $(
//       `#left-menu ul.nav li > a.current`
//     ).toArray()[0];
//     current = {
//       text: $(currentLinkElement).text(),
//       url: new URL(
//         $(currentLinkElement).attr("href") as string,
//         baseUrl
//       ).toString(),
//       current: $(currentLinkElement).hasClass("current"),
//       parent: getMenuEntryParents($, currentLinkElement, submenuLevel),
//     };
//   }
//   console.dir(current, { depth: null });
// });

const SUBMENU_CLASSES = [
  null,
  null,
  "vert-two",
  "vert-three",
  "vert-four",
  "vert-five",
];

interface MenuLink {
  text: string;
  url: string | undefined;
  path: string;
  parent?: MenuLink;
}

function getMenuEntryParents(
  $: cheerio.CheerioAPI,
  menuLink: cheerio.Element
): MenuLink | undefined {
  let parents: MenuLink[] = [];
  let cm = $(menuLink);
  while (true) {
    let selector = "ul";
    cm = cm.closest(selector);
    if (cm.length < 1) {
      break;
    }
    cm = cm.prev();
    if (!cm.text() && !cm.attr("href")) {
      break;
    }
    parents.push({
      url: new URL(cm.attr("href") as string, baseUrl).toString(),
      text: cm.text(),
      path: cm.text(),
      parent: undefined as any,
    });
  }
  if (parents.length < 1) {
    return;
  }
  let p = [];
  for (let i = parents.length - 1; i >= 0; i--) {
    p.push(parents[i].path);
    parents[i].path = p.join("/");
  }
  const parent = parents.shift();
  let current = parent as MenuLink;
  for (const p of parents) {
    current.parent = p;
    current = p;
  }

  return parent;
}

router.addHandler(
  "submenu",
  async ({ request, $, log, enqueueLinks, pushData }) => {
    const { submenuLevel } = request.userData;
    const title = $("title").text();
    log.info(`${title}`, { url: request.loadedUrl });
    const submenuLinksElements = $(
      // `#left-menu ul.nav ul.${SUBMENU_CLASSES[submenuLevel]} > li > a`
      `#left-menu ul.nav  li > a`
    );

    const subMenuLinks: MenuLink[] = Array.from(
      submenuLinksElements.toArray().map((e) => {
        const parent = getMenuEntryParents($, e);
        const text = $(e).text();
        return {
          text,
          url: new URL($(e).attr("href") as string, baseUrl).toString(),
          current: $(e).hasClass("current"),
          parent,
          path: parent ? [parent.path, text].join("/") : text,
        };
      })
    );
    const currentLinkElement = $(
      `#left-menu ul.nav li > a.current`
    ).toArray()[0];
    const parent = getMenuEntryParents($, currentLinkElement);
    const text = $(currentLinkElement).text();

    let current = {
      text,
      url: new URL(
        $(currentLinkElement).attr("href") as string,
        baseUrl
      ).toString(),
      parent,
      path: parent ? [parent.path, text].join("/") : text,
    };

    await Promise.all(
      subMenuLinks.map((l) =>
        enqueueLinks({
          label: "submenu",
          userData: {
            submenuLevel: submenuLevel + 1,
            parent: l.parent,
            text: l.text,
          },
          urls: [l.url as string],
          baseUrl,
        })
      )
    );

    await enqueueLinks({
      label: "content",
      selector: `div.page-content a`,
      userData: {
        parent: current,
      },
      baseUrl,
    });

    await pushData(current);
  }
);

router.addHandler(
  "content",
  async ({ request, log, contentType, body, response }) => {
    const { parent } = request.userData;
    const dataset = await Dataset.open("files");
    const url = request.url;

    let fileName = path.basename(request.url);
    if (fileName.startsWith("#")) {
      log.warning(`Skip saving ${url} as file resolves to anchor!`);
      return;
    }
    let recordKey = fileName;
    let extension = mime.extension(contentType.type);
    if (extension) {
      let extensions = mime.extensions[contentType.type];
      for (const e of extensions) {
        if (fileName.toLowerCase().endsWith("." + e)) {
          recordKey = fileName.replace(new RegExp(`\\.${e}$`, "i"), "");
          fileName = fileName.replace(
            new RegExp(`\\.${e}$`, "i"),
            `.${extension}`
          );
        }
      }
    }
    log.info(`Saving ${url} as key ${recordKey}`);

    KeyValueStore.setValue(recordKey, body, {
      contentType: contentType.type,
    });

    dataset.pushData({
      url,
      fileName,
      recordKey,
      extension,
      contentType: contentType.type,
      statusCode: response.statusCode,
      parent,
    });
  }
);
