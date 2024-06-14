import * as fs from "node:fs";
import * as path from "node:path";
import * as util from "node:util";
import * as child_process from "node:child_process";
import got, { RequestError } from "got";
import { log } from "crawlee";

const exec = util.promisify(child_process.exec);
// const exec = (...args: Parameters<typeof execR>) => {
//   console.dir(args);
//   return execR(...args);
// };

const TIKA_JAR = path.join(
  "/opt/tika",
  fs.readdirSync("/opt/tika").at(0) ?? ""
);
const TIKA_URL = `http://localhost:9998/`;

export async function convertFileToFormats(
  fileName: string,
  convertedDir: string,
  options?: { noOcr: boolean }
) {
  let { stderr: mimeTypeError, stdout: mimeType } = await exec(
    `file --brief --mime-type ${fileName}`
  );
  mimeType = mimeType.trim();
  mimeTypeError = mimeTypeError.trim();
  if (mimeTypeError) {
    return {
      error: mimeTypeError,
    };
  }
  let txtOutFileName = path.join(
    convertedDir,
    path.basename(fileName).replace(/\.\w+$/, ".txt")
  );
  let pdfOutFileName = path.join(
    convertedDir,
    path.basename(fileName).replace(/\.\w+$/, ".pdf")
  );
  let pngOutFileNamePrefix = path.join(
    convertedDir,
    path.basename(fileName).replace(/\.\w+$/, "-page")
  );
  let toTxtCmd,
    toPdfCmd,
    textContentType = "text";
  switch (true) {
    case mimeType === "application/pdf":
      toTxtCmd = `pdftotext -layout ${fileName} ${txtOutFileName}`;
      toPdfCmd = `cp ${fileName} ${pdfOutFileName}`;
      break;
    case mimeType === "image/png" || mimeType === "image/jpeg":
      toTxtCmd = `nice tesseract ${fileName} ${txtOutFileName.replace(
        /\.txt$/,
        ""
      )}`;
      toPdfCmd = `img2pdf -o ${pdfOutFileName} ${fileName} `;
      break;
    case mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      toTxtCmd = `libreoffice --convert-to csv --outdir ${convertedDir} ${fileName}`;
      txtOutFileName = txtOutFileName.replace(/\.txt$/, ".csv");
      textContentType = "csv";
      toPdfCmd = `libreoffice --convert-to pdf --outdir ${convertedDir} ${fileName}`;
      break;
    default:
      toTxtCmd = `libreoffice --convert-to "txt:Text (encoded):UTF8" --outdir ${convertedDir} ${fileName}`;
      toPdfCmd = `libreoffice --convert-to pdf --outdir ${convertedDir} ${fileName}`;
  }
  let stderr;
  ({ stderr } = await exec(toTxtCmd));
  if (stderr) {
    return {
      error: stderr,
    };
  }
  // Convert to PDF
  ({ stderr } = await exec(toPdfCmd));
  if (stderr) {
    return {
      error: stderr,
    };
  }
  if (!options?.noOcr) {
    // Convert to PNG pages
    ({ stderr } = await exec(
      `pdftoppm -png ${pdfOutFileName} ${pngOutFileNamePrefix}`
    ));
    if (stderr) {
      return {
        error: stderr,
      };
    }
  }
  let textContent = fs.readFileSync(txtOutFileName).toString();
  let pngPagesFiles: string[] = [];
  let page = 1;
  let f;
  while (fs.existsSync((f = `${pngOutFileNamePrefix}-${page}.png`))) {
    pngPagesFiles.push(f);
    page++;
  }
  if (textContent.trim().length < 3 && !options?.noOcr) {
    // Most probably the document is only a picture, try to OCR
    let pagesText: string[] = [];
    for (const f of pngPagesFiles) {
      log.info(`OCRing ${f}...`);
      const { stdout, stderr } = await exec(
        `nice tesseract  ${f}  stdout --oem 1 --psm 4`
      );
      if (stderr) {
        console.error(`Failed OCR of ${f} with:`);
        console.error(stderr);
        continue;
      }
      pagesText.push(stdout);
    }
    textContent = pagesText.join("".padStart(80, "*"));
  }

  try {
    return {
      textContent,
      textContentType,
      pdfContentFile: pdfOutFileName,
      pngPagesFiles,
      mimeType,
    };
  } catch (e: any) {
    return {
      error: e.toString(),
    };
  }
}

export async function tikaServerStart(): Promise<child_process.ChildProcess> {
  log.info("Starting Apache Tika");
  const proc = child_process.spawn("java", ["-jar", `${TIKA_JAR}`], {
    stdio: "pipe",
  });
  let noTimeout = false;
  const killTika = () => {
    proc.kill();
  };
  process.on("SIGINT", killTika);
  process.on("SIGTERM", killTika);
  return Promise.race([
    new Promise<child_process.ChildProcess>((resolve, reject) => {
      const onData = (data: string | Buffer) => {
        const line = data.toString();
        if (line.match(/Started Apache Tika server .* at/)) {
          // proc.stdout.off("data", onData);
          // proc.stderr.off("data", onData);
          noTimeout = true;
          resolve(proc);
        }
        // log.info(`[TIKA] ${line}`);
      };
      proc.stdout.on("data", onData);
      proc.stderr.on("data", onData);
      proc.on("error", (e) => {
        reject(e);
      });
    }),
    new Promise<child_process.ChildProcess>((_resolve, reject) => {
      setTimeout(() => {
        if (!noTimeout) {
          proc.kill();
        }
        reject(new Error(`Timeout starting Tika server`));
      }, 20000);
    }),
  ]);
}

export async function tikaServerStop(
  proc: child_process.ChildProcess
): Promise<void> {
  log.info("Stopping Apache Tika");
  return new Promise((resolve, _reject) => {
    proc.on("close", () => resolve());
    proc.kill();
  });
}

export async function tikaServerInfo(): Promise<void> {
  const r = await got(`${TIKA_URL}`);
  log.info(r.body);
}

export async function convertFileToHtmlAndPossiblyPdf(
  fileName: string,
  convertedDir: string
) {
  let { stderr: mimeTypeError, stdout: mimeType } = await exec(
    `file --brief --mime-type ${fileName}`
  );
  mimeType = mimeType.trim();
  mimeTypeError = mimeTypeError.trim();
  if (mimeTypeError) {
    return {
      error: mimeTypeError,
    };
  }

  let response;
  try {
    response = await got.put(`${TIKA_URL}tika`, {
      body: fs.readFileSync(fileName),
      headers: {
        "Content-Type": mimeType,
        Accept: "text/html",
      },
    });
  } catch (e: any) {
    log.error(`${TIKA_URL}tika:  ${e.response.body}`);
    throw e;
  }
  const htmlContent = response.body;

  let toPdfCmd;
  let pdfOutFileName = path.join(
    convertedDir,
    path.basename(fileName).replace(/\.\w+$/, ".pdf")
  );
  switch (true) {
    case mimeType === "application/pdf":
      break;
    case mimeType === "image/png" || mimeType === "image/jpeg":
      toPdfCmd = `img2pdf -o ${pdfOutFileName} ${fileName} `;
      break;
    case mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      toPdfCmd = `libreoffice --convert-to pdf --outdir ${convertedDir} ${fileName}`;
      break;
    default:
      toPdfCmd = `libreoffice --convert-to pdf --outdir ${convertedDir} ${fileName}`;
  }
  // Convert to PDF
  if (toPdfCmd) {
    let { stderr } = await exec(toPdfCmd);
    if (stderr) {
      return {
        error: stderr,
      };
    }
  }

  try {
    return {
      htmlContent,
      pdfFileName: pdfOutFileName,
      mimeType,
    };
  } catch (e: any) {
    return {
      error: e.toString(),
    };
  }
}
